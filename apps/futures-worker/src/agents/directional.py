from __future__ import annotations


def run_directional_agent(market: str, timeframe: str, timestamp: str, closes: list[float], atr: float = 1.0) -> dict:
    if len(closes) < 5:
        bias, confidence, momentum = "neutral", 0.35, 0.0
    else:
        momentum = (closes[-1] - closes[-5]) / max(abs(closes[-5]), 1)
        bias = "bullish" if momentum > 0.005 else "bearish" if momentum < -0.005 else "neutral"
        confidence = min(0.86, 0.52 + abs(momentum) * 20)
    risk_flags = ["high_event_risk"] if atr > max(closes[-1] * 0.03, 1) else []
    return {
        "market": market,
        "instrument_type": "future",
        "timeframe": timeframe,
        "timestamp": timestamp,
        "agent_key": "futures_directional",
        "bias": bias,
        "confidence": round(confidence, 2),
        "score": round(confidence * 10, 1),
        "summary": f"{market} directional model is {bias} with {round(momentum * 100, 2)}% short-window momentum.",
        "risk_flags": risk_flags,
        "features": {"momentum_5": round(momentum, 4), "atr": atr, "last_close": closes[-1] if closes else None},
        "invalidation": "Close back through recent five-period range midpoint.",
        "model_version": "futures_direction_v1",
    }
