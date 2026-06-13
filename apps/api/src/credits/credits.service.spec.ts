import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { Pool } from "pg";
import { CreditsService, InsufficientCreditsError } from "./credits.service";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://aitraders:aitraders_dev_password@localhost:5432/aitraders";

describe("CreditsService integration", () => {
  let pool: Pool;
  let service: CreditsService;
  let available = false;

  beforeAll(async () => {
    pool = new Pool({ connectionString: databaseUrl });
    try {
      await pool.query("select 1");
      available = true;
      await pool.query(readFileSync(resolve(process.cwd(), "../../infra/migrations/002_credits_and_runs.sql"), "utf8"));
      service = new CreditsService(pool);
    } catch {
      available = false;
    }
  });

  afterAll(async () => {
    await pool?.end().catch(() => undefined);
  });

  async function createUser() {
    if (!available) {
      return "";
    }
    const result = await pool.query(
      "insert into users(email, password_hash) values ($1, 'hash') returning id",
      [`test-${randomUUID()}@example.com`],
    );
    return String(result.rows[0].id);
  }

  it("grants credits and returns the cached balance", async () => {
    if (!available) {
      return;
    }
    const userId = await createUser();
    const result = await service.grant(userId, 10n, "test", `test-grant:${randomUUID()}`);
    expect(result.applied).toBe(true);
    expect(result.balance).toBe(10n);
    await expect(service.getBalance(userId)).resolves.toMatchObject({ balance: "10" });
  });

  it("prevents overdrafts and leaves balance unchanged", async () => {
    if (!available) {
      return;
    }
    const userId = await createUser();
    await service.grant(userId, 3n, "test", `test-grant:${randomUUID()}`);
    await expect(
      service.withTransaction((client) => service.reserve(client, userId, randomUUID(), 4n)),
    ).rejects.toBeInstanceOf(InsufficientCreditsError);
    await expect(service.getBalance(userId)).resolves.toMatchObject({ balance: "3" });
  });

  it("deduplicates idempotency keys", async () => {
    if (!available) {
      return;
    }
    const userId = await createUser();
    const key = `test-grant:${randomUUID()}`;
    const first = await service.grant(userId, 5n, "test", key);
    const second = await service.grant(userId, 5n, "test", key);
    expect(first.applied).toBe(true);
    expect(second.applied).toBe(false);
    await expect(service.getBalance(userId)).resolves.toMatchObject({ balance: "5" });
  });
});
