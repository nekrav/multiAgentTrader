create table if not exists future_contracts (
  id uuid primary key default gen_random_uuid(),
  underlying text not null,
  symbol text not null unique,
  exchange text not null default 'CME',
  expiry date not null,
  contract_month text not null,
  tick_size numeric not null default 0.01,
  multiplier numeric not null default 1,
  is_active boolean not null default true
);

create table if not exists future_curve_snapshots (
  id uuid primary key default gen_random_uuid(),
  underlying text not null,
  ts timestamptz not null default now(),
  curve_json jsonb not null default '[]'::jsonb,
  front_contract text not null,
  second_contract text,
  third_contract text,
  m1_price numeric not null,
  m2_price numeric,
  m3_price numeric,
  m1_m2_spread numeric,
  m2_m3_spread numeric
);
create index if not exists future_curve_snapshots_underlying_ts_idx on future_curve_snapshots(underlying, ts desc);

create table if not exists open_interest_snapshots (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references future_contracts(id),
  ts timestamptz not null default now(),
  volume numeric not null default 0,
  open_interest numeric not null default 0,
  oi_change numeric not null default 0,
  volume_change numeric not null default 0
);

create table if not exists futures_agent_outputs (
  id uuid primary key default gen_random_uuid(),
  market text not null,
  timeframe text not null,
  ts timestamptz not null default now(),
  agent_key text not null,
  bias text not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  score numeric not null,
  summary text not null,
  risk_flags_json jsonb not null default '[]'::jsonb,
  features_json jsonb not null default '{}'::jsonb,
  model_version text not null,
  input_hash text
);
create index if not exists futures_agent_outputs_market_tf_ts_idx on futures_agent_outputs(market, timeframe, ts desc);

create table if not exists option_contracts (
  id uuid primary key default gen_random_uuid(),
  underlying text not null,
  symbol text not null unique,
  expiry date not null,
  strike numeric not null,
  option_type text not null check (option_type in ('call','put')),
  exchange text not null default 'CME',
  multiplier numeric not null default 100,
  is_active boolean not null default true
);

create table if not exists option_chain_snapshots (
  id uuid primary key default gen_random_uuid(),
  underlying text not null,
  ts timestamptz not null default now(),
  expiry date not null,
  strike numeric not null,
  option_type text not null check (option_type in ('call','put')),
  bid numeric,
  ask numeric,
  mid numeric,
  volume numeric,
  open_interest numeric,
  implied_vol numeric,
  delta numeric,
  gamma numeric,
  theta numeric,
  vega numeric
);
create index if not exists option_chain_snapshots_underlying_expiry_idx on option_chain_snapshots(underlying, expiry, ts desc);

create table if not exists vol_surface_snapshots (
  id uuid primary key default gen_random_uuid(),
  underlying text not null,
  ts timestamptz not null default now(),
  surface_json jsonb not null default '{}'::jsonb,
  atm_term_structure_json jsonb not null default '{}'::jsonb,
  skew_score numeric,
  smile_curvature numeric,
  iv_rank numeric,
  iv_percentile numeric
);

create table if not exists options_agent_outputs (
  id uuid primary key default gen_random_uuid(),
  market text not null,
  timeframe text not null,
  ts timestamptz not null default now(),
  agent_key text not null,
  bias text not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  score numeric not null,
  summary text not null,
  risk_flags_json jsonb not null default '[]'::jsonb,
  features_json jsonb not null default '{}'::jsonb,
  model_version text not null,
  input_hash text
);
create index if not exists options_agent_outputs_market_tf_ts_idx on options_agent_outputs(market, timeframe, ts desc);

create table if not exists strategy_recommendations (
  id uuid primary key default gen_random_uuid(),
  underlying text not null,
  ts timestamptz not null default now(),
  timeframe text not null,
  strategy_family text not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  rationale text not null,
  risk_note text not null,
  invalidation_note text not null,
  features_json jsonb not null default '{}'::jsonb
);
create index if not exists strategy_recommendations_underlying_ts_idx on strategy_recommendations(underlying, ts desc);

insert into future_contracts(underlying, symbol, expiry, contract_month, tick_size, multiplier)
values ('CL','CLN26','2026-07-20','2026-07',0.01,1000), ('CL','CLQ26','2026-08-20','2026-08',0.01,1000), ('CL','CLU26','2026-09-20','2026-09',0.01,1000), ('GC','GCQ26','2026-08-27','2026-08',0.1,100), ('GC','GCV26','2026-10-27','2026-10',0.1,100), ('GC','GCZ26','2026-12-27','2026-12',0.1,100)
on conflict (symbol) do nothing;

insert into future_curve_snapshots(underlying, curve_json, front_contract, second_contract, third_contract, m1_price, m2_price, m3_price, m1_m2_spread, m2_m3_spread)
values ('CL','[{"contract":"CLN26","price":75.20},{"contract":"CLQ26","price":74.60},{"contract":"CLU26","price":74.10}]','CLN26','CLQ26','CLU26',75.20,74.60,74.10,0.60,0.50),
('GC','[{"contract":"GCQ26","price":2324.0},{"contract":"GCV26","price":2324.5},{"contract":"GCZ26","price":2324.1}]','GCQ26','GCV26','GCZ26',2324.0,2324.5,2324.1,-0.5,0.4);

insert into option_contracts(underlying, symbol, expiry, strike, option_type)
values ('GC_OPTIONS','GC260731C2325','2026-07-31',2325,'call'), ('GC_OPTIONS','GC260731P2325','2026-07-31',2325,'put'), ('GC_OPTIONS','GC260731C2375','2026-07-31',2375,'call'), ('GC_OPTIONS','GC260731P2275','2026-07-31',2275,'put')
on conflict (symbol) do nothing;

insert into option_chain_snapshots(underlying, expiry, strike, option_type, bid, ask, mid, volume, open_interest, implied_vol, delta, gamma, theta, vega)
values ('GC_OPTIONS','2026-07-31',2325,'call',42,44,43,120,550,0.176,0.51,0.035,-0.05,0.18), ('GC_OPTIONS','2026-07-31',2325,'put',39,41,40,100,620,0.181,-0.49,0.034,-0.05,0.17), ('GC_OPTIONS','2026-07-31',2375,'call',22,23,22.5,80,420,0.19,0.28,0.022,-0.035,0.14), ('GC_OPTIONS','2026-07-31',2275,'put',24,25,24.5,160,770,0.24,-0.31,0.024,-0.036,0.15);

insert into vol_surface_snapshots(underlying, surface_json, atm_term_structure_json, skew_score, smile_curvature, iv_rank, iv_percentile)
values ('GC_OPTIONS','{"front":{"atm_iv":0.176,"put_25_delta_iv":0.24,"call_25_delta_iv":0.19}}','{"front":0.176,"back":0.151}',0.05,0.02,68,72);
