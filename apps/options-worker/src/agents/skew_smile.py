def classify_skew(put_25_delta_iv: float, call_25_delta_iv: float, prior_skew: float = 0.0) -> dict:
    skew = put_25_delta_iv - call_25_delta_iv
    change = skew - prior_skew
    if skew >= 0.06:
        classification, bias = "downside_fear", "bearish"
    elif skew <= -0.03:
        classification, bias = "upside_chase", "bullish"
    elif abs(change) >= 0.04:
        classification, bias = "unstable", "mixed"
    else:
        classification, bias = "balanced", "neutral"
    return {"classification": classification, "bias": bias, "skew_score": round(skew, 4), "skew_change": round(change, 4)}

def run_skew_agent(market: str, timeframe: str, timestamp: str, put_iv: float, call_iv: float, prior_skew: float=0.0) -> dict:
    features=classify_skew(put_iv, call_iv, prior_skew)
    flags=["dependency_conflict"] if features["classification"] == "unstable" else []
    confidence=min(0.86, 0.55 + abs(features["skew_score"]) * 3)
    return {"market": market,"instrument_type":"option","timeframe":timeframe,"timestamp":timestamp,"agent_key":"options_skew_smile","bias":features["bias"],"confidence":round(confidence,2),"score":round(confidence*10,1),"summary":f"Options skew is {features['classification']}.","risk_flags":flags,"features":features,"model_version":"options_skew_v1"}
