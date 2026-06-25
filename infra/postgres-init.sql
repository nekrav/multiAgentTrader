create extension if not exists pgcrypto;

create table if not exists agent_events (
  id bigserial primary key,
  agent_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists agent_invocations (
  id bigserial primary key,
  agent_id text not null,
  status text not null,
  request jsonb not null default '{}'::jsonb,
  response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists plans (
  id text primary key,
  name text not null,
  price_cents integer not null default 0,
  agent_limit integer not null,
  market_limit integer not null,
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id),
  plan_id text references plans(id),
  status text not null,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists markets (
  id text primary key,
  label text not null,
  asset_class text not null,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists candles (
  market_id text references markets(id),
  timeframe text not null,
  ts timestamptz not null,
  open numeric not null,
  high numeric not null,
  low numeric not null,
  close numeric not null,
  volume numeric,
  primary key (market_id, timeframe, ts)
);

create table if not exists news_items (
  id bigserial primary key,
  market_id text references markets(id),
  headline text not null,
  source text,
  sentiment_score numeric,
  importance text not null default 'medium',
  published_at timestamptz not null
);

create table if not exists economic_events (
  id bigserial primary key,
  title text not null,
  importance text not null,
  affected_markets jsonb not null default '[]'::jsonb,
  event_time timestamptz not null
);

create table if not exists agent_runs (
  id bigserial primary key,
  agent_id text not null,
  market_id text references markets(id),
  timeframe text not null,
  status text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists agent_outputs (
  id bigserial primary key,
  run_id bigint references agent_runs(id),
  market_id text references markets(id),
  agent_id text not null,
  timeframe text not null,
  bias text,
  confidence numeric,
  score numeric,
  summary text,
  raw_output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists consensus_outputs (
  id bigserial primary key,
  market_id text references markets(id),
  timeframe text not null,
  bias text not null,
  confidence numeric not null,
  agreement_score numeric not null,
  summary text not null,
  raw_output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists alert_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id),
  market_id text references markets(id),
  alert_type text not null,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists alert_events (
  id bigserial primary key,
  alert_rule_id uuid references alert_rules(id),
  market_id text references markets(id),
  severity text not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cadence text not null,
  markets jsonb not null default '[]'::jsonb,
  summary text not null,
  body jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists market_dependencies (
  id bigserial primary key,
  source_market_id text not null,
  target_market_id text not null,
  dependency_type text not null,
  weight numeric not null,
  tier text not null,
  stability_score numeric,
  current_regime text,
  updated_at timestamptz not null default now()
);

create table if not exists cross_market_outputs (
  id bigserial primary key,
  target_market_id text not null,
  timeframe text not null,
  ts timestamptz not null,
  related_markets jsonb not null default '[]'::jsonb,
  confirmation_score numeric not null,
  conflict_score numeric not null,
  final_adjustment numeric not null,
  summary text not null,
  raw_output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists auth_sessions_user_idx on auth_sessions(user_id, expires_at desc);
create index if not exists auth_sessions_expires_idx on auth_sessions(expires_at);

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

create table if not exists trade_setups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  title text not null,
  asset text not null,
  direction text not null default 'long',
  status text not null default 'draft' check (status in ('draft', 'watching', 'ready', 'archived')),
  thesis text not null default '',
  risk_plan text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trade_setups_user_idx on trade_setups(user_id, updated_at desc);

create table if not exists saved_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  run_id uuid not null references analysis_runs(id),
  setup_id uuid references trade_setups(id),
  title text not null,
  notes text not null default '',
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, run_id)
);

create index if not exists saved_analyses_user_idx on saved_analyses(user_id, updated_at desc);
create index if not exists saved_analyses_setup_idx on saved_analyses(setup_id, updated_at desc);

create table if not exists agent_chain_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  setup_id uuid references trade_setups(id),
  title text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'refunded')),
  input_payload jsonb not null default '{}'::jsonb,
  total_credit_cost bigint not null default 0,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists agent_chain_runs_user_idx on agent_chain_runs(user_id, created_at desc);

create table if not exists agent_chain_steps (
  id uuid primary key default gen_random_uuid(),
  chain_run_id uuid not null references agent_chain_runs(id) on delete cascade,
  step_index integer not null,
  title text not null,
  agent_id text not null,
  task text not null,
  run_id uuid references analysis_runs(id),
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'refunded')),
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  unique (chain_run_id, step_index)
);

insert into agent_task_prices (agent_id, task, display_name, description, credit_cost, params_schema) values
  (
    'market-data',
    'snapshot',
    'Market Snapshot',
    'Spot crypto candles or major forex daily rates, with trend, realized volatility, and fast-move metrics.',
    1,
    '{"type":"object","properties":{"asset":{"type":"string","enum":["BTC","ETH","EUR/USD","GBP/USD","USD/JPY","AUD/USD","USD/CAD","USD/CHF","NZD/USD","EUR/GBP","EUR/JPY","GBP/JPY"]},"granularity":{"type":"integer","enum":[60,300,900,3600]},"limit":{"type":"integer","minimum":10,"maximum":300}},"required":["asset"]}'::jsonb
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
  ),
  (
    'event-analysis',
    'event_study',
    'Event Study Analysis',
    'Compares current macro, earnings, and crypto events with similar historical event templates before strategy promotion.',
    4,
    '{"type":"object","properties":{"currentEvent":{"type":"object"},"historicalEvents":{"type":"array"}},"required":["currentEvent"]}'::jsonb
  )
on conflict (agent_id, task) do nothing;

with upserted_user as (
  insert into users(email, password_hash, display_name, role)
  values (
    'admin@aitraders.local',
    '$2b$10$BB.z49/sIMtKwR93EBJnWe.qNnZ6MjM2tCgw5oYn76OkDE1cZUfQC',
    'Admin',
    'admin'
  )
  on conflict (email) do update
    set password_hash = excluded.password_hash,
        display_name = coalesce(users.display_name, excluded.display_name),
        role = 'admin'
  returning id
),
balance_row as (
  insert into credit_balances(user_id, balance)
  select id, 0 from upserted_user
  on conflict (user_id) do nothing
),
grant_row as (
  insert into credit_ledger(user_id, amount, entry_type, idempotency_key, note)
  select id, 50, 'grant', 'bootstrap-admin:admin@aitraders.local', 'Bootstrap admin credit grant.'
  from upserted_user
  on conflict (idempotency_key) do nothing
  returning user_id, amount
)
update credit_balances
set balance = credit_balances.balance + grant_row.amount,
    updated_at = now()
from grant_row
where credit_balances.user_id = grant_row.user_id;
