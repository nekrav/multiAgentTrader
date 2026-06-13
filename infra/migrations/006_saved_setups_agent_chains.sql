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
