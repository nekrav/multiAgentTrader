from __future__ import annotations

import math
import statistics
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Iterable


COINBASE_PRODUCTS = {
    "BTC": "BTC-USD",
    "BTC-USD": "BTC-USD",
    "ETH": "ETH-USD",
    "ETH-USD": "ETH-USD",
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
    if not product:
        raise ValueError(f"Unsupported asset: {asset}")
    return product


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


def volatility_level(severity_x: float) -> str:
    if severity_x >= 2.0:
        return "high"
    if severity_x >= 1.2:
        return "medium"
    return "low"


def build_snapshot(asset: str, *, granularity: int = 60, limit: int = 120) -> dict[str, Any]:
    candles = fetch_coinbase_candles(asset, granularity=granularity, limit=limit)
    metrics = compute_market_metrics(candles)
    metrics["asset"] = normalize_asset(asset)
    metrics["granularity"] = granularity
    metrics["candles"] = len(candles)
    return metrics
