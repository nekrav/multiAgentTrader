from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class RiskThresholds:
    max_volatility_severity: float = 2.0
    max_range_pct: float = 0.12
    max_fast_move_x: float = 4.0
    max_spread_pct: float = 3.0
    min_liquidity_usdc: float = 100.0
    max_recent_losses: int = 4
    min_ev_pct: float = 0.3


def evaluate_risk(snapshot: dict[str, Any], thresholds: RiskThresholds | None = None) -> dict[str, Any]:
    limits = thresholds or RiskThresholds()
    normalized = normalize_snapshot(snapshot)
    vetoes: list[str] = []
    warnings: list[str] = []

    volatility = normalized.get("volatility", {})
    severity_x = as_float(volatility.get("severityX"))
    range_pct = as_float(volatility.get("rangePct"))
    fast_move_x = as_float(volatility.get("fastMoveX"))

    if severity_x is not None and severity_x >= limits.max_volatility_severity:
        vetoes.append(f"volatility severity {severity_x:.2f}x >= {limits.max_volatility_severity:.2f}x")
    elif severity_x is not None and severity_x >= limits.max_volatility_severity * 0.75:
        warnings.append(f"volatility elevated at {severity_x:.2f}x")

    if range_pct is not None and range_pct >= limits.max_range_pct:
        vetoes.append(f"range {range_pct:.3f}% >= {limits.max_range_pct:.3f}%")

    if fast_move_x is not None and fast_move_x >= limits.max_fast_move_x:
        vetoes.append(f"fast move {fast_move_x:.2f}x >= {limits.max_fast_move_x:.2f}x")

    spread_pct = as_float(normalized.get("spreadPct"))
    if spread_pct is not None and spread_pct >= limits.max_spread_pct:
        vetoes.append(f"spread {spread_pct:.2f}% >= {limits.max_spread_pct:.2f}%")

    liquidity_usdc = as_float(normalized.get("liquidityUsdc"))
    if liquidity_usdc is not None and liquidity_usdc < limits.min_liquidity_usdc:
        vetoes.append(f"liquidity {liquidity_usdc:.2f} < {limits.min_liquidity_usdc:.2f} USDC")

    recent_losses = as_int(normalized.get("recentLosses"))
    if recent_losses is not None and recent_losses >= limits.max_recent_losses:
        vetoes.append(f"recent losses {recent_losses} >= {limits.max_recent_losses}")

    ev_pct = as_float(normalized.get("evPct"))
    if ev_pct is not None and ev_pct < limits.min_ev_pct:
        vetoes.append(f"EV {ev_pct:.3f}% < {limits.min_ev_pct:.3f}%")

    risk_score = compute_risk_score(
        severity_x=severity_x,
        range_pct=range_pct,
        fast_move_x=fast_move_x,
        spread_pct=spread_pct,
        liquidity_usdc=liquidity_usdc,
        recent_losses=recent_losses,
        ev_pct=ev_pct,
        limits=limits,
    )

    return {
        "passed": len(vetoes) == 0,
        "riskLevel": risk_level(risk_score, bool(vetoes)),
        "riskScore": round(risk_score, 3),
        "vetoes": vetoes,
        "warnings": warnings,
        "thresholds": {
            "maxVolatilitySeverity": limits.max_volatility_severity,
            "maxRangePct": limits.max_range_pct,
            "maxFastMoveX": limits.max_fast_move_x,
            "maxSpreadPct": limits.max_spread_pct,
            "minLiquidityUsdc": limits.min_liquidity_usdc,
            "maxRecentLosses": limits.max_recent_losses,
            "minEvPct": limits.min_ev_pct,
        },
        "inputs": normalized,
    }


def normalize_snapshot(snapshot: dict[str, Any]) -> dict[str, Any]:
    if "result" in snapshot and isinstance(snapshot["result"], dict):
        return normalize_snapshot(snapshot["result"])
    return snapshot


def thresholds_from_payload(payload: dict[str, Any]) -> RiskThresholds:
    thresholds = payload.get("thresholds") if isinstance(payload.get("thresholds"), dict) else {}
    return RiskThresholds(
        max_volatility_severity=as_float(thresholds.get("maxVolatilitySeverity"), 2.0),
        max_range_pct=as_float(thresholds.get("maxRangePct"), 0.12),
        max_fast_move_x=as_float(thresholds.get("maxFastMoveX"), 4.0),
        max_spread_pct=as_float(thresholds.get("maxSpreadPct"), 3.0),
        min_liquidity_usdc=as_float(thresholds.get("minLiquidityUsdc"), 100.0),
        max_recent_losses=as_int(thresholds.get("maxRecentLosses"), 4),
        min_ev_pct=as_float(thresholds.get("minEvPct"), 0.3),
    )


def compute_risk_score(
    *,
    severity_x: float | None,
    range_pct: float | None,
    fast_move_x: float | None,
    spread_pct: float | None,
    liquidity_usdc: float | None,
    recent_losses: int | None,
    ev_pct: float | None,
    limits: RiskThresholds,
) -> float:
    score = 0.0
    if severity_x is not None:
        score += min(severity_x / limits.max_volatility_severity, 2.0) * 25.0
    if range_pct is not None:
        score += min(range_pct / limits.max_range_pct, 2.0) * 20.0
    if fast_move_x is not None:
        score += min(fast_move_x / limits.max_fast_move_x, 2.0) * 20.0
    if spread_pct is not None:
        score += min(spread_pct / limits.max_spread_pct, 2.0) * 15.0
    if liquidity_usdc is not None and liquidity_usdc < limits.min_liquidity_usdc:
        score += min((limits.min_liquidity_usdc - liquidity_usdc) / limits.min_liquidity_usdc, 1.0) * 10.0
    if recent_losses is not None:
        score += min(recent_losses / max(limits.max_recent_losses, 1), 2.0) * 10.0
    if ev_pct is not None and ev_pct < limits.min_ev_pct:
        score += min((limits.min_ev_pct - ev_pct) / max(limits.min_ev_pct, 0.0001), 1.0) * 10.0
    return min(score, 100.0)


def risk_level(score: float, has_vetoes: bool) -> str:
    if has_vetoes or score >= 70:
        return "high"
    if score >= 35:
        return "medium"
    return "low"


def as_float(value: Any, default: float | None = None) -> float | None:
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def as_int(value: Any, default: int | None = None) -> int | None:
    if value is None:
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default
