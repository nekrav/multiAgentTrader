from __future__ import annotations
from math import sqrt

def calculate_expected_move(spot: float, atm_iv: float, days_to_expiry: int) -> dict:
    pct = float(atm_iv) * sqrt(days_to_expiry / 365.0)
    move = float(spot) * pct
    return {"expected_move_abs": round(move, 2), "expected_move_pct": round(pct * 100, 2), "one_sigma_range": [round(spot - move, 2), round(spot + move, 2)], "upper_expected_bound": round(spot + move, 2), "lower_expected_bound": round(spot - move, 2)}

def classify_iv_regime(atm_iv: float, realized_vol: float, iv_rank: float) -> dict:
    spread = atm_iv - realized_vol
    if iv_rank >= 65 and spread > 0.03:
        classification, bias = "rich", "vol_compression"
    elif iv_rank <= 30 or spread < -0.01:
        classification, bias = "cheap", "vol_expansion"
    else:
        classification, bias = "fair", "neutral"
    return {"classification": classification, "bias": bias, "iv_realized_spread": round(spread, 4), "iv_rank": iv_rank}

def run_implied_vol_agent(market: str, timeframe: str, timestamp: str, spot: float, atm_iv: float, realized_vol: float, iv_rank: float, days_to_expiry: int, event_risk: bool=False) -> dict:
    regime = classify_iv_regime(atm_iv, realized_vol, iv_rank)
    move = calculate_expected_move(spot, atm_iv, days_to_expiry)
    confidence = 0.62 + min(0.2, abs(regime["iv_realized_spread"]) * 2)
    flags = ["high_event_risk"] if event_risk else []
    return {"market": market, "instrument_type": "option", "timeframe": timeframe, "timestamp": timestamp, "agent_key": "options_implied_vol", "bias": regime["bias"], "confidence": round(confidence, 2), "score": round(confidence * 10, 1), "summary": f"IV is {regime['classification']} versus realized volatility; expected move is {move['expected_move_pct']}%.", "risk_flags": flags, "features": {**regime, **move, "atm_iv": atm_iv, "realized_vol": realized_vol}, "model_version": "options_iv_v1"}
