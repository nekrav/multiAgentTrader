import { describe, expect, it, jest } from "@jest/globals";
import { PoolClient } from "pg";
import { CreditsService, InsufficientCreditsError } from "./credits.service";

function serviceWithClient(client: PoolClient) {
  const pool = {
    connect: jest.fn().mockResolvedValue(client as never),
  };
  return {
    service: new CreditsService(pool as never),
    pool,
  };
}

describe("CreditsService unit behavior", () => {
  it("commits a transaction when the callback succeeds", async () => {
    const client = {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 } as never),
      release: jest.fn(),
    } as unknown as PoolClient;
    const { service } = serviceWithClient(client);

    await expect(service.withTransaction(async () => "ok")).resolves.toBe("ok");
    expect(client.query).toHaveBeenNthCalledWith(1, "begin");
    expect(client.query).toHaveBeenNthCalledWith(2, "commit");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("rolls back and releases the client when the callback fails", async () => {
    const client = {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 } as never),
      release: jest.fn(),
    } as unknown as PoolClient;
    const { service } = serviceWithClient(client);
    const error = new Error("boom");

    await expect(
      service.withTransaction(async () => {
        throw error;
      }),
    ).rejects.toBe(error);
    expect(client.query).toHaveBeenNthCalledWith(1, "begin");
    expect(client.query).toHaveBeenNthCalledWith(2, "rollback");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("applies grants exactly once for an idempotency key", async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never)
        .mockResolvedValueOnce({ rows: [{ balance: "0" }], rowCount: 1 } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as never)
        .mockResolvedValueOnce({ rows: [{ balance: "25" }], rowCount: 1 } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never)
        .mockResolvedValueOnce({ rows: [{ balance: "25" }], rowCount: 1 } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never),
    } as unknown as PoolClient;
    const service = new CreditsService({} as never);

    await expect(
      service.postEntry(client, {
        userId: "user-1",
        amount: 25n,
        entryType: "grant",
        idempotencyKey: "grant:user-1",
      }),
    ).resolves.toEqual({ applied: true, balance: 25n });

    await expect(
      service.postEntry(client, {
        userId: "user-1",
        amount: 25n,
        entryType: "grant",
        idempotencyKey: "grant:user-1",
      }),
    ).resolves.toEqual({ applied: false, balance: 25n });
  });

  it("prevents negative balances before inserting a ledger entry", async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never)
        .mockResolvedValueOnce({ rows: [{ balance: "3" }], rowCount: 1 } as never),
    } as unknown as PoolClient;
    const service = new CreditsService({} as never);

    await expect(
      service.postEntry(client, {
        userId: "user-1",
        amount: -4n,
        entryType: "hold",
        runId: "run-1",
        idempotencyKey: "hold:run-1",
      }),
    ).rejects.toMatchObject({
      balance: 3n,
      required: 4n,
    } satisfies Partial<InsufficientCreditsError>);
    expect((client.query as jest.Mock).mock.calls).toHaveLength(2);
  });
});
