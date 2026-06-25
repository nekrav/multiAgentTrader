from collections import Counter

def run_meta_consensus(outputs: list[dict]) -> dict:
    market = outputs[0]["market"] if outputs else "UNKNOWN"
    timeframe = outputs[0]["timeframe"] if outputs else "1H"
    timestamp = outputs[0]["timestamp"] if outputs else ""
    votes = [o.get("bias", "neutral") for o in outputs]
    final_bias = Counter(votes).most_common(1)[0][0] if votes else "neutral"
    avg_conf = sum(float(o.get("confidence", 0.0)) for o in outputs) / max(len(outputs), 1)
    agreement = votes.count(final_bias) / max(len(votes), 1)
    return {"market": market, "instrument_type": "option", "timeframe": timeframe, "timestamp": timestamp, "agent_key": "options_meta_consensus", "bias": final_bias, "confidence": round(avg_conf * agreement, 2), "score": round(avg_conf * agreement * 10, 1), "summary": f"Options consensus is {final_bias} with {round(agreement, 2)} agreement.", "risk_flags": sorted({f for o in outputs for f in o.get("risk_flags", [])}), "features": {"agreement_score": round(agreement, 2), "agent_count": len(outputs)}, "model_version": "options_meta_consensus_v1"}
