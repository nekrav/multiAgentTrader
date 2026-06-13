insert into agent_task_prices (agent_id, task, display_name, description, credit_cost, params_schema) values
  (
    'event-analysis',
    'event_study',
    'Event Study Analysis',
    'Compares current macro, earnings, and crypto events with similar historical event templates before strategy promotion.',
    4,
    '{"type":"object","properties":{"currentEvent":{"type":"object"},"historicalEvents":{"type":"array"}},"required":["currentEvent"]}'::jsonb
  )
on conflict (agent_id, task) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  credit_cost = excluded.credit_cost,
  enabled = true,
  user_invocable = true,
  params_schema = excluded.params_schema;
