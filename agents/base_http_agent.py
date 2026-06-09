from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any


AGENT_ID = os.environ.get("AGENT_ID", "agent")
AGENT_NAME = os.environ.get("AGENT_NAME", AGENT_ID)
AGENT_ROLE = os.environ.get("AGENT_ROLE", "Agent placeholder")


class AgentHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path.rstrip("/") == "/status":
            self.write_json(
                {
                    "agentId": AGENT_ID,
                    "name": AGENT_NAME,
                    "role": AGENT_ROLE,
                    "status": "ok",
                }
            )
            return
        self.write_json({"error": "not found"}, status=404)

    def do_POST(self) -> None:
        if self.path.rstrip("/") != "/invoke":
            self.write_json({"error": "not found"}, status=404)
            return

        body = self.read_json()
        self.write_json(
            {
                "agentId": AGENT_ID,
                "status": "accepted",
                "role": AGENT_ROLE,
                "task": body.get("task"),
                "result": {
                    "message": "Agent container is reachable. Domain logic will be added in the next phase.",
                    "payloadKeys": sorted((body.get("payload") or {}).keys()),
                },
            }
        )

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            parsed = json.loads(raw.decode("utf-8"))
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
    port = int(os.environ.get("PORT", "7000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), AgentHandler)
    server.serve_forever()


if __name__ == "__main__":
    main()
