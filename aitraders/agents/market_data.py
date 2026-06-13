from __future__ import annotations

import math
import statistics
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any, Iterable


COINBASE_PRODUCTS = {
    "BTC": "BTC-USD",
    "BTC-USD": "BTC-USD",
    "ETH": "ETH-USD",
    "ETH-USD": "ETH-USD",
}

FOREX_PAIRS = {
    "EUR/USD": ("EUR", "USD"),
    "EURUSD": ("EUR", "USD"),
    "EUR-USD": ("EUR", "USD"),
    "GBP/USD": ("GBP", "USD"),
    "GBPUSD": ("GBP", "USD"),
    "GBP-USD": ("GBP", "USD"),
    "USD/JPY": ("USD", "JPY"),
    "USDJPY": ("USD", "JPY"),
    "USD-JPY": ("USD", "JPY"),
    "AUD/USD": ("AUD", "USD"),
    "AUDUSD": ("AUD", "USD"),
    "AUD-USD": ("AUD", "USD"),
    "USD/CAD": ("USD", "CAD"),
    "USDCAD": ("USD", "CAD"),
    "USD-CAD": ("USD", "CAD"),
    "USD/CHF": ("USD", "CHF"),
    "USDCHF": ("USD", "CHF"),
    "USD-CHF": ("USD", "CHF"),
    "NZD/USD": ("NZD", "USD"),
    "NZDUSD": ("NZD", "USD"),
    "NZD-USD": ("NZD", "USD"),
    "EUR/GBP": ("EUR", "GBP"),
    "EURGBP": ("EUR", "GBP"),
    "EUR-GBP": ("EUR", "GBP"),
    "EUR/JPY": ("EUR", "JPY"),
    "EURJPY": ("EUR", "JPY"),
    "EUR-JPY": ("EUR", "JPY"),
    "GBP/JPY": ("GBP", "JPY"),
    "GBPJPY": ("GBP", "JPY"),
    "GBP-JPY": ("GBP", "JPY"),
}


@dataclass(frozen=True)
class Candle:
    time: int
    low: float
    high: float
    open: float
    close: float
    volume: float

    @property
    def range_pct(self) -> float:
        if self.open <= 0:
            return 0.0
        return (self.high - self.low) / self.open * 100.0

    @property
    def return_pct(self) -> float:
        if self.open <= 0:
            return 0.0
        return (self.close - self.open) / self.open * 100.0


def normalize_asset(asset: str) -> str:
    product = COINBASE_PRODUCTS.get(asset.upper())
    if product:
        return product
    base_quote = FOREX_PAIRS.get(asset.upper())
    if base_quote:
        return f"{base_quote[0]}/{base_quote[1]}"
    raise ValueError(f"Unsupported asset: {asset}")


def fetch_coinbase_candles(
    asset: str,
    *,
    granularity: int = 60,
    limit: int = 120,
    timeout: float = 10.0,
) -> list[Candle]:
    product = normalize_asset(asset)
    end = int(time.time())
    start = end - granularity * limit
    query = urllib.parse.urlencode(
        {
            "granularity": granularity,
            "start": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(start)),
            "end": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(end)),
        }
    )
    url = f"https://api.exchange.coinbase.com/products/{product}/candles?{query}"
    request = urllib.request.Request(url, headers={"User-Agent": "AiTraders-MarketDataAgent/0.1"})

    with urllib.request.urlopen(request, timeout=timeout) as response:
        raw = response.read().decode("utf-8")

    import json

    rows = json.loads(raw)
    candles = [
        Candle(
            time=int(row[0]),
            low=float(row[1]),
            high=float(row[2]),
            open=float(row[3]),
            close=float(row[4]),
            volume=float(row[5]),
        )
        for row in rows
    ]
    return sorted(candles, key=lambda candle: candle.time)


def fetch_frankfurter_candles(asset: str, *, limit: int = 120, timeout: float = 10.0) -> list[Candle]:
    base, quote = require_forex_pair(asset)
    end = date.today()
    # Request extra calendar days so weekends and holidays still leave enough observations.
    start = end - timedelta(days=max(limit * 2, 40))
    url = f"https://api.frankfurter.app/{start.isoformat()}..{end.isoformat()}?from={base}&to={quote}"
    request = urllib.request.Request(url, headers={"User-Agent": "AiTraders-MarketDataAgent/0.1"})

    import json

    with urllib.request.urlopen(request, timeout=timeout) as response:
        raw = response.read().decode("utf-8")

    rows = json.loads(raw)
    rates = rows.get("rates") if isinstance(rows, dict) else {}
    closes: list[tuple[str, float]] = []
    for day, values in sorted(rates.items()):
        if isinstance(values, dict) and quote in values:
            closes.append((str(day), float(values[quote])))
    closes = closes[-limit:]
    if len(closes) < 2:
        raise ValueError(f"Not enough FX rate history for {base}/{quote}.")

    candles: list[Candle] = []
    previous_close = closes[0][1]
    for day, close in closes:
        ts = int(time.mktime(time.strptime(day, "%Y-%m-%d")))
        open_price = previous_close
        span = max(abs(close - open_price), close * 0.001)
        high = max(open_price, close) + span * 0.35
        low = min(open_price, close) - span * 0.35
        candles.append(Candle(time=ts, low=low, high=high, open=open_price, close=close, volume=0.0))
        previous_close = close
    return candles


def compute_market_metrics(candles: Iterable[Candle]) -> dict[str, Any]:
    series = list(candles)
    if len(series) < 2:
        raise ValueError("At least two candles are required.")

    latest = series[-1]
    ranges = [candle.range_pct for candle in series[-30:]]
    returns = [candle.return_pct for candle in series[-30:]]
    baseline = statistics.median(ranges[:-1]) if len(ranges) > 2 else max(ranges[0], 0.0001)
    baseline = baseline if baseline > 0 else 0.0001
    volatility_x = latest.range_pct / baseline
    realized_volatility_pct = statistics.pstdev(returns) if len(returns) > 1 else 0.0

    closes = [candle.close for candle in series]
    sma_fast = statistics.mean(closes[-5:])
    sma_slow = statistics.mean(closes[-20:]) if len(closes) >= 20 else statistics.mean(closes)
    trend = "up" if sma_fast > sma_slow else "down" if sma_fast < sma_slow else "flat"
    fast_move_x = abs(latest.return_pct) / (statistics.median([abs(item) for item in returns[:-1]]) or 0.0001)

    return {
        "observedAt": int(time.time()),
        "spotPrice": latest.close,
        "latestCandle": {
            "time": latest.time,
            "open": latest.open,
            "high": latest.high,
            "low": latest.low,
            "close": latest.close,
            "volume": latest.volume,
            "rangePct": round(latest.range_pct, 5),
            "returnPct": round(latest.return_pct, 5),
        },
        "priceSeries": [serialize_candle(candle) for candle in series[-60:]],
        "trend": trend,
        "smaFast": round(sma_fast, 4),
        "smaSlow": round(sma_slow, 4),
        "volatility": {
            "rangePct": round(latest.range_pct, 5),
            "realizedPct": round(realized_volatility_pct, 5),
            "baselineRangePct": round(baseline, 5),
            "severityX": round(volatility_x, 3),
            "fastMoveX": round(fast_move_x if math.isfinite(fast_move_x) else 0.0, 3),
            "level": volatility_level(volatility_x),
        },
    }


def serialize_candle(candle: Candle) -> dict[str, float | int]:
    return {
        "time": candle.time,
        "open": round(candle.open, 5),
        "high": round(candle.high, 5),
        "low": round(candle.low, 5),
        "close": round(candle.close, 5),
        "volume": round(candle.volume, 8),
        "rangePct": round(candle.range_pct, 5),
        "returnPct": round(candle.return_pct, 5),
    }


def volatility_level(severity_x: float) -> str:
    if severity_x >= 2.0:
        return "high"
    if severity_x >= 1.2:
        return "medium"
    return "low"


def build_snapshot(asset: str, *, granularity: int = 60, limit: int = 120) -> dict[str, Any]:
    normalized = normalize_asset(asset)
    candles = (
        fetch_frankfurter_candles(normalized, limit=limit)
        if "/" in normalized
        else fetch_coinbase_candles(normalized, granularity=granularity, limit=limit)
    )
    metrics = compute_market_metrics(candles)
    metrics["asset"] = normalized
    metrics["assetClass"] = "forex" if "/" in normalized else "crypto"
    metrics["granularity"] = granularity
    metrics["candles"] = len(candles)
    return metrics


def require_forex_pair(asset: str) -> tuple[str, str]:
    base_quote = FOREX_PAIRS.get(asset.upper())
    if base_quote:
        return base_quote
    if "/" in asset:
        base, quote = asset.upper().split("/", 1)
        if base and quote:
            return base, quote
    raise ValueError(f"Unsupported forex pair: {asset}")
