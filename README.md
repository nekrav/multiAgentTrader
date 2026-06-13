# AiTraders

Multi-agent trading analytics, research, risk, and review system around deterministic trading.

AiTraders is separate from `H:\polyBTC`. It can read exported trade/research data and produce analysis, proposals, vetoes, and reviews. Live order placement must remain deterministic and gated outside any LLM approval path.

## Quick Start

### Requirements

Install these before running the project:

- Node.js 20+ and npm 10+
- Python 3.11+ with `pip`
- Docker and Docker Compose, recommended for PostgreSQL and Redis
- PostgreSQL 15+ and Redis 7+ if you choose not to use Docker Compose

The repo uses npm workspaces. Use npm, not pnpm or yarn.

### Install Dependencies

```bash
npm install

# Optional, only needed for running Python tests locally.
python3 -m pip install pytest
```

Python agents use the standard library for their HTTP wrappers and public-data fetches, so there is no required Python package install for normal agent execution.

### Environment

For local development, copy the example environment file:

```bash
cp .env.example .env.local
```

Useful defaults:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- PostgreSQL: `postgres://aitraders:aitraders_dev_password@localhost:5432/aitraders`
- Redis: `redis://localhost:6379`

The API automatically runs SQL migrations from `infra/migrations` on startup.

### Run Locally With Helper Scripts

The fastest local path is:

```bash
./scripts/start-services.sh
```

This starts PostgreSQL/Redis as configured by the project and launches the local agents, API, and web app in tmux.

Stop everything with:

```bash
./scripts/stop-services.sh
```

### Run Manually

Start PostgreSQL and Redis first. With Docker Compose:

```bash
docker compose up -d postgres redis
```

Then start the Python agents in separate terminals:

```bash
python3 agents/market-data/server.py
python3 agents/strategy-research/server.py
python3 agents/risk/server.py
PORT=7006 python3 agents/event-analysis/server.py
PORT=7005 AGENT_ID=post-trade-review AGENT_NAME="Post-Trade Review Agent" AGENT_ROLE="Explains wins and losses, classifies trade outcomes, and records strategy lessons." python3 agents/base_http_agent.py
```

Start the API and web app:

```bash
npm run dev --workspace @aitraders/api
npm run dev --workspace @aitraders/web
```

Open:

- Web app: `http://localhost:3000`
- API health: `http://localhost:4000/health`

### Run With Docker Compose

```bash
docker compose up --build
```

For an EC2-style deployment with the production compose overlay:

```bash
cp .env.ec2.example .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

See `docs/ec2-deploy.md` for Ubuntu, Docker, reverse proxy, and security group guidance.

### Build And Test

```bash
npm run build --workspaces
npm test --workspace apps/api -- --runInBand

# Optional when pytest is installed.
python3 -m pytest
```

### Default Login

Database bootstrap creates an admin user:

- Email: `admin@aitraders.local`
- Password: `admin12345`

New registered users receive signup credits. Admin emails can be configured with `ADMIN_EMAILS`.

### Main Features

- Dashboard and live market intelligence
- Light/dark theme persisted with the `aitraders-theme` browser cookie
- Guided Run Analysis console
- Saved analyses at `/history`
- Trade setup workspace at `/setups`
- Agent chain runs: event analysis -> market data -> risk -> strategy research
- Forex and crypto support for setup and agent workflows
- Real-history backtesting for strategies using Coinbase crypto candles and Frankfurter forex rates
- Strategy playbook, reports, alerts, tutorial, FAQ, and admin views

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

It currently pulls Coinbase Exchange BTC/ETH candles and major forex daily rates through Frankfurter. It returns spot price, latest candle, trend, range percentage, realized volatility, baseline volatility, volatility severity, fast-move score, and low/medium/high volatility level.

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

It can generate deterministic proposals from Market Data and Risk Agent outputs. When `runBacktest` is true, it runs real-history backtests locally by default. If `strategyLabUrl` is explicitly supplied, it can call Strategy Lab's `/api/backtest` endpoint instead.

Built-in real-history backtesting supports:

- Crypto candles from Coinbase Exchange
- Forex daily rates from Frankfurter
- `market_favorite_90`
- `market_favorite_95`
- `trend_momentum_continuation`
- `london_session_breakout`
- `ny_session_reversal`
- `mean_reversion_exhaustion`
- `squeeze_breakout_confirmation`
- `pattern_breakout_with_trend_filter`
- `reversal_confluence`

Current proposal actions:

- `test_in_strategy_lab`
- `propose_config`
- `reject_config`
- `do_not_trade`
- `observe`
