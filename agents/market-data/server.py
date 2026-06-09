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

from aitraders.agents.market_data import build_snapshot


AGENT_ID = "market-data"
AGENT_NAME = "Market Data Agent"
AGENT_ROLE = "Fetches and normalizes Coinbase BTC/ETH candles, volatility, trend, and range metrics."


class MarketDataHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path.rstrip("/") == "/status":
            self.write_json(
                {
                    "agentId": AGENT_ID,
                    "name": AGENT_NAME,
                    "role": AGENT_ROLE,
                    "status": "ok",
                    "supportedTasks": ["snapshot", "market_snapshot", "coinbase_snapshot"],
                }
            )
            return
        self.write_json({"error": "not found"}, status=404)

    def do_POST(self) -> None:
        if self.path.rstrip("/") != "/invoke":
            self.write_json({"error": "not found"}, status=404)
            return

        request = self.read_json()
        task = str(request.get("task", "snapshot"))
        payload = request.get("payload") if isinstance(request.get("payload"), dict) else {}

        if task not in {"snapshot", "market_snapshot", "coinbase_snapshot"}:
            self.write_json(
                {
                    "agentId": AGENT_ID,
                    "status": "error",
                    "message": f"Unsupported task: {task}",
                    "result": {},
                },
                status=400,
            )
            return

        try:
            asset = str(payload.get("asset", "BTC"))
            granularity = int(payload.get("granularity", 60))
            limit = int(payload.get("limit", 120))
            result = build_snapshot(asset, granularity=granularity, limit=limit)
            self.write_json({"agentId": AGENT_ID, "status": "ok", "result": result})
        except Exception as exc:
            self.write_json(
                {
                    "agentId": AGENT_ID,
                    "status": "error",
                    "message": str(exc),
                    "result": {},
                },
                status=500,
            )

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
    port = int(os.environ.get("PORT", "7001"))
    ThreadingHTTPServer(("0.0.0.0", port), MarketDataHandler).serve_forever()


if __name__ == "__main__":
    main()
