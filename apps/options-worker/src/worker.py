from __future__ import annotations
import hashlib, json, os, time
from datetime import datetime, timezone
try:
    import psycopg
except Exception:
    psycopg = None
from .agents.underlying_context import run_underlying_context_agent
from .agents.implied_vol import run_implied_vol_agent, classify_iv_regime
from .agents.skew_smile import run_skew_agent, classify_skew
from .agents.vol_term_structure import run_vol_term_agent, classify_vol_term_structure
from .agents.greeks_risk import run_greeks_risk_agent
from .agents.strategy_recommender import run_strategy_agent
from .agents.meta_consensus import run_meta_consensus

SAMPLE={"GC_OPTIONS":{"spot":2324,"atm_iv":0.176,"realized":0.142,"iv_rank":68,"put_iv":0.24,"call_iv":0.19,"front_iv":0.176,"back_iv":0.151,"bias":"bullish"}}

def input_hash(payload: dict) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

def run_once() -> list[dict]:
    now=datetime.now(timezone.utc).isoformat(); outputs=[]
    for market in os.getenv("OPTIONS_UNDERLYINGS","GC_OPTIONS").split(','):
        s=SAMPLE.get(market.strip(), SAMPLE["GC_OPTIONS"]); tf=os.getenv("OPTIONS_TIMEFRAMES", os.getenv("TIMEFRAMES", "1D")).split(',')[0]
        iv=classify_iv_regime(s["atm_iv"], s["realized"], s["iv_rank"]); skew=classify_skew(s["put_iv"], s["call_iv"], 0.02); term=classify_vol_term_structure(s["front_iv"], s["back_iv"], True)
        agent_outputs=[run_underlying_context_agent(market,tf,now,s["bias"],0.7), run_implied_vol_agent(market,tf,now,s["spot"],s["atm_iv"],s["realized"],s["iv_rank"],30,True), run_skew_agent(market,tf,now,s["put_iv"],s["call_iv"],0.02), run_vol_term_agent(market,tf,now,s["front_iv"],s["back_iv"],True), run_greeks_risk_agent(market,tf,now,0.035,-0.05,0.18,30), run_strategy_agent(market,tf,now,s["bias"],iv["classification"],skew["classification"],term["term_structure"])]
        agent_outputs.append(run_meta_consensus(agent_outputs))
        for out in agent_outputs: out["input_hash"]=input_hash({"market":market,"sample":s,"agent":out["agent_key"]})
        outputs.extend(agent_outputs)
    return outputs

def persist(outputs: list[dict]) -> None:
    if psycopg is None or os.getenv("PUBLISH_MODE","db") != "db": return
    db=os.getenv("DATABASE_URL")
    if not db: return
    with psycopg.connect(db) as conn:
        for out in outputs:
            conn.execute("""insert into options_agent_outputs(market,timeframe,ts,agent_key,bias,confidence,score,summary,risk_flags_json,features_json,model_version,input_hash) values (%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s::jsonb,%s,%s)""", (out["market"],out["timeframe"],out["timestamp"],out["agent_key"],out["bias"],out["confidence"],out["score"],out["summary"],json.dumps(out["risk_flags"]),json.dumps(out["features"]),out["model_version"],out["input_hash"]))
            if out["agent_key"] == "options_strategy_recommender":
                f=out["features"]
                conn.execute("""insert into strategy_recommendations(underlying,ts,timeframe,strategy_family,confidence,rationale,risk_note,invalidation_note,features_json) values (%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb)""", (out["market"],out["timestamp"],out["timeframe"],f["strategy_family"],f["confidence"],f["rationale"],f["risk_note"],f["invalidation_note"],json.dumps(f)))

def main():
    interval=int(os.getenv("OPTIONS_RUN_INTERVAL_SECONDS","300"))
    while True:
        outputs=run_once(); persist(outputs); print(json.dumps({"service":"options-worker","status":"ok","outputs":len(outputs)}), flush=True)
        if os.getenv("RUN_ONCE","false").lower()=="true": break
        time.sleep(interval)
if __name__ == "__main__": main()
