import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Pool } from "pg";
import { AuthUser } from "../auth/auth.types";
import { CatalogService } from "../catalog/catalog.service";
import { CreditsService, InsufficientCreditsError } from "../credits/credits.service";
import { POSTGRES_POOL } from "../database/database.module";

export type RunStatus = "queued" | "running" | "succeeded" | "failed" | "refunded";
export type TradeSetupStatus = "draft" | "watching" | "ready" | "archived";
export type ChainStatus = "queued" | "running" | "succeeded" | "failed" | "refunded";

const CHAIN_STEPS = [
  { title: "Event context", agentId: "event-analysis", task: "event_study" },
  { title: "Market snapshot", agentId: "market-data", task: "snapshot" },
  { title: "Risk gate", agentId: "risk", task: "evaluate" },
  { title: "Strategy proposal", agentId: "strategy-research", task: "propose" },
];

function toRun(row: Record<string, unknown>, includeResult = true) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    userEmail: row.user_email ? String(row.user_email) : undefined,
    agentId: String(row.agent_id),
    task: String(row.task),
    payload: row.payload ?? {},
    creditCost: String(row.credit_cost),
    status: row.status as RunStatus,
    result: includeResult ? (row.result ?? null) : undefined,
    error: row.error ? String(row.error) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    startedAt: row.started_at ? new Date(String(row.started_at)).toISOString() : null,
    finishedAt: row.finished_at ? new Date(String(row.finished_at)).toISOString() : null,
  };
}

function toSavedAnalysis(row: Record<string, unknown>) {
  return {
    id: String(row.saved_id ?? row.id),
    runId: String(row.run_id),
    setupId: row.setup_id ? String(row.setup_id) : null,
    title: String(row.title),
    notes: row.notes ? String(row.notes) : "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: new Date(String(row.saved_created_at ?? row.created_at)).toISOString(),
    run: {
      id: String(row.run_id),
      agentId: String(row.agent_id),
      task: String(row.task),
      status: row.status as RunStatus,
      result: row.result ?? null,
      error: row.error ? String(row.error) : null,
      createdAt: new Date(String(row.run_created_at)).toISOString(),
      finishedAt: row.finished_at ? new Date(String(row.finished_at)).toISOString() : null,
    },
  };
}

function toTradeSetup(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    asset: String(row.asset),
    direction: String(row.direction),
    status: String(row.status) as TradeSetupStatus,
    thesis: String(row.thesis ?? ""),
    riskPlan: String(row.risk_plan ?? ""),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function toChainRun(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    setupId: row.setup_id ? String(row.setup_id) : null,
    title: String(row.title),
    status: String(row.status) as ChainStatus,
    inputPayload: (row.input_payload as Record<string, unknown>) ?? {},
    totalCreditCost: String(row.total_credit_cost ?? 0),
    error: row.error ? String(row.error) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    startedAt: row.started_at ? new Date(String(row.started_at)).toISOString() : null,
    finishedAt: row.finished_at ? new Date(String(row.finished_at)).toISOString() : null,
  };
}

function toChainStep(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    chainRunId: String(row.chain_run_id),
    stepIndex: Number(row.step_index),
    title: String(row.title),
    agentId: String(row.agent_id),
    task: String(row.task),
    runId: row.run_id ? String(row.run_id) : null,
    status: String(row.status),
    result: row.result ?? null,
    error: row.error ? String(row.error) : null,
    startedAt: row.started_at ? new Date(String(row.started_at)).toISOString() : null,
    finishedAt: row.finished_at ? new Date(String(row.finished_at)).toISOString() : null,
  };
}

@Injectable()
export class RunsService {
  constructor(
    @Inject(POSTGRES_POOL) private readonly postgres: Pool,
    @InjectQueue("agent-runs") private readonly queue: Queue,
    private readonly catalog: CatalogService,
    private readonly credits: CreditsService,
  ) {}

  async createRun(user: AuthUser, input: { agentId?: string; task?: string; payload?: Record<string, unknown> }) {
    const agentId = String(input.agentId ?? "");
    const task = String(input.task ?? "");
    const payload = input.payload ?? {};
    const price = await this.catalog.requireRunnableTask(agentId, task);
    this.catalog.validatePayload(price, payload);

    let runId = "";
    let balance = 0n;
    try {
      const tx = await this.credits.withTransaction(async (client) => {
        const run = await client.query(
          `insert into analysis_runs(user_id, agent_id, task, payload, credit_cost)
           values ($1, $2, $3, $4, $5)
           returning id`,
          [user.id, agentId, task, payload, price.creditCost.toString()],
        );
        const id = String(run.rows[0].id);
        const reserve = await this.credits.reserve(client, user.id, id, price.creditCost);
        return { id, balance: reserve.balance };
      });
      runId = tx.id;
      balance = tx.balance;
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        throw error;
      }
      throw error;
    }

    try {
      await this.queue.add("run-agent", { runId }, { jobId: runId, attempts: 1, removeOnComplete: 100, removeOnFail: 100 });
    } catch (error) {
      await this.postgres.query("update analysis_runs set status = 'failed', error = $2, finished_at = now() where id = $1", [
        runId,
        error instanceof Error ? error.message : "Failed to enqueue run.",
      ]);
      await this.credits.refund(user.id, runId, price.creditCost);
      const refunded = await this.credits.getBalance(user.id);
      return { runId, status: "refunded", creditCost: price.creditCost.toString(), balance: refunded.balance };
    }

    return { runId, status: "queued", creditCost: price.creditCost.toString(), balance: balance.toString() };
  }

  async listRuns(user: AuthUser, limit = 25, before?: string) {
    const boundedLimit = Math.max(1, Math.min(100, limit));
    const params: Array<string | number> = [user.id, boundedLimit];
    const beforeClause = before ? "and created_at < $3::timestamptz" : "";
    if (before) {
      params.push(before);
    }
    const result = await this.postgres.query(
      `select id, user_id, agent_id, task, payload, credit_cost, status, error, created_at, started_at, finished_at
       from analysis_runs
       where user_id = $1 ${beforeClause}
       order by created_at desc
       limit $2`,
      params,
    );
    return result.rows.map((row) => toRun(row, false));
  }

  async getRun(user: AuthUser, id: string) {
    const result = await this.postgres.query(
      `select id, user_id, agent_id, task, payload, credit_cost, status, result, error, created_at, started_at, finished_at
       from analysis_runs
       where id = $1`,
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException("Run not found.");
    }
    if (String(row.user_id) !== user.id && user.role !== "admin") {
      throw new NotFoundException("Run not found.");
    }
    return toRun(row);
  }

  async saveAnalysis(user: AuthUser, input: { runId?: string; title?: string; notes?: string; tags?: string[]; setupId?: string | null }) {
    const runId = String(input.runId ?? "");
    const run = await this.getRun(user, runId);
    const title = String(input.title || `${run.agentId} ${run.task}`).slice(0, 140);
    const tags = Array.isArray(input.tags) ? input.tags.map(String).slice(0, 12) : [];

    if (input.setupId) {
      await this.requireTradeSetupOwner(user, String(input.setupId));
    }

    const result = await this.postgres.query(
      `insert into saved_analyses(user_id, run_id, setup_id, title, notes, tags)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (user_id, run_id) do update
         set setup_id = excluded.setup_id,
             title = excluded.title,
             notes = excluded.notes,
             tags = excluded.tags,
             updated_at = now()
       returning id`,
      [user.id, runId, input.setupId ?? null, title, String(input.notes ?? ""), JSON.stringify(tags)],
    );
    return this.getSavedAnalysis(user, String(result.rows[0].id));
  }

  async listSavedAnalyses(user: AuthUser, limit = 50) {
    const result = await this.postgres.query(
      `select s.id as saved_id, s.run_id, s.setup_id, s.title, s.notes, s.tags, s.created_at as saved_created_at,
              r.agent_id, r.task, r.status, r.result, r.error, r.created_at as run_created_at, r.finished_at
       from saved_analyses s
       join analysis_runs r on r.id = s.run_id
       where s.user_id = $1
       order by s.updated_at desc
       limit $2`,
      [user.id, Math.max(1, Math.min(100, limit))],
    );
    return result.rows.map(toSavedAnalysis);
  }

  async getSavedAnalysis(user: AuthUser, id: string) {
    const result = await this.postgres.query(
      `select s.id as saved_id, s.run_id, s.setup_id, s.title, s.notes, s.tags, s.created_at as saved_created_at,
              r.agent_id, r.task, r.status, r.result, r.error, r.created_at as run_created_at, r.finished_at
       from saved_analyses s
       join analysis_runs r on r.id = s.run_id
       where s.id = $1 and s.user_id = $2`,
      [id, user.id],
    );
    if (!result.rows[0]) {
      throw new NotFoundException("Saved analysis not found.");
    }
    return toSavedAnalysis(result.rows[0]);
  }

  async listTradeSetups(user: AuthUser, limit = 50) {
    const result = await this.postgres.query(
      `select id, user_id, title, asset, direction, status, thesis, risk_plan, metadata, created_at, updated_at
       from trade_setups
       where user_id = $1
       order by updated_at desc
       limit $2`,
      [user.id, Math.max(1, Math.min(100, limit))],
    );
    return result.rows.map(toTradeSetup);
  }

  async createTradeSetup(
    user: AuthUser,
    input: { title?: string; asset?: string; direction?: string; thesis?: string; riskPlan?: string; status?: TradeSetupStatus; metadata?: Record<string, unknown> },
  ) {
    const result = await this.postgres.query(
      `insert into trade_setups(user_id, title, asset, direction, thesis, risk_plan, status, metadata)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id, user_id, title, asset, direction, status, thesis, risk_plan, metadata, created_at, updated_at`,
      [
        user.id,
        String(input.title || `${input.asset || "BTC"} setup`).slice(0, 140),
        String(input.asset || "BTC").slice(0, 24).toUpperCase(),
        String(input.direction || "long").slice(0, 24),
        String(input.thesis ?? ""),
        String(input.riskPlan ?? ""),
        input.status ?? "draft",
        input.metadata ?? {},
      ],
    );
    return toTradeSetup(result.rows[0]);
  }

  async updateTradeSetup(
    user: AuthUser,
    id: string,
    input: Partial<{ title: string; asset: string; direction: string; thesis: string; riskPlan: string; status: TradeSetupStatus; metadata: Record<string, unknown> }>,
  ) {
    await this.requireTradeSetupOwner(user, id);
    const result = await this.postgres.query(
      `update trade_setups
       set title = coalesce($3, title),
           asset = coalesce($4, asset),
           direction = coalesce($5, direction),
           thesis = coalesce($6, thesis),
           risk_plan = coalesce($7, risk_plan),
           status = coalesce($8, status),
           metadata = coalesce($9, metadata),
           updated_at = now()
       where id = $1 and user_id = $2
       returning id, user_id, title, asset, direction, status, thesis, risk_plan, metadata, created_at, updated_at`,
      [
        id,
        user.id,
        input.title === undefined ? null : String(input.title).slice(0, 140),
        input.asset === undefined ? null : String(input.asset).slice(0, 24).toUpperCase(),
        input.direction === undefined ? null : String(input.direction).slice(0, 24),
        input.thesis === undefined ? null : String(input.thesis),
        input.riskPlan === undefined ? null : String(input.riskPlan),
        input.status ?? null,
        input.metadata ?? null,
      ],
    );
    return toTradeSetup(result.rows[0]);
  }

  async createAgentChain(user: AuthUser, input: { setupId?: string; title?: string; asset?: string; direction?: string; eventTitle?: string; riskProfile?: string; strategies?: string[]; runBacktest?: boolean; backtestDays?: number }) {
    if (input.setupId) {
      await this.requireTradeSetupOwner(user, input.setupId);
    }

    const prices = await Promise.all(CHAIN_STEPS.map((step) => this.catalog.requireRunnableTask(step.agentId, step.task)));
    const payload = {
      asset: String(input.asset || "BTC").toUpperCase(),
      direction: String(input.direction || "long"),
      eventTitle: String(input.eventTitle || "Current market setup review"),
      riskProfile: String(input.riskProfile || "balanced"),
      strategies: Array.isArray(input.strategies) ? input.strategies.map(String).slice(0, 12) : [],
      runBacktest: input.runBacktest !== false,
      backtestDays: Math.max(5, Math.min(365, Number(input.backtestDays ?? 90))),
    };

    let chainId = "";
    const created = await this.credits.withTransaction(async (client) => {
      const chain = await client.query(
        `insert into agent_chain_runs(user_id, setup_id, title, input_payload, total_credit_cost)
         values ($1, $2, $3, $4, $5)
         returning id`,
        [user.id, input.setupId ?? null, String(input.title || `${payload.asset} agent chain`).slice(0, 140), payload, prices.reduce((sum, price) => sum + price.creditCost, 0n).toString()],
      );
      chainId = String(chain.rows[0].id);
      let balance = 0n;
      for (const [index, step] of CHAIN_STEPS.entries()) {
        const price = prices[index];
        const run = await client.query(
          `insert into analysis_runs(user_id, agent_id, task, payload, credit_cost)
           values ($1, $2, $3, '{}'::jsonb, $4)
           returning id`,
          [user.id, step.agentId, step.task, price.creditCost.toString()],
        );
        const runId = String(run.rows[0].id);
        const reserved = await this.credits.reserve(client, user.id, runId, price.creditCost);
        balance = reserved.balance;
        await client.query(
          `insert into agent_chain_steps(chain_run_id, step_index, title, agent_id, task, run_id)
           values ($1, $2, $3, $4, $5, $6)`,
          [chainId, index + 1, step.title, step.agentId, step.task, runId],
        );
      }
      return { chainId, balance };
    });

    try {
      await this.queue.add("run-agent-chain", { chainId }, { jobId: chainId, attempts: 1, removeOnComplete: 100, removeOnFail: 100 });
    } catch (error) {
      await this.markChainEnqueueFailed(user.id, chainId, error instanceof Error ? error.message : "Failed to enqueue chain.");
    }

    return { chainId: created.chainId, status: "queued", balance: created.balance.toString() };
  }

  async listAgentChains(user: AuthUser, limit = 25) {
    const result = await this.postgres.query(
      `select id, setup_id, title, status, input_payload, total_credit_cost, error, created_at, started_at, finished_at
       from agent_chain_runs
       where user_id = $1
       order by created_at desc
       limit $2`,
      [user.id, Math.max(1, Math.min(100, limit))],
    );
    return result.rows.map(toChainRun);
  }

  async getAgentChain(user: AuthUser, id: string) {
    const chain = await this.postgres.query(
      `select id, user_id, setup_id, title, status, input_payload, total_credit_cost, error, created_at, started_at, finished_at
       from agent_chain_runs where id = $1`,
      [id],
    );
    const row = chain.rows[0];
    if (!row || (String(row.user_id) !== user.id && user.role !== "admin")) {
      throw new NotFoundException("Agent chain not found.");
    }
    const steps = await this.postgres.query(
      `select s.id, s.chain_run_id, s.step_index, s.title, s.agent_id, s.task, s.run_id, s.status,
              r.result, r.error, s.started_at, s.finished_at
       from agent_chain_steps s
       left join analysis_runs r on r.id = s.run_id
       where s.chain_run_id = $1
       order by s.step_index asc`,
      [id],
    );
    return { ...toChainRun(row), steps: steps.rows.map(toChainStep) };
  }

  async listAdminRuns(limit = 50) {
    const result = await this.postgres.query(
      `select r.id, r.user_id, u.email as user_email, r.agent_id, r.task, r.payload, r.credit_cost, r.status,
              r.result, r.error, r.created_at, r.started_at, r.finished_at
       from analysis_runs r
       join users u on u.id = r.user_id
       order by r.created_at desc
       limit $1`,
      [Math.max(1, Math.min(200, limit))],
    );
    return result.rows.map((row) => toRun(row, false));
  }

  assertExecutionBlocked(agentId: string) {
    if (agentId === "execution") {
      throw new ForbiddenException("Execution agent is not user-invocable.");
    }
  }

  private async requireTradeSetupOwner(user: AuthUser, id: string) {
    const result = await this.postgres.query("select user_id from trade_setups where id = $1", [id]);
    if (!result.rows[0] || (String(result.rows[0].user_id) !== user.id && user.role !== "admin")) {
      throw new NotFoundException("Trade setup not found.");
    }
  }

  private async markChainEnqueueFailed(userId: string, chainId: string, error: string) {
    const steps = await this.postgres.query(
      `select r.id, r.credit_cost
       from agent_chain_steps s
       join analysis_runs r on r.id = s.run_id
       where s.chain_run_id = $1`,
      [chainId],
    );
    await this.postgres.query("update agent_chain_runs set status = 'refunded', error = $2, finished_at = now() where id = $1", [chainId, error]);
    for (const row of steps.rows) {
      await this.postgres.query("update analysis_runs set status = 'refunded', error = $2, finished_at = now() where id = $1", [row.id, error]);
      await this.credits.refund(userId, String(row.id), BigInt(String(row.credit_cost)));
    }
  }
}
