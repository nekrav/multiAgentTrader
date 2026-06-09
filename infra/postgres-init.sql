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
