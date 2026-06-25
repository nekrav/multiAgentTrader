def run_event_supply_agent(market: str, timeframe: str, timestamp: str, event_score: float = 0.2) -> dict:
    bias = "mixed" if event_score >= 0.6 else "neutral"
    flags = ["high_event_risk"] if event_score >= 0.6 else []
    return {"market": market, "instrument_type": "future", "timeframe": timeframe, "timestamp": timestamp, "agent_key": "futures_event_supply", "bias": bias, "confidence": round(min(0.85, 0.45 + event_score / 2), 2), "score": round((0.45 + event_score / 2) * 10, 1), "summary": f"Event/supply risk score is {event_score}.", "risk_flags": flags, "features": {"event_risk_score": event_score}, "model_version": "futures_event_supply_v1"}
