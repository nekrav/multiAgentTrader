# AiTraders Platform Architecture

AiTraders is a dockerizable monorepo around the existing Python agent/research work.

## Services

- `apps/web`: Next.js dashboard for agent status, invocations, and future review reports.
- `apps/api`: NestJS API gateway for agents, PostgreSQL, Redis, and deterministic orchestration.
- `postgres`: durable event/invocation storage.
- `redis`: short-lived cache, locks, and queue-ready infrastructure.

## Agent API Boundary

Agents are exposed through stable HTTP endpoints:

- `GET /agents`: available agent registry.
- `GET /agents/:agentId/status`: status from local configured agent endpoint, with fallback.
- `POST /agents/:agentId/invoke`: invokes an agent endpoint through the API gateway.

Each agent can run in its own Docker container later. The backend connects through `AGENT_ENDPOINTS_JSON`.

The Market Data Agent is implemented first. It runs as a Python HTTP service on port `7001`, fetches Coinbase BTC/ETH candles, and computes normalized analytics for the API gateway.

The Risk Agent is implemented second. It runs as a Python HTTP service on port `7003`, accepts Market Data snapshots or trade-condition payloads, and returns deterministic pass/veto decisions for volatility, range, fast moves, spread, liquidity, recent losses, and EV.

The Strategy Research Agent is implemented third. It runs as a Python HTTP service on port `7002`, accepts Market Data and Risk Agent outputs, and generates deterministic strategy/config proposals. It can optionally call Strategy Lab's `/api/backtest` endpoint when `runBacktest=true`.

## Safety Rule

The API can call agents for data, research, risk, execution proposals, and review. Live trading must remain deterministic: an LLM or agent response cannot bypass hard risk and execution gates.
