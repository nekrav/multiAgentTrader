insert into credit_balances(user_id, balance)
select user_id, coalesce(sum(amount), 0)
from credit_ledger
group by user_id
on conflict (user_id) do update
  set balance = excluded.balance,
      updated_at = now();
