create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists credit_ledger (
  id bigserial primary key,
  user_id uuid not null references users(id),
  amount bigint not null,
  entry_type text not null check (
    entry_type in ('grant', 'purchase', 'hold', 'hold_release', 'debit_settle', 'admin_adjust')
  ),
  run_id uuid,
  idempotency_key text not null unique,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists credit_ledger_user_idx on credit_ledger(user_id, created_at desc);

create table if not exists credit_balances (
  user_id uuid primary key references users(id),
  balance bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists agent_task_prices (
  id bigserial primary key,
  agent_id text not null,
  task text not null,
  display_name text not null,
  description text not null default '',
  credit_cost bigint not null check (credit_cost >= 0),
  enabled boolean not null default true,
  user_invocable boolean not null default true,
  params_schema jsonb not null default '{}'::jsonb,
  unique (agent_id, task)
);

create table if not exists analysis_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  agent_id text not null,
  task text not null,
  payload jsonb not null default '{}'::jsonb,
  credit_cost bigint not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'refunded')),
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists analysis_runs_user_idx on analysis_runs(user_id, created_at desc);

insert into agent_task_prices (agent_id, task, display_name, description, credit_cost, params_schema) values
  (
    'market-data',
    'snapshot',
    'Market Snapshot',
    'Spot price, trend, realized volatility, fast-move score for BTC/ETH.',
    1,
    '{"type":"object","properties":{"asset":{"type":"string","enum":["BTC","ETH"]},"granularity":{"type":"integer","enum":[60,300,900,3600]},"limit":{"type":"integer","minimum":10,"maximum":300}},"required":["asset"]}'::jsonb
  ),
  (
    'risk',
    'evaluate',
    'Risk Evaluation',
    'Deterministic pass/veto across volatility, range, spread, liquidity, EV.',
    2,
    '{"type":"object"}'::jsonb
  ),
  (
    'strategy-research',
    'propose',
    'Strategy Proposal',
    'Deterministic strategy/config proposal from market + risk inputs.',
    5,
    '{"type":"object"}'::jsonb
  ),
  (
    'strategy-research',
    'strategy_sweep',
    'Strategy Sweep',
    'Proposal plus Strategy Lab-style strategy sweep for slower compute-heavy analysis.',
    25,
    '{"type":"object"}'::jsonb
  )
on conflict (agent_id, task) do nothing;
