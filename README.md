# AiTraders

Multi-agent trading analytics, research, risk, and review system around deterministic trading.

AiTraders is separate from `H:\polyBTC`. It can read exported trade/research data and produce analysis, proposals, vetoes, and reviews. Live order placement must remain deterministic and gated outside any LLM approval path.

## Project Context

Related app: `H:\polyBTC`

- BTC dashboard/API: `http://127.0.0.1:5001`
- ETH dashboard/API: `http://127.0.0.1:5002`
- Strategy Lab: `http://127.0.0.1:5010`
- Python env: `H:\polyBTC\build_env\Scripts\python.exe`
- Current live strategy family: Polymarket-priced `market_favorite_90/95`

Important research note: cheap-side mean reversion looked positive with fake 50c entries but was negative using actual Polymarket prices. The current positive short-backtest family is market favorite at 90/95 cents with deterministic gates.

## Agent Boundaries

- Market Data Agent: pulls and normalizes public market data.
- Strategy Research Agent: runs backtest sweeps and proposes parameter changes with out-of-sample checks.
- Risk Agent: vetoes trades for volatility, liquidity, poor recent performance, bad EV, wide spread, or excessive reversals.
- Execution Agent: may place orders only when deterministic gates pass.
- Post-Trade Review Agent: explains each result, classifies reason, and writes strategy notes.

Safety rule: agents can research, propose, explain, monitor, and veto. They must not bypass risk or execution gates.

## Phase 1

This scaffold implements the shared journal schema and a deterministic post-trade review pipeline.

```powershell
H:\polyBTC\build_env\Scripts\python.exe -m pytest
H:\polyBTC\build_env\Scripts\python.exe -m aitraders.review_cli --journal data\journal.jsonl --write-sample
```

Generated local data lives under `data/` and is ignored by git.

## Platform App

The project now also includes a dockerizable full-stack platform:

- `apps/web`: Next.js dashboard on port `3000`.
- `apps/api`: NestJS API gateway on port `4000`.
- `packages/shared`: shared TypeScript agent types.
- `agents/*`: dockerizable HTTP agent containers for Market Data, Strategy Research, Risk, Execution, and Post-Trade Review.
- `postgres`: PostgreSQL event/invocation database.
- `redis`: Redis cache/lock/queue-ready service.

```powershell
npm install
npm run build
npm run test
```

For local development without Docker, copy `.env.example` to `.env.local` and run the API/web workspaces. Redis/PostgreSQL are only required once code paths write invocation history or use cache/locks.

When Docker is installed:

```powershell
docker compose up --build
```

API endpoints:

- `GET http://localhost:4000/health`
- `GET http://localhost:4000/agents`
- `GET http://localhost:4000/agents/{agentId}/status`
- `POST http://localhost:4000/agents/{agentId}/invoke`

The API connects to agent containers through `AGENT_ENDPOINTS_JSON`. The execution agent is scaffolded as a container but must still obey the project safety rule: no direct LLM or agent bypass of deterministic gates.

### Market Data Agent

`agents/market-data` is the first real analytics agent. It is Python-based, dockerizable, and API-compatible.

It supports:

- `GET /status`
- `POST /invoke` with task `snapshot`, `market_snapshot`, or `coinbase_snapshot`

Example request:

```json
{
  "task": "snapshot",
  "payload": {
    "asset": "BTC",
    "granularity": 60,
    "limit": 120
  }
}
```

It currently pulls Coinbase Exchange BTC/ETH candles and returns spot price, latest candle, trend, range percentage, realized volatility, baseline volatility, volatility severity, fast-move score, and low/medium/high volatility level.

### Risk Agent

`agents/risk` is the second real analytics agent. It is Python-based, dockerizable, and API-compatible.

It supports:

- `GET /status`
- `POST /invoke` with task `risk_check`, `evaluate`, or `veto_check`

It accepts a market snapshot and optional thresholds, then returns:

- `passed`
- `riskLevel`
- `riskScore`
- `vetoes`
- `warnings`
- normalized inputs

It currently evaluates volatility severity, range %, fast move strength, spread %, liquidity, recent losses, and EV.

### Strategy Research Agent

`agents/strategy-research` is the third real analytics agent. It is Python-based, dockerizable, and API-compatible.

It supports:

- `GET /status`
- `POST /invoke` with task `research`, `strategy_sweep`, or `propose`

It can generate deterministic proposals from Market Data and Risk Agent outputs. When `runBacktest` is true, it can also call Strategy Lab's `/api/backtest` endpoint and summarize the result before proposing or rejecting config changes.

Current proposal actions:

- `test_in_strategy_lab`
- `propose_config`
- `reject_config`
- `do_not_trade`
- `observe`
