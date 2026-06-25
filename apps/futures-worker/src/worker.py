from __future__ import annotations
import hashlib, json, os, time
from datetime import datetime, timezone
try:
    import psycopg
except Exception:  # local unit tests do not need DB
    psycopg = None
from .agents.directional import run_directional_agent
from .agents.term_structure import run_term_structure_agent
from .agents.flow_open_interest import run_flow_agent
from .agents.event_supply import run_event_supply_agent
from .agents.meta_consensus import run_meta_consensus

SAMPLE = {
    "CL": {"prices": [75.2, 74.6, 74.1], "closes": [71.8, 72.3, 73.1, 74.2, 75.2], "oi": 2500, "vol": 1200, "event": 0.72},
    "GC": {"prices": [2324.0, 2324.5, 2324.1], "closes": [2319, 2322, 2324, 2321, 2324], "oi": -300, "vol": 150, "event": 0.35},
}

def input_hash(payload: dict) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

def run_once() -> list[dict]:
    now = datetime.now(timezone.utc).isoformat()
    outputs=[]
    for market in os.getenv("MARKETS", "CL,GC").split(','):
        sample = SAMPLE.get(market.strip(), SAMPLE["CL"])
        tf = os.getenv("FUTURES_TIMEFRAMES", os.getenv("TIMEFRAMES", "1H")).split(',')[0]
        agent_outputs = [
            run_directional_agent(market, tf, now, sample["closes"]),
            run_term_structure_agent(market, sample["prices"], tf, now),
            run_flow_agent(market, tf, now, sample["closes"][-1]-sample["closes"][-2], sample["oi"], sample["vol"]),
            run_event_supply_agent(market, tf, now, sample["event"]),
        ]
        agent_outputs.append(run_meta_consensus(agent_outputs))
        for out in agent_outputs:
            out["input_hash"] = input_hash({"market": market, "sample": sample, "agent": out["agent_key"]})
        outputs.extend(agent_outputs)
    return outputs

def persist(outputs: list[dict]) -> None:
    if psycopg is None or os.getenv("PUBLISH_MODE", "db") != "db":
        return
    db = os.getenv("DATABASE_URL")
    if not db:
        return
    with psycopg.connect(db) as conn:
        for out in outputs:
            conn.execute("""insert into futures_agent_outputs(market,timeframe,ts,agent_key,bias,confidence,score,summary,risk_flags_json,features_json,model_version,input_hash)
            values (%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s::jsonb,%s,%s)""", (out["market"], out["timeframe"], out["timestamp"], out["agent_key"], out["bias"], out["confidence"], out["score"], out["summary"], json.dumps(out["risk_flags"]), json.dumps(out["features"]), out["model_version"], out["input_hash"]))

def main():
    interval = int(os.getenv("FUTURES_RUN_INTERVAL_SECONDS", "300"))
    while True:
        outputs = run_once(); persist(outputs)
        print(json.dumps({"service":"futures-worker","status":"ok","outputs":len(outputs)}), flush=True)
        if os.getenv("RUN_ONCE", "false").lower() == "true": break
        time.sleep(interval)

if __name__ == "__main__": main()
