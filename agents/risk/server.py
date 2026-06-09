from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from aitraders.agents.risk import evaluate_risk, thresholds_from_payload


AGENT_ID = "risk"
AGENT_NAME = "Risk Agent"
AGENT_ROLE = "Vetoes volatility, thin liquidity, wide spread, weak EV, and bad recent-performance conditions."


class RiskHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path.rstrip("/") == "/status":
            self.write_json(
                {
                    "agentId": AGENT_ID,
                    "name": AGENT_NAME,
                    "role": AGENT_ROLE,
                    "status": "ok",
                    "supportedTasks": ["risk_check", "evaluate", "veto_check"],
                }
            )
            return
        self.write_json({"error": "not found"}, status=404)

    def do_POST(self) -> None:
        if self.path.rstrip("/") != "/invoke":
            self.write_json({"error": "not found"}, status=404)
            return

        request = self.read_json()
        task = str(request.get("task", "risk_check"))
        payload = request.get("payload") if isinstance(request.get("payload"), dict) else {}

        if task not in {"risk_check", "evaluate", "veto_check"}:
            self.write_json({"agentId": AGENT_ID, "status": "error", "message": f"Unsupported task: {task}", "result": {}}, 400)
            return

        snapshot = payload.get("snapshot") if isinstance(payload.get("snapshot"), dict) else payload
        result = evaluate_risk(snapshot, thresholds_from_payload(payload))
        self.write_json({"agentId": AGENT_ID, "status": "ok", "result": result})

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        try:
            parsed = json.loads(self.rfile.read(length).decode("utf-8"))
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}

    def write_json(self, payload: dict[str, Any], status: int = 200) -> None:
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, format: str, *args: Any) -> None:
        return


def main() -> None:
    port = int(os.environ.get("PORT", "7003"))
    ThreadingHTTPServer(("0.0.0.0", port), RiskHandler).serve_forever()


if __name__ == "__main__":
    main()
