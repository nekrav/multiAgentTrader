def run_greeks_risk_agent(market: str, timeframe: str, timestamp: str, gamma: float, theta: float, vega: float, days_to_expiry: int) -> dict:
    flags=[]
    if days_to_expiry <= 7 and abs(gamma) > 0.04: flags.append("elevated_gamma")
    if theta < -0.08: flags.append("high_decay_risk")
    bias="mixed" if flags else "neutral"
    return {"market":market,"instrument_type":"option","timeframe":timeframe,"timestamp":timestamp,"agent_key":"options_greeks_risk","bias":bias,"confidence":0.66,"score":6.6,"summary":"Greeks risk scan completed with deterministic threshold checks.","risk_flags":flags,"features":{"gamma":gamma,"theta":theta,"vega":vega,"days_to_expiry":days_to_expiry},"model_version":"options_greeks_risk_v1"}
