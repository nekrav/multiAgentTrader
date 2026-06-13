from __future__ import annotations

import json
import urllib.request
from typing import Any

from aitraders.agents.backtesting import run_real_history_backtest


DEFAULT_STRATEGY_LAB_URL = "http://localhost:5010"


def research_strategy(payload: dict[str, Any]) -> dict[str, Any]:
    backtest = payload.get("backtestResult") if isinstance(payload.get("backtestResult"), dict) else None
    if bool(payload.get("runBacktest")):
        backtest = call_strategy_lab(payload)

    market_snapshot = extract_nested(payload.get("marketSnapshot"))
    risk_check = extract_nested(payload.get("riskCheck"))
    proposals = build_proposals(market_snapshot=market_snapshot, risk_check=risk_check, backtest=backtest)

    return {
        "summary": summarize(proposals, backtest),
        "proposals": proposals,
        "backtest": summarize_backtest(backtest) if backtest else None,
        "backtestDetails": backtest if backtest and backtest.get("mode") == "real_history" else None,
        "inputs": {
            "hasMarketSnapshot": bool(market_snapshot),
            "hasRiskCheck": bool(risk_check),
            "hasBacktest": bool(backtest),
            "evaluatedStrategies": normalize_strategies(market_snapshot=market_snapshot, risk_check=risk_check, backtest=backtest),
        },
    }


def call_strategy_lab(payload: dict[str, Any]) -> dict[str, Any]:
    if not payload.get("strategyLabUrl"):
        return run_real_history_backtest(payload)

    strategy_lab_url = str(payload.get("strategyLabUrl") or DEFAULT_STRATEGY_LAB_URL).rstrip("/")
    request_payload = {
        "assets": payload.get("assets") or ["BTC", "ETH"],
        "days": int(payload.get("days", 2)),
        "granularity": int(payload.get("granularity", 300)),
        "starting_cash": float(payload.get("startingCash", 1000)),
        "fee_bps": float(payload.get("feeBps", 6)),
        "slippage_bps": float(payload.get("slippageBps", 2)),
        "strategies": payload.get("strategies") or ["market_favorite_90", "market_favorite_95"],
        "payout_mode": str(payload.get("payoutMode") or "binary_polymarket"),
        "use_cache": False,
    }
    encoded = json.dumps(request_payload).encode("utf-8")
    request = urllib.request.Request(
        f"{strategy_lab_url}/api/backtest",
        data=encoded,
        headers={"Content-Type": "application/json", "User-Agent": "AiTraders-StrategyResearchAgent/0.1"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=float(payload.get("timeout", 90))) as response:
        return json.loads(response.read().decode("utf-8"))


def build_proposals(
    *,
    market_snapshot: dict[str, Any],
    risk_check: dict[str, Any],
    backtest: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    proposals: list[dict[str, Any]] = []
    requested_strategies = normalize_strategies(market_snapshot=market_snapshot, risk_check=risk_check, backtest=backtest)
    risk_level = str(risk_check.get("riskLevel", "unknown")).lower()
    risk_passed = risk_check.get("passed")
    volatility = market_snapshot.get("volatility", {}) if market_snapshot else {}
    volatility_level = str(volatility.get("level", "unknown")).lower()
    trend = str(market_snapshot.get("trend", "unknown")).lower() if market_snapshot else "unknown"

    if risk_passed is False or risk_level == "high" or volatility_level == "high":
        proposals.append(
            {
                "id": "no_live_promotion_high_risk",
                "action": "do_not_trade",
                "confidence": 0.9,
                "parameters": {"reason": "high_risk_or_high_volatility", "strategies": requested_strategies},
                "rationale": "Risk/volatility conditions are not suitable for promoting a live strategy.",
            }
        )
        return proposals

    backtest_summary = summarize_backtest(backtest) if backtest else {}
    pnl = as_float(backtest_summary.get("pnl"))
    max_drawdown = as_float(backtest_summary.get("maxDrawdownPct"))
    trade_count = as_int(backtest_summary.get("trades"))

    if pnl is not None and pnl > 0 and (max_drawdown is None or max_drawdown > -2.0):
        proposals.append(
            {
                "id": "promote_market_favorite_after_positive_backtest",
                "action": "propose_config",
                "confidence": 0.78,
                "parameters": {
                    "strategies": requested_strategies,
                    "minEdgePct": 0.3,
                    "entryWindowSecondsLeft": [20, 90],
                    "maxVolatilitySeverity": 2.0,
                },
                "rationale": f"Backtest PnL is positive ({pnl:.2f}) with acceptable drawdown.",
            }
        )
    elif backtest is not None:
        proposals.append(
            {
                "id": "reject_negative_or_weak_backtest",
                "action": "reject_config",
                "confidence": 0.82,
                "parameters": {"minPnlRequired": 0, "minTradesPreferred": 30},
                "rationale": "Backtest result is not strong enough to promote live parameters.",
            }
        )

    if volatility_level in {"low", "unknown"} and trend in {"up", "down", "flat", "unknown"}:
        proposals.append(
            {
                "id": "test_market_favorite_tight_risk",
                "action": "test_in_strategy_lab",
                "confidence": 0.68,
                "parameters": {
                    "strategies": requested_strategies,
                    "payoutMode": "binary_polymarket",
                    "assets": preferred_assets(market_snapshot),
                    "days": 2,
                    "maxVolatilitySeverity": 1.75,
                },
                "rationale": "Current market snapshot is not volatile, so favorite-following should be tested with tighter risk gates.",
            }
        )

    if volatility_level == "medium":
        proposals.append(
            {
                "id": "tighten_volatility_before_research",
                "action": "test_in_strategy_lab",
                "confidence": 0.7,
                "parameters": {"maxVolatilitySeverity": 1.5, "skipFastMoveX": 3.0},
                "rationale": "Medium volatility needs stricter filters before strategy promotion.",
            }
        )

    if not proposals:
        proposals.append(
            {
                "id": "collect_more_data",
                "action": "observe",
                "confidence": 0.55,
                "parameters": {"requiredInputs": ["marketSnapshot", "riskCheck", "backtestResult"]},
                "rationale": "Not enough evidence to promote or reject a strategy.",
            }
        )

    for proposal in proposals:
        proposal["estimatedTrades"] = trade_count
    return proposals


def summarize(proposals: list[dict[str, Any]], backtest: dict[str, Any] | None) -> str:
    actions = ", ".join(sorted({str(proposal["action"]) for proposal in proposals}))
    if backtest:
        return f"Generated {len(proposals)} proposal(s) using market/risk inputs and backtest evidence: {actions}."
    return f"Generated {len(proposals)} proposal(s) from current market/risk inputs: {actions}."


def summarize_backtest(backtest: dict[str, Any] | None) -> dict[str, Any]:
    if not backtest:
        return {}
    portfolio = backtest.get("portfolio") if isinstance(backtest.get("portfolio"), dict) else backtest
    return {
        "returnPct": first_number(portfolio, ["return_pct", "returnPct", "total_return_pct"]),
        "pnl": first_number(portfolio, ["pnl", "pnl_usdc", "profit"]),
        "maxDrawdownPct": first_number(portfolio, ["max_drawdown_pct", "maxDrawdownPct", "drawdown"]),
        "trades": first_int(portfolio, ["trades", "trade_count", "total_trades"]),
        "winRate": first_number(portfolio, ["win_rate", "winRate"]),
    }


def extract_nested(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        return {}
    current = value
    while isinstance(current.get("result"), dict):
        current = current["result"]
    return current


def normalize_strategies(*, market_snapshot: dict[str, Any], risk_check: dict[str, Any], backtest: dict[str, Any] | None) -> list[str]:
    strategy_sources = [
        market_snapshot.get("strategies") if isinstance(market_snapshot, dict) else None,
        risk_check.get("strategies") if isinstance(risk_check, dict) else None,
        backtest.get("strategies") if isinstance(backtest, dict) else None,
    ]
    for value in strategy_sources:
        if isinstance(value, list) and value:
            return [str(item) for item in value[:8]]
    asset = str(market_snapshot.get("asset") or "").upper()
    if "/" in asset or any(code in asset for code in ["EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"]):
        return ["trend_momentum_continuation", "london_session_breakout", "mean_reversion_exhaustion"]
    return ["market_favorite_90", "market_favorite_95"]


def preferred_assets(market_snapshot: dict[str, Any]) -> list[str]:
    asset = str(market_snapshot.get("asset") or "").upper()
    if "/" in asset:
        return [asset]
    if asset in {"BTC", "BTC-USD"}:
        return ["BTC"]
    if asset in {"ETH", "ETH-USD"}:
        return ["ETH"]
    return ["BTC", "ETH"]


def first_number(data: dict[str, Any], keys: list[str]) -> float | None:
    for key in keys:
        value = as_float(data.get(key))
        if value is not None:
            return value
    return None


def first_int(data: dict[str, Any], keys: list[str]) -> int | None:
    for key in keys:
        value = as_int(data.get(key))
        if value is not None:
            return value
    return None


def as_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def as_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
