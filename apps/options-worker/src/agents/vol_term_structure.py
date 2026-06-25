def classify_vol_term_structure(front_iv: float, back_iv: float, event_risk: bool=False) -> dict:
    spread = front_iv - back_iv
    if spread > 0.025:
        state = "front_loaded"
    elif spread < -0.025:
        state = "back_loaded"
    else:
        state = "balanced"
    return {"term_structure": state, "front_back_iv_spread": round(spread, 4), "event_hump": bool(event_risk and state == "front_loaded")}

def run_vol_term_agent(market: str, timeframe: str, timestamp: str, front_iv: float, back_iv: float, event_risk: bool=False) -> dict:
    features=classify_vol_term_structure(front_iv, back_iv, event_risk)
    bias="vol_compression" if features["term_structure"] == "front_loaded" else "vol_expansion" if features["term_structure"] == "back_loaded" else "neutral"
    return {"market":market,"instrument_type":"option","timeframe":timeframe,"timestamp":timestamp,"agent_key":"options_vol_term","bias":bias,"confidence":0.68,"score":6.8,"summary":f"Vol term structure is {features['term_structure']}.","risk_flags":["high_event_risk"] if features["event_hump"] else [],"features":features,"model_version":"options_vol_term_v1"}
