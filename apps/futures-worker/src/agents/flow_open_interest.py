from __future__ import annotations


def interpret_open_interest_flow(price_change: float, open_interest_change: float, volume_change: float = 0) -> dict:
    if price_change > 0 and open_interest_change > 0:
        return {"participation": "long_building", "bias": "bullish", "confirmation_score": 0.78, "risk_flag": None}
    if price_change > 0 and open_interest_change < 0:
        return {"participation": "short_covering", "bias": "mixed", "confirmation_score": 0.48, "risk_flag": "short_covering_or_fragile_rally"}
    if price_change < 0 and open_interest_change > 0:
        return {"participation": "short_building", "bias": "bearish", "confirmation_score": 0.76, "risk_flag": None}
    if price_change < 0 and open_interest_change < 0:
        return {"participation": "long_liquidation", "bias": "bearish", "confirmation_score": 0.58, "risk_flag": "liquidation_move"}
    return {"participation": "balanced", "bias": "neutral", "confirmation_score": 0.5, "risk_flag": None}


def run_flow_agent(market: str, timeframe: str, timestamp: str, price_change: float, open_interest_change: float, volume_change: float) -> dict:
    features = interpret_open_interest_flow(price_change, open_interest_change, volume_change)
    flags = [features["risk_flag"]] if features.get("risk_flag") else []
    confidence = features["confirmation_score"]
    return {
        "market": market,
        "instrument_type": "future",
        "timeframe": timeframe,
        "timestamp": timestamp,
        "agent_key": "futures_flow_oi",
        "bias": features["bias"],
        "confidence": confidence,
        "score": round(confidence * 10, 1),
        "summary": f"Open interest flow shows {features['participation']}.",
        "risk_flags": flags,
        "features": {**features, "price_change": price_change, "open_interest_change": open_interest_change, "volume_change": volume_change},
        "model_version": "futures_flow_oi_v1",
    }
