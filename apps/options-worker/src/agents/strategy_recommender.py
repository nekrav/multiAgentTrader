def recommend_strategy_family(underlying_bias: str, iv_classification: str, skew_classification: str, term_structure: str, risk_profile: str="balanced") -> dict:
    if underlying_bias == "bullish" and iv_classification == "rich":
        family = "bull call spread"
    elif underlying_bias == "bearish" and iv_classification == "rich":
        family = "bear put spread"
    elif underlying_bias == "bullish":
        family = "long call"
    elif underlying_bias == "bearish":
        family = "long put"
    elif iv_classification == "cheap" or term_structure == "back_loaded":
        family = "long straddle"
    elif iv_classification == "rich" and risk_profile != "conservative":
        family = "iron condor"
    else:
        family = "calendar spread"
    return {"strategy_family": family, "confidence": 0.72, "rationale": f"{family} fits {underlying_bias} bias with {iv_classification} IV and {skew_classification} skew.", "risk_note": "Scenario guidance only; not broker-ready execution advice.", "invalidation_note": "Invalidate if underlying bias, IV regime, or event risk changes."}

def run_strategy_agent(market: str, timeframe: str, timestamp: str, underlying_bias: str, iv_classification: str, skew_classification: str, term_structure: str) -> dict:
    rec=recommend_strategy_family(underlying_bias, iv_classification, skew_classification, term_structure)
    return {"market":market,"instrument_type":"option","timeframe":timeframe,"timestamp":timestamp,"agent_key":"options_strategy_recommender","bias":"mixed","confidence":rec["confidence"],"score":round(rec["confidence"]*10,1),"summary":rec["rationale"],"risk_flags":[],"features":rec,"model_version":"options_strategy_recommender_v1"}
