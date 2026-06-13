import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Pool, PoolClient } from "pg";
import { POSTGRES_POOL } from "../database/database.module";

export type LedgerEntryType = "grant" | "purchase" | "hold" | "hold_release" | "debit_settle" | "admin_adjust";

export class InsufficientCreditsError extends HttpException {
  constructor(
    readonly balance: bigint,
    readonly required: bigint,
  ) {
    super(
      {
        error: "insufficient_credits",
        balance: balance.toString(),
        required: required.toString(),
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}

export interface LedgerEntry {
  id: string;
  userId: string;
  amount: string;
  entryType: LedgerEntryType;
  runId: string | null;
  idempotencyKey: string;
  note: string | null;
  createdAt: string;
}

function toBigInt(value: unknown) {
  return typeof value === "bigint" ? value : BigInt(String(value ?? 0));
}

function toLedgerEntry(row: Record<string, unknown>): LedgerEntry {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    amount: String(row.amount),
    entryType: row.entry_type as LedgerEntryType,
    runId: row.run_id ? String(row.run_id) : null,
    idempotencyKey: String(row.idempotency_key),
    note: row.note ? String(row.note) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

@Injectable()
export class CreditsService {
  constructor(@Inject(POSTGRES_POOL) private readonly postgres: Pool) {}

  async getBalance(userId: string) {
    await this.postgres.query("insert into credit_balances(user_id, balance) values ($1, 0) on conflict do nothing", [userId]);
    const result = await this.postgres.query("select balance, updated_at from credit_balances where user_id = $1", [userId]);
    const row = result.rows[0] ?? { balance: 0, updated_at: new Date().toISOString() };
    return { balance: String(row.balance), updatedAt: new Date(String(row.updated_at)).toISOString() };
  }

  async listLedger(userId: string, limit = 50, before?: string) {
    const boundedLimit = Math.max(1, Math.min(100, limit));
    const params: Array<string | number> = [userId, boundedLimit];
    const beforeClause = before ? "and id < $3" : "";
    if (before) {
      params.push(before);
    }
    const result = await this.postgres.query(
      `select id, user_id, amount, entry_type, run_id, idempotency_key, note, created_at
       from credit_ledger
       where user_id = $1 ${beforeClause}
       order by id desc
       limit $2`,
      params,
    );
    return result.rows.map(toLedgerEntry);
  }

  async grant(userId: string, amount: bigint, note: string, key = `admin:${randomUUID()}`) {
    return this.withTransaction((client) =>
      this.postEntry(client, { userId, amount, entryType: "grant", idempotencyKey: key, note }),
    );
  }

  async reserve(client: PoolClient, userId: string, runId: string, cost: bigint) {
    return this.postEntry(client, {
      userId,
      amount: -cost,
      entryType: "hold",
      runId,
      idempotencyKey: `hold:${runId}`,
      note: "Reserved credits for analysis run.",
    });
  }

  async settle(runId: string) {
    const run = await this.postgres.query("select user_id from analysis_runs where id = $1", [runId]);
    const userId = run.rows[0]?.user_id ? String(run.rows[0].user_id) : undefined;
    if (!userId) {
      return { applied: false, balance: 0n };
    }
    return this.withTransaction((client) =>
      this.postEntry(client, {
        userId,
        amount: 0n,
        entryType: "debit_settle",
        runId,
        idempotencyKey: `settle:${runId}`,
        note: "Analysis run completed.",
      }),
    );
  }

  async refund(userId: string, runId: string, cost: bigint) {
    return this.withTransaction((client) =>
      this.postEntry(client, {
        userId,
        amount: cost,
        entryType: "hold_release",
        runId,
        idempotencyKey: `refund:${runId}`,
        note: "Analysis run failed; reserved credits released.",
      }),
    );
  }

  async postEntry(
    client: PoolClient,
    entry: {
      userId: string;
      amount: bigint;
      entryType: LedgerEntryType;
      runId?: string;
      idempotencyKey: string;
      note?: string;
    },
  ): Promise<{ applied: boolean; balance: bigint }> {
    await client.query("insert into credit_balances(user_id, balance) values ($1, 0) on conflict do nothing", [entry.userId]);
    const balanceResult = await client.query("select balance from credit_balances where user_id = $1 for update", [entry.userId]);
    const balance = toBigInt(balanceResult.rows[0]?.balance);
    if (entry.amount < 0n && balance + entry.amount < 0n) {
      throw new InsufficientCreditsError(balance, -entry.amount);
    }

    const insert = await client.query(
      `insert into credit_ledger(user_id, amount, entry_type, run_id, idempotency_key, note)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (idempotency_key) do nothing`,
      [entry.userId, entry.amount.toString(), entry.entryType, entry.runId ?? null, entry.idempotencyKey, entry.note ?? null],
    );

    if (!insert.rowCount) {
      return { applied: false, balance };
    }

    const updated = await client.query(
      "update credit_balances set balance = balance + $2, updated_at = now() where user_id = $1 returning balance",
      [entry.userId, entry.amount.toString()],
    );
    return { applied: true, balance: toBigInt(updated.rows[0]?.balance) };
  }

  async withTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
    const client = await this.postgres.connect();
    try {
      await client.query("begin");
      const result = await callback(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}
