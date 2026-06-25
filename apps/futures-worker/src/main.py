from __future__ import annotations
from http.server import BaseHTTPRequestHandler, HTTPServer
import json, os, threading, time
from .worker import persist, run_once

last_status = {"status": "starting", "outputs": 0}

def loop() -> None:
    global last_status
    interval = int(os.getenv("FUTURES_RUN_INTERVAL_SECONDS", "300"))
    while True:
        try:
            outputs = run_once()
            persist(outputs)
            last_status = {"status": "ok", "outputs": len(outputs)}
            print(json.dumps({"service":"futures-worker", **last_status}), flush=True)
        except Exception as exc:
            last_status = {"status": "error", "error": type(exc).__name__}
            print(json.dumps({"service":"futures-worker", **last_status}), flush=True)
        time.sleep(interval)

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health/live":
            self.send_response(200); self.end_headers(); self.wfile.write(b'{"status":"ok"}'); return
        if self.path == "/health/ready":
            code = 200 if last_status.get("status") == "ok" else 503
            body=json.dumps(last_status).encode(); self.send_response(code); self.send_header("content-type","application/json"); self.end_headers(); self.wfile.write(body); return
        if self.path == "/run-once":
            outputs=run_once(); body=json.dumps({"outputs": outputs}).encode(); self.send_response(200); self.send_header("content-type","application/json"); self.end_headers(); self.wfile.write(body); return
        self.send_response(404); self.end_headers()

if __name__ == "__main__":
    threading.Thread(target=loop, daemon=True).start()
    HTTPServer(("0.0.0.0", 7011), Handler).serve_forever()
