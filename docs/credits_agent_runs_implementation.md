# Implementation Spec: User-Run Agent Analysis with Credits

**Status:** Ready for implementation
**Target repo:** `n:\multiAgentTrader` (AiTraders monorepo)
**Audience:** This document is written for an AI coding agent. Follow it top to bottom. Every section states what to build, where to put it, and how to verify it.

---

## 1. Goal

Let signed-in users on the website spend **credits** to run their own analysis using the platform's agents (Market Data, Strategy Research, Risk, Post-Trade Review) with their own parameters. Each run:

1. Authenticates the user.
2. Quotes a credit price for the selected agent + task.
3. **Reserves** (holds) credits atomically.
4. Executes the agent invocation asynchronously through a job queue.
5. **Settles** the hold on success or **refunds** it on failure.
6. Stores the result so the user can view run history and re-open past results.

Out of scope for this spec: live order execution (the `execution` agent must **never** be user-invocable — see §10), Stripe payments (scaffolded as Phase 5, behind an interface), plan/subscription tiers.

---

## 2. Current state of the codebase (read before coding)

| Piece | Location | Notes |
|---|---|---|
| API gateway (NestJS 11) | `apps/api/src` | Modules: `agents`, `database`, `health`. No auth, no users. |
| Agent proxy logic | `apps/api/src/agents/agents.service.ts` | `invoke()` POSTs `{task, payload}` to agent HTTP endpoints from `AGENT_ENDPOINTS_JSON`, logs to `agent_invocations` table. |
| Agent registry | `apps/api/src/agents/agent-registry.ts` | Static list of 5 agents; `canExecuteOrders` flag exists. |
| Shared types | `packages/shared/src/index.ts` | `AgentId`, `AgentInvocationRequest/Response`. |
| Web app (Next.js 16, React 19) | `apps/web/app` | Single server-rendered page listing agents. No client-side state, no auth. |
| Python agents | `agents/market-data`, `agents/risk`, `agents/strategy-research` (real); `execution`, `post-trade-review` (placeholders via `agents/base_http_agent.py`) | Each exposes `GET /status`, `POST /invoke`. |
| DB schema | `infra/postgres-init.sql` | Only `agent_events` and `agent_invocations`. Postgres 16. |
| Redis | `apps/api/src/database/database.module.ts` | ioredis client already provisioned. |
| Docker | `docker-compose.yml` | postgres, redis, api, web, 5 agent containers. |

Existing conventions to preserve:
- Plain `pg` Pool with raw SQL (no ORM). Continue with raw SQL + a migration file; do not introduce Prisma/TypeORM.
- NestJS module-per-feature layout (`src/<feature>/<feature>.module.ts|controller.ts|service.ts`).
- Shared request/response types live in `packages/shared/src/index.ts`.
- Safety rule from `README.md`: agents may research/propose/veto; nothing may bypass deterministic execution gates.

---

## 3. Architecture overview

```
Browser (Next.js)
  │  login / quote / start run / poll run / history / balance
  ▼
NestJS API (apps/api)
  ├─ AuthModule        JWT (access token), bcrypt password hashes
  ├─ UsersModule       user records
  ├─ CreditsModule     ledger, balance, reserve/settle/refund, grants
  ├─ CatalogModule     user-runnable agent tasks + credit prices
  ├─ RunsModule        analysis runs: create → enqueue → execute → settle
  │     └─ BullMQ queue "agent-runs" (Redis, already in stack)
  └─ AgentsModule      (existing) low-level agent proxy, reused by RunsModule
  ▼
Python agent containers (unchanged HTTP contract)
```

Key design decisions (researched; rationale in §12):

1. **Ledger-only balances.** A user's balance is `SUM(amount)` over an append-only `credit_ledger` table — never a mutable `balance` column as source of truth. A cached balance column is maintained transactionally for fast reads but the ledger is authoritative.
2. **Reserve → settle/refund.** Credits are held when a run is accepted, then the hold is converted to a final debit on completion or released on failure. This prevents both "ran for free" (debit after work fails to apply) and "paid for nothing" (debit before work, work fails).
3. **Idempotency keys** on every ledger write so retries (HTTP or queue) can never double-charge.
4. **Async execution with BullMQ.** Agent calls can be slow (backtests). The API returns a `runId` immediately; the web app polls run status. (SSE can be added later; polling is sufficient and simpler.)
5. **Integer credits.** Store credits as `bigint` whole units. No fractional credits.

---

## 4. Database schema

Create `infra/migrations/002_credits_and_runs.sql` and also append the same DDL to `infra/postgres-init.sql` (the compose file only runs init SQL on a fresh volume; the migration file is for existing databases). Add a tiny migration runner: on API boot, `database.module.ts` should execute all files in `infra/migrations/` in filename order inside a `schema_migrations` guard table. Keep it under ~40 lines; no framework.

```sql
-- users & auth
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- append-only credit ledger; balance is derived
create table if not exists credit_ledger (
  id bigserial primary key,
  user_id uuid not null references users(id),
  amount bigint not null,                 -- positive = grant/refund, negative = debit/hold
  entry_type text not null check (entry_type in
    ('grant', 'purchase', 'hold', 'hold_release', 'debit_settle', 'admin_adjust')),
  run_id uuid,                            -- set for hold/hold_release/debit_settle
  idempotency_key text not null unique,   -- e.g. 'hold:<runId>', 'settle:<runId>'
  note text,
  created_at timestamptz not null default now()
);
create index if not exists credit_ledger_user_idx on credit_ledger(user_id, created_at desc);

-- fast-read cached balance, updated in the same tx as every ledger insert
create table if not exists credit_balances (
  user_id uuid primary key references users(id),
  balance bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- priced catalog of user-runnable agent tasks (config-driven, seeded below)
create table if not exists agent_task_prices (
  id bigserial primary key,
  agent_id text not null,
  task text not null,
  display_name text not null,
  description text not null default '',
  credit_cost bigint not null check (credit_cost >= 0),
  enabled boolean not null default true,
  user_invocable boolean not null default true,
  params_schema jsonb not null default '{}'::jsonb,  -- JSON Schema for payload validation
  unique (agent_id, task)
);

-- user-initiated analysis runs
create table if not exists analysis_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  agent_id text not null,
  task text not null,
  payload jsonb not null default '{}'::jsonb,
  credit_cost bigint not null,
  status text not null default 'queued' check (status in
    ('queued', 'running', 'succeeded', 'failed', 'refunded')),
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create index if not exists analysis_runs_user_idx on analysis_runs(user_id, created_at desc);
```

Seed data (same migration). Prices are placeholders the admin can change later; cost scales with compute weight:

```sql
insert into agent_task_prices (agent_id, task, display_name, description, credit_cost, params_schema) values
  ('market-data', 'snapshot', 'Market Snapshot', 'Spot price, trend, realized volatility, fast-move score for BTC/ETH.', 1,
   '{"type":"object","properties":{"asset":{"type":"string","enum":["BTC","ETH"]},"granularity":{"type":"integer","enum":[60,300,900,3600]},"limit":{"type":"integer","minimum":10,"maximum":300}},"required":["asset"]}'),
  ('risk', 'evaluate', 'Risk Evaluation', 'Deterministic pass/veto across volatility, range, spread, liquidity, EV.', 2,
   '{"type":"object"}'),
  ('strategy-research', 'propose', 'Strategy Proposal', 'Deterministic strategy/config proposal from market + risk inputs.', 5,
   '{"type":"object"}'),
  ('strategy-research', 'propose_with_backtest', 'Strategy Proposal + Backtest', 'Proposal plus Strategy Lab backtest sweep (slow, compute-heavy).', 25,
   '{"type":"object"}')
on conflict (agent_id, task) do nothing;
```

> Implementation note: verify the actual task names accepted by `agents/risk/server.py` and `agents/strategy-research/server.py` before seeding (`grep -n "task" agents/*/server.py`) and adjust the seed rows to the real task strings. The market-data tasks are `snapshot`, `market_snapshot`, `coinbase_snapshot`.

The `execution` and `post-trade-review` agents get **no** rows → they are not purchasable. Enforce this in code as well (§10).

---

## 5. Credit accounting rules (CreditsModule)

`apps/api/src/credits/credits.module.ts`, `credits.service.ts`, `credits.controller.ts`.

All ledger writes go through **one** service method so the invariants live in one place:

```ts
// credits.service.ts — core primitive (pseudocode, implement with pg Pool)
async postEntry(client: PoolClient, entry: {
  userId: string; amount: bigint; entryType: LedgerEntryType;
  runId?: string; idempotencyKey: string; note?: string;
}): Promise<{ applied: boolean; balance: bigint }>
```

Rules — these are the contract; write tests for each (§11):

1. **Atomicity & locking.** Every entry runs inside a transaction that first executes
   `insert into credit_balances (user_id, balance) values ($1, 0) on conflict do nothing`
   then `select balance from credit_balances where user_id = $1 for update`.
   The row lock serializes concurrent spends per user (simple, correct; per-user contention is low).
2. **No overdraft.** If `amount < 0` and `balance + amount < 0`, raise `InsufficientCreditsError` → HTTP 402 from controllers.
3. **Idempotency.** Insert into `credit_ledger` with the unique `idempotency_key`; on conflict, return `applied: false` with the current balance and make the caller treat it as success (the entry already happened).
4. **Cached balance stays in the same transaction:** `update credit_balances set balance = balance + $amount, updated_at = now()`.
5. Convenience wrappers built on `postEntry`:
   - `grant(userId, amount, note, key)` — entry_type `grant` (signup bonus, admin top-up).
   - `reserve(userId, runId, cost)` — entry_type `hold`, amount `-cost`, key `hold:<runId>`.
   - `settle(runId)` — entry_type `debit_settle`, amount `0`, key `settle:<runId>`. The hold already removed the credits; settle is a zero-amount marker entry that finalizes the run for audit. (Alternative of release+re-debit adds failure windows for no benefit.)
   - `refund(userId, runId, cost)` — entry_type `hold_release`, amount `+cost`, key `refund:<runId>`.
6. **Signup grant:** on registration, grant `SIGNUP_CREDITS` (env, default 50) with key `signup:<userId>`.

Endpoints:

| Method & path | Auth | Behavior |
|---|---|---|
| `GET /credits/balance` | user | `{ balance, updatedAt }` from `credit_balances`. |
| `GET /credits/ledger?limit=50&before=<id>` | user | Paginated ledger entries for the caller. |
| `POST /admin/credits/grant` | admin | `{ userId, amount, note }` → grant with key `admin:<uuid>` generated server-side. |

---

## 6. Auth (AuthModule + UsersModule)

Minimal JWT email/password. Use `@nestjs/jwt` and `bcryptjs` (pure-JS, avoids native build issues on Windows/Alpine). No refresh tokens in v1 — 7-day access tokens are acceptable for this internal-stage product.

- `POST /auth/register` `{ email, password, displayName? }` → creates user (bcrypt cost 10), posts signup grant, returns `{ token, user }`. Reject duplicate email with 409.
- `POST /auth/login` `{ email, password }` → `{ token, user }`.
- `GET /auth/me` (JWT) → current user + balance.
- `JwtAuthGuard` + `@CurrentUser()` param decorator; `AdminGuard` checks `role === 'admin'`.
- JWT secret from `JWT_SECRET` env (add to `docker-compose.yml` api service and `.env.example`); fail fast at boot if unset in production.
- First admin: a `POST /auth/register` user can be promoted via SQL, or honor `ADMIN_EMAILS` env (comma-separated) that auto-assigns role `admin` at registration. Implement the env approach.

The existing `/agents/*` endpoints in `agents.controller.ts` must be put behind `AdminGuard` (they invoke agents with **no charge and no task whitelist** — leaving them open would bypass billing entirely). The web dashboard's public agent list moves to a new public `GET /catalog` (§7).

---

## 7. Catalog (CatalogModule)

- `GET /catalog` (public): enabled, `user_invocable` rows from `agent_task_prices`, joined with agent name/description from `agent-registry.ts`, plus live `endpointConfigured` flag. This is what the web "Run analysis" page renders.
- `PATCH /admin/catalog/:id` (admin): update `credit_cost`, `enabled`, `description`.
- Validate run payloads against `params_schema` with `ajv` at run creation time → 400 with the ajv error text on mismatch. Empty schema `{}` accepts anything (but payload size is capped at 16 KB).

---

## 8. Runs (RunsModule) — the core flow

`apps/api/src/runs/`: `runs.module.ts`, `runs.controller.ts`, `runs.service.ts`, `runs.processor.ts`.

Add dependencies to `apps/api/package.json`: `bullmq`, `@nestjs/bullmq`, `@nestjs/jwt`, `bcryptjs`, `ajv` (+ `@types/bcryptjs`). BullMQ reuses the existing `REDIS_URL`. **BullMQ requires `maxRetriesPerRequest: null`** on its Redis connection — create a separate ioredis connection for the queue rather than reusing `REDIS_CLIENT` (which sets `maxRetriesPerRequest: 1`).

### 8.1 Create run — `POST /runs` (JWT)

Request: `{ agentId, task, payload }`. Steps, in one DB transaction where marked:

1. Look up `agent_task_prices` row where `enabled and user_invocable` — 404 if absent. **Independently** reject `agentId === 'execution'` with 403 (defense in depth, §10).
2. Validate `payload` against `params_schema` (ajv) — 400 on failure.
3. **TX:** insert `analysis_runs` row (status `queued`, `credit_cost` snapshotted from the catalog row) and `creditsService.reserve(userId, runId, cost)`. If `InsufficientCreditsError` → the TX rolls back (no run row, no hold) → 402 `{ error: "insufficient_credits", balance, required }`.
4. After commit, enqueue BullMQ job `{ runId }` on queue `agent-runs` with `attempts: 1` (no automatic retries — a retried agent call could produce double work; failures refund instead). Job id = `runId` (queue-level idempotency).
   - If the enqueue itself throws, mark the run `failed` and refund immediately.
5. Return 202 `{ runId, status: 'queued', creditCost, balance }`.

### 8.2 Worker — `runs.processor.ts`

A `@Processor('agent-runs')` worker with `concurrency: 4`:

1. Load run; if status is not `queued`, exit (idempotent re-delivery guard).
2. Set status `running`, `started_at = now()`.
3. Call the existing `AgentsService.invoke(agentId, { task, payload })`. Wrap with a timeout: `RUN_TIMEOUT_MS` env, default 120 000 (backtests are slow).
4. On agent `status === 'ok'`: store `result`, status `succeeded`, `finished_at`, and `creditsService.settle(runId)`.
5. On `'error' | 'unavailable'` / timeout / throw: store `error`, status `failed`, then `creditsService.refund(userId, runId, cost)` and set status `refunded`. Refund **must** use the idempotency key `refund:<runId>` so a crashed-and-replayed job can't refund twice.
6. Wrap steps 4–5 so that a crash between agent completion and settlement is recoverable: on worker boot, run a **reconciliation sweep** — any run `running` older than `RUN_TIMEOUT_MS * 2` with no `debit_settle`/`hold_release` ledger entry is marked `failed` and refunded. Also run this sweep on a `setInterval` every 5 minutes inside the API process.

### 8.3 Read endpoints

| Method & path | Auth | Behavior |
|---|---|---|
| `GET /runs` | user | Caller's runs, newest first, paginated (`limit`, `before`). Excludes `result` body for list weight. |
| `GET /runs/:id` | user (owner) or admin | Full run incl. `result`/`error`. 404 if not owner. |
| `GET /admin/runs` | admin | All runs with user email, for the admin panel. |

### 8.4 Shared types

Add to `packages/shared/src/index.ts`: `RunStatus`, `AnalysisRun`, `CatalogItem`, `CreditLedgerEntry`, `CreateRunRequest/Response`, and keep `packages/shared` as the single source for the web app's API types.

---

## 9. Web app (apps/web)

Keep the existing visual language (`shell`, `grid`, `agent` card classes in the current CSS). New pages — these need client components and a small typed fetch helper:

1. **`app/lib/api.ts`** — fetch wrapper that attaches `Authorization: Bearer <token>` from `localStorage`, JSON-parses, throws typed errors (`401` → redirect to `/login`, `402` → surfaced as "insufficient credits").
2. **`app/login/page.tsx` & `app/register/page.tsx`** — email/password forms; on success store token, redirect to `/run`.
3. **`app/run/page.tsx`** — the analysis console:
   - Catalog grid from `GET /catalog` showing display name, description, **credit cost badge**, agent id.
   - Selecting a card opens a parameter form rendered from `params_schema` (handle `string`/`enum` → select, `integer` with min/max → number input; fall back to a JSON textarea for anything else).
   - Header shows live balance (`GET /credits/balance`); the Run button disables with a tooltip when balance < cost.
   - Submit → `POST /runs` → optimistically subtract cost from displayed balance → poll `GET /runs/:id` every 2 s until terminal status → render `result` JSON in a collapsible pretty-printed viewer; on `failed/refunded` show error and "credits refunded" notice and restore balance display.
4. **`app/history/page.tsx`** — table of past runs (status chip, agent/task, cost, created time) → click into result view; plus a ledger table from `GET /credits/ledger`.
5. **`app/page.tsx`** — keep as landing; replace the raw `/agents` fetch with public `GET /catalog` and add links to Login / Run analysis / History.

No new UI libraries; plain CSS consistent with what exists.

---

## 10. Safety constraints (non-negotiable)

These restate the repo's standing safety rule and apply to all new code:

1. The `execution` agent must never appear in `agent_task_prices`, never be returned by `GET /catalog`, and `POST /runs` must reject `agentId === 'execution'` with 403 even if a row is inserted by mistake. Add a unit test asserting the 403.
2. `post-trade-review` stays out of the catalog until it has real logic (it's a placeholder container).
3. User-run analysis is read/propose only — results must never be wired into any order path. Do not add any code path from `analysis_runs` to the execution agent.
4. The legacy `POST /agents/:agentId/invoke` becomes admin-only (§6). It bypasses pricing, schema validation, and the execution blacklist otherwise.

---

## 11. Testing & verification

Use the existing jest setup in `apps/api`. Unit tests with a mocked `Pool` are insufficient for ledger correctness; add an integration test suite that runs against the docker-compose Postgres (skip with `describe.skip` when `DATABASE_URL` is unreachable, mirroring the project's tolerance for missing infra).

Required tests:

1. **Ledger:** grant → balance; reserve beyond balance → `InsufficientCreditsError` and no rows written; duplicate idempotency key → `applied: false`, balance unchanged; concurrent reserves (two parallel transactions, combined cost > balance) → exactly one succeeds.
2. **Run lifecycle:** create run debits hold; processor success → `succeeded` + `debit_settle` entry; processor failure → `refunded` + `hold_release` entry restoring balance; replayed job on a terminal run is a no-op.
3. **Authz:** `/runs` without JWT → 401; reading another user's run → 404; `POST /runs` for `execution` → 403; `/agents/:id/invoke` as non-admin → 403.
4. **Catalog validation:** payload violating `params_schema` → 400.
5. **End-to-end smoke (manual, document in PR):** `docker compose up --build`, register via UI, observe 50-credit balance, run a Market Snapshot, watch it settle, run with a stopped agent container, watch the refund.

`npm run build` and `npm run test` at the repo root must pass.

---

## 12. Phases (implement in this order; each phase leaves the repo green)

| Phase | Deliverable | Done when |
|---|---|---|
| 1 | Migration runner + schema + seeds; UsersModule + AuthModule; signup grant | register/login works via curl; balance visible |
| 2 | CreditsModule (ledger primitives + endpoints) with integration tests | ledger tests pass against compose Postgres |
| 3 | CatalogModule + admin guards on legacy agent routes | `GET /catalog` returns seeded priced tasks |
| 4 | RunsModule + BullMQ worker + reconciliation sweep | e2e smoke (§11.5) passes incl. refund path |
| 5 | Web pages (login, run console, history) | a user can do everything from the browser |
| 6 *(optional, later)* | Stripe top-ups: `POST /billing/create-checkout-session` (Credits product, quantity = pack size) + `checkout.session.completed` webhook → `postEntry` type `purchase`, idempotency key `stripe:<session.id>` | test-mode purchase credits a balance exactly once despite webhook retries |

Phase 6 notes (from research): the webhook is the only trustworthy trigger for granting purchased credits — never grant on the client redirect; Stripe retries webhooks, which the `stripe:<session.id>` idempotency key absorbs. Keep all Stripe code behind a `PaymentsProvider` interface so the credits core stays payment-agnostic.

---

## 13. Configuration summary

New environment variables (add to `docker-compose.yml` api service and create `.env.example` if missing):

| Var | Default | Purpose |
|---|---|---|
| `JWT_SECRET` | — (required in prod) | JWT signing |
| `SIGNUP_CREDITS` | `50` | registration grant |
| `ADMIN_EMAILS` | empty | auto-admin at registration |
| `RUN_TIMEOUT_MS` | `120000` | per-run agent call timeout |
| `RUNS_CONCURRENCY` | `4` | BullMQ worker concurrency |

---

## 14. Design rationale (research notes)

- **Append-only ledger over mutable balance** and **idempotency keys as the dedupe mechanism** are the standard pattern for prepaid-credit SaaS; the ledger doubles as the user-facing transaction history and the audit/dispute trail. See [pgledger](https://www.pgrs.net/2025/03/24/pgledger-ledger-implementation-in-postgresql/), [freeCodeCamp's Postgres ledger walkthrough](https://www.freecodecamp.org/news/build-a-bank-ledger-in-go-with-postgresql-using-the-double-entry-accounting-principle/), and [Flexprice's credit-billing feature guide](https://flexprice.io/blog/essential-billing-features-for-credit-based-pricing). Full double-entry (paired accounts) was considered and deferred: with a single credit currency and the platform as sole counterparty, the `entry_type` column gives equivalent auditability at much lower complexity.
- **Row-level `SELECT ... FOR UPDATE`** per user serializes concurrent spends correctly; optimistic locking (as in [this real-time ledger writeup](https://www.martinrichards.me/post/ledger_p1_optimistic_locking_real_time_ledger/)) is only worth the retry machinery at far higher contention than one user clicking "Run".
- **Hold → settle/refund** mirrors payment-card auth/capture and is the recommended shape for metered AI work where the job can fail after payment is committed ([Chargebee prepaid-credits guide](https://www.chargebee.com/pricing-labs/prepaid-credit-pricing-guide/), [metered billing for AI agents](https://www.buildmvpfast.com/blog/metered-billing-ai-agents-usage-based-pricing-agent-workload-2026)). Pricing per *task* (work the customer understands) rather than per token/CPU follows the same guidance.
- **Prepaid credits specifically for AI products**: high marginal COGS plus fraud exposure make pay-up-front the safe default ([Stripe on credits pricing](https://stripe.com/resources/more/credits-pricing-models-for-scaling-businesses-explained), [Stripe usage-based billing credits](https://stripe.com/blog/introducing-credits-for-usage-based-billing)).
- **BullMQ on the existing Redis** is the lowest-footprint async layer for a NestJS app already shipping ioredis; job-id-as-runId gives queue-level idempotency and `attempts: 1` + refund avoids double-executing non-idempotent agent work ([BullMQ](https://bullmq.io/), [NestJS BullMQ patterns](https://www.dragonflydb.io/guides/bullmq-nestjs)).
- The repo's own product spec (`agenttasks.md.txt`) already plans subscription tiers, Stripe, plans/usage-limits tables. This credits system is deliberately compatible: tiers can later be modeled as recurring `grant` entries (monthly credit allowances) without reworking the ledger.
