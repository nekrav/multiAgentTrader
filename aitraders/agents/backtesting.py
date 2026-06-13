from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

from aitraders.agents.market_data import Candle, fetch_coinbase_candles, fetch_frankfurter_candles, normalize_asset


DEFAULT_STRATEGIES = ("trend_momentum_continuation", "mean_reversion_exhaustion", "squeeze_breakout_confirmation")


@dataclass(frozen=True)
class BacktestConfig:
    assets: tuple[str, ...]
    strategies: tuple[str, ...]
    days: int = 90
    granularity: int = 3600
    starting_cash: float = 1000.0
    fee_bps: float = 2.0
    slippage_bps: float = 1.0


def run_real_history_backtest(payload: dict[str, Any]) -> dict[str, Any]:
    config = config_from_payload(payload)
    full_results: list[dict[str, Any]] = []
    trades: list[dict[str, Any]] = []

    for asset in config.assets:
        candles = fetch_history(asset, days=config.days, granularity=config.granularity)
        for strategy in config.strategies:
            result = backtest_strategy(asset=normalize_asset(asset), strategy=strategy, candles=candles, config=config)
            full_results.append(result)
            trades.extend(result["tradeRows"][-20:])

    portfolio = aggregate_portfolio(full_results, config.starting_cash)
    ranked_full = sorted(full_results, key=lambda item: (float(item["returnPct"]), float(item["expectancyPct"])), reverse=True)
    ranked = [{key: value for key, value in item.items() if key != "tradeRows"} for item in ranked_full]
    return {
        "mode": "real_history",
        "dataSource": "Coinbase Exchange candles for crypto; Frankfurter daily rates for forex.",
        "config": {
            "assets": list(config.assets),
            "strategies": list(config.strategies),
            "days": config.days,
            "granularity": config.granularity,
            "startingCash": config.starting_cash,
            "feeBps": config.fee_bps,
            "slippageBps": config.slippage_bps,
        },
        "portfolio": portfolio,
        "strategies": list(config.strategies),
        "strategyResults": ranked,
        "trades": sorted(trades, key=lambda item: str(item["exitTime"]))[-50:],
        "summary": summarize_backtest(ranked, portfolio),
    }


def config_from_payload(payload: dict[str, Any]) -> BacktestConfig:
    raw_assets = payload.get("assets")
    if not isinstance(raw_assets, list) or not raw_assets:
        raw_asset = payload.get("asset") or payload.get("market") or "BTC"
        raw_assets = [raw_asset]
    raw_strategies = payload.get("strategies")
    if not isinstance(raw_strategies, list) or not raw_strategies:
        raw_strategies = list(DEFAULT_STRATEGIES)

    return BacktestConfig(
        assets=tuple(str(asset) for asset in raw_assets[:8]),
        strategies=tuple(str(strategy) for strategy in raw_strategies[:12]),
        days=max(5, min(365, int(payload.get("days", 90)))),
        granularity=int(payload.get("granularity", 3600)),
        starting_cash=max(100.0, float(payload.get("startingCash", 1000))),
        fee_bps=max(0.0, float(payload.get("feeBps", 2))),
        slippage_bps=max(0.0, float(payload.get("slippageBps", 1))),
    )


def fetch_history(asset: str, *, days: int, granularity: int) -> list[Candle]:
    normalized = normalize_asset(asset)
    if "/" in normalized:
        return fetch_frankfurter_candles(normalized, limit=min(max(days, 20), 365))
    limit = min(300, max(30, int(days * 24 * 3600 / max(granularity, 60))))
    return fetch_coinbase_candles(normalized, granularity=granularity, limit=limit)


def backtest_strategy(*, asset: str, strategy: str, candles: list[Candle], config: BacktestConfig) -> dict[str, Any]:
    closes = [candle.close for candle in candles]
    returns: list[float] = []
    trades: list[dict[str, Any]] = []
    fee_pct = (config.fee_bps + config.slippage_bps) / 100.0

    for index in range(22, len(candles) - 1):
        signal = signal_for_strategy(strategy, closes, index)
        if signal == 0:
            continue
        entry = candles[index].close
        exit_price = candles[index + 1].close
        gross = ((exit_price - entry) / entry) * 100.0 * signal
        net = gross - fee_pct
        returns.append(net)
        trades.append(
            {
                "asset": asset,
                "strategy": strategy,
                "side": "long" if signal > 0 else "short",
                "entryTime": candles[index].time,
                "exitTime": candles[index + 1].time,
                "entry": round(entry, 5),
                "exit": round(exit_price, 5),
                "returnPct": round(net, 5),
            }
        )

    pnl = config.starting_cash * (sum(returns) / 100.0)
    wins = [value for value in returns if value > 0]
    losses = [value for value in returns if value <= 0]
    equity_curve = equity_from_returns(returns, config.starting_cash)
    max_drawdown = max_drawdown_pct(equity_curve)
    return {
        "asset": asset,
        "strategy": strategy,
        "candles": len(candles),
        "trades": len(returns),
        "winRate": round(len(wins) / len(returns), 4) if returns else 0.0,
        "returnPct": round(sum(returns), 4),
        "pnl": round(pnl, 4),
        "maxDrawdownPct": round(max_drawdown, 4),
        "expectancyPct": round(sum(returns) / len(returns), 5) if returns else 0.0,
        "avgWinPct": round(sum(wins) / len(wins), 5) if wins else 0.0,
        "avgLossPct": round(sum(losses) / len(losses), 5) if losses else 0.0,
        "tradesPreview": trades[-8:],
        "tradeRows": trades,
    }


def signal_for_strategy(strategy: str, closes: list[float], index: int) -> int:
    fast = mean(closes[index - 5 : index])
    slow = mean(closes[index - 20 : index])
    previous_fast = mean(closes[index - 6 : index - 1])
    previous_slow = mean(closes[index - 21 : index - 1])
    latest = closes[index]
    window = closes[index - 20 : index]
    z_score = (latest - mean(window)) / (stddev(window) or 0.0001)
    momentum = (latest - closes[index - 5]) / closes[index - 5]
    range_high = max(window)
    range_low = min(window)

    if strategy in {"trend_momentum_continuation", "london_session_breakout", "market_favorite_90", "market_favorite_95"}:
        if fast > slow and previous_fast <= previous_slow:
            return 1
        if fast < slow and previous_fast >= previous_slow:
            return -1
    if strategy == "ny_session_reversal":
        if z_score > 1.25 and momentum < 0:
            return -1
        if z_score < -1.25 and momentum > 0:
            return 1
    if strategy == "mean_reversion_exhaustion":
        if z_score > 1.65:
            return -1
        if z_score < -1.65:
            return 1
    if strategy in {"squeeze_breakout_confirmation", "pattern_breakout_with_trend_filter"}:
        if latest >= range_high and momentum > 0:
            return 1
        if latest <= range_low and momentum < 0:
            return -1
    if strategy == "reversal_confluence":
        if z_score > 1.2 and latest < closes[index - 1]:
            return -1
        if z_score < -1.2 and latest > closes[index - 1]:
            return 1
    return 0


def aggregate_portfolio(results: list[dict[str, Any]], starting_cash: float) -> dict[str, Any]:
    trades = sum(int(item["trades"]) for item in results)
    pnl = sum(float(item["pnl"]) for item in results)
    weighted_wins = sum(float(item["winRate"]) * int(item["trades"]) for item in results)
    max_drawdown = min((float(item["maxDrawdownPct"]) for item in results), default=0.0)
    return {
        "pnl": round(pnl, 4),
        "returnPct": round((pnl / starting_cash) * 100.0, 4),
        "maxDrawdownPct": round(max_drawdown, 4),
        "trades": trades,
        "winRate": round(weighted_wins / trades, 4) if trades else 0.0,
    }


def summarize_backtest(results: list[dict[str, Any]], portfolio: dict[str, Any]) -> str:
    best = results[0] if results else None
    if not best:
        return "No trades were generated on the selected historical window."
    return (
        f"Backtested {len(results)} strategy/asset combination(s) on real history. "
        f"Best result: {best['asset']} {best['strategy']} at {best['returnPct']}% with {best['trades']} trades. "
        f"Portfolio return: {portfolio['returnPct']}%."
    )


def equity_from_returns(returns: list[float], starting_cash: float) -> list[float]:
    equity = starting_cash
    curve = [equity]
    for value in returns:
        equity *= 1.0 + value / 100.0
        curve.append(equity)
    return curve


def max_drawdown_pct(curve: list[float]) -> float:
    peak = curve[0] if curve else 0.0
    drawdown = 0.0
    for value in curve:
        peak = max(peak, value)
        if peak > 0:
            drawdown = min(drawdown, ((value - peak) / peak) * 100.0)
    return drawdown


def mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def stddev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    avg = mean(values)
    variance = sum((value - avg) ** 2 for value in values) / len(values)
    return math.sqrt(variance)
