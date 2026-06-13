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
