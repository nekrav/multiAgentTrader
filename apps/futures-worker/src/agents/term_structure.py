from __future__ import annotations

from typing import Sequence


def classify_curve_state(prices: Sequence[float]) -> dict:
    if len(prices) < 3:
        return {"curve_state": "insufficient", "m1_m2_spread": 0.0, "m2_m3_spread": 0.0, "bias": "neutral"}
    m1, m2, m3 = [float(x) for x in prices[:3]]
    m1_m2 = round(m1 - m2, 4)
    m2_m3 = round(m2 - m3, 4)
    if m1 > m2 > m3:
        state, bias = "backwardation", "curve_bullish"
    elif m1 < m2 < m3:
        state, bias = "contango", "curve_bearish"
    else:
        state, bias = "mixed", "mixed"
    slope = round((m1_m2 + m2_m3) / max(abs(m2), 1), 6)
    return {"curve_state": state, "m1_m2_spread": m1_m2, "m2_m3_spread": m2_m3, "curve_slope": slope, "bias": bias}


def run_term_structure_agent(market: str, prices: Sequence[float], timeframe: str, timestamp: str) -> dict:
    features = classify_curve_state(prices)
    confidence = 0.55 if features["curve_state"] == "mixed" else min(0.9, 0.62 + abs(features["m1_m2_spread"]) / 5)
    return {
        "market": market,
        "instrument_type": "future",
        "timeframe": timeframe,
        "timestamp": timestamp,
        "agent_key": "futures_curve",
        "bias": features["bias"],
        "confidence": round(confidence, 2),
        "score": round(confidence * 10, 1),
        "summary": f"{market} curve is {features['curve_state']} with M1-M2 spread {features['m1_m2_spread']}.",
        "risk_flags": [] if features["curve_state"] != "mixed" else ["curve_instability"],
        "features": features,
        "model_version": "futures_curve_v1",
    }
