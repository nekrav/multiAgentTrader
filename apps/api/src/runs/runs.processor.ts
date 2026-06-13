import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Pool } from "pg";
import { AgentsService } from "../agents/agents.service";
import { CreditsService } from "../credits/credits.service";
import { POSTGRES_POOL } from "../database/database.module";

function timeoutMs() {
  return Math.max(1000, Number(process.env.RUN_TIMEOUT_MS ?? 120000));
}

function terminal(status: string) {
  return status === "succeeded" || status === "failed" || status === "refunded";
}

@Processor("agent-runs", { concurrency: Number(process.env.RUNS_CONCURRENCY ?? 4) })
@Injectable()
export class RunsProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(RunsProcessor.name);
  private sweepTimer?: NodeJS.Timeout;

  constructor(
    @Inject(POSTGRES_POOL) private readonly postgres: Pool,
    private readonly agents: AgentsService,
    private readonly credits: CreditsService,
  ) {
    super();
  }

  async onModuleInit() {
    await this.reconcileStaleRuns().catch((error) =>
      this.logger.warn(error instanceof Error ? error.message : "Initial run reconciliation failed."),
    );
    this.sweepTimer = setInterval(() => {
      void this.reconcileStaleRuns().catch((error) => this.logger.warn(error instanceof Error ? error.message : String(error)));
    }, 5 * 60 * 1000);
    this.sweepTimer.unref?.();
  }

  async process(job: Job<{ runId?: string; chainId?: string }>) {
    if (job.name === "run-agent-chain" && job.data.chainId) {
      await this.processChain(job.data.chainId);
      return;
    }

    if (!job.data.runId) {
      return;
    }
    const run = await this.loadRun(job.data.runId);
    if (!run || run.status !== "queued") {
      return;
    }

    await this.postgres.query("update analysis_runs set status = 'running', started_at = now() where id = $1 and status = 'queued'", [
      run.id,
    ]);

    try {
      const response = await this.withTimeout(
        this.agents.invoke(run.agentId, { task: run.task, payload: run.payload as Record<string, unknown> }),
        timeoutMs(),
      );
      if (response.status === "ok") {
        await this.postgres.query(
          "update analysis_runs set status = 'succeeded', result = $2, finished_at = now() where id = $1",
          [run.id, response.result ?? {}],
        );
        await this.credits.settle(run.id);
        return;
      }

      await this.failAndRefund(run, response.message ?? `Agent returned ${response.status}.`);
    } catch (error) {
      await this.failAndRefund(run, error instanceof Error ? error.message : "Run failed.");
    }
  }

  async reconcileStaleRuns() {
    const result = await this.postgres.query(
      `select id, user_id, agent_id, task, payload, credit_cost, status
       from analysis_runs
       where status = 'running'
         and started_at < now() - (($1::int * 2) || ' milliseconds')::interval`,
      [timeoutMs()],
    );
    for (const row of result.rows) {
      const settled = await this.postgres.query(
        "select 1 from credit_ledger where run_id = $1 and entry_type in ('debit_settle', 'hold_release') limit 1",
        [row.id],
      );
      if (!settled.rowCount) {
        await this.failAndRefund(this.toLoadedRun(row), "Run timed out and was reconciled.");
      }
    }
  }

  private async failAndRefund(run: LoadedRun, error: string) {
    await this.postgres.query("update analysis_runs set status = 'failed', error = $2, finished_at = now() where id = $1", [
      run.id,
      error,
    ]);
    await this.credits.refund(run.userId, run.id, run.creditCost);
    await this.postgres.query("update analysis_runs set status = 'refunded' where id = $1", [run.id]);
  }

  private async processChain(chainId: string) {
    const chain = await this.loadChain(chainId);
    if (!chain || chain.status !== "queued") {
      return;
    }

    await this.postgres.query("update agent_chain_runs set status = 'running', started_at = now() where id = $1 and status = 'queued'", [
      chain.id,
    ]);

    const steps = await this.loadChainSteps(chain.id);
    const previousResults: Record<string, unknown> = {};
    try {
      for (const step of steps) {
        const run = await this.loadRun(step.runId);
        if (!run) {
          throw new Error(`Missing analysis run for ${step.title}.`);
        }
        const payload = this.buildChainPayload(chain.inputPayload, step, previousResults);
        await this.postgres.query("update agent_chain_steps set status = 'running', started_at = now() where id = $1", [step.id]);
        await this.postgres.query("update analysis_runs set status = 'running', payload = $2, started_at = now() where id = $1 and status = 'queued'", [
          step.runId,
          payload,
        ]);

        const response = await this.withTimeout(this.agents.invoke(step.agentId, { task: step.task, payload }), timeoutMs());
        if (response.status !== "ok") {
          throw new Error(response.message ?? `${step.title} returned ${response.status}.`);
        }

        previousResults[`${step.agentId}:${step.task}`] = response.result ?? {};
        await this.postgres.query("update analysis_runs set status = 'succeeded', result = $2, finished_at = now() where id = $1", [
          step.runId,
          response.result ?? {},
        ]);
        await this.postgres.query("update agent_chain_steps set status = 'succeeded', finished_at = now() where id = $1", [step.id]);
        await this.credits.settle(step.runId);
      }

      await this.postgres.query("update agent_chain_runs set status = 'succeeded', finished_at = now() where id = $1", [chain.id]);
    } catch (error) {
      await this.failChain(chain, steps, error instanceof Error ? error.message : "Agent chain failed.");
    }
  }

  private async failChain(chain: LoadedChain, steps: LoadedChainStep[], error: string) {
    await this.postgres.query("update agent_chain_runs set status = 'failed', error = $2, finished_at = now() where id = $1", [chain.id, error]);
    for (const step of steps) {
      const run = await this.loadRun(step.runId);
      if (!run || run.status === "succeeded" || run.status === "refunded") {
        continue;
      }
      await this.postgres.query("update analysis_runs set status = 'failed', error = $2, finished_at = now() where id = $1 and status in ('queued', 'running')", [
        step.runId,
        error,
      ]);
      await this.postgres.query("update agent_chain_steps set status = 'failed', error = $2, finished_at = now() where id = $1 and status in ('queued', 'running')", [
        step.id,
        error,
      ]);
      await this.credits.refund(run.userId, run.id, run.creditCost);
      await this.postgres.query("update analysis_runs set status = 'refunded' where id = $1 and status = 'failed'", [step.runId]);
      await this.postgres.query("update agent_chain_steps set status = 'refunded' where id = $1 and status = 'failed'", [step.id]);
    }
    await this.postgres.query("update agent_chain_runs set status = 'refunded' where id = $1", [chain.id]);
  }

  private async loadRun(runId: string): Promise<LoadedRun | null> {
    const result = await this.postgres.query(
      "select id, user_id, agent_id, task, payload, credit_cost, status from analysis_runs where id = $1",
      [runId],
    );
    return result.rows[0] ? this.toLoadedRun(result.rows[0]) : null;
  }

  private async loadChain(chainId: string): Promise<LoadedChain | null> {
    const result = await this.postgres.query(
      "select id, user_id, status, input_payload from agent_chain_runs where id = $1",
      [chainId],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      id: String(row.id),
      userId: String(row.user_id),
      status: String(row.status),
      inputPayload: (row.input_payload as Record<string, unknown>) ?? {},
    };
  }

  private async loadChainSteps(chainId: string): Promise<LoadedChainStep[]> {
    const result = await this.postgres.query(
      "select id, step_index, title, agent_id, task, run_id from agent_chain_steps where chain_run_id = $1 order by step_index asc",
      [chainId],
    );
    return result.rows.map((row) => ({
      id: String(row.id),
      stepIndex: Number(row.step_index),
      title: String(row.title),
      agentId: String(row.agent_id),
      task: String(row.task),
      runId: String(row.run_id),
    }));
  }

  private buildChainPayload(input: Record<string, unknown>, step: LoadedChainStep, previousResults: Record<string, unknown>) {
    const asset = normalizeAsset(String(input.asset || "BTC"));
    const assetClass = asset.includes("/") ? "forex" : "crypto";
    const eventTitle = String(input.eventTitle || `${asset} setup review`);
    const eventResult = previousResults["event-analysis:event_study"] as Record<string, unknown> | undefined;
    const marketResult = previousResults["market-data:snapshot"] as Record<string, unknown> | undefined;
    const riskResult = previousResults["risk:evaluate"] as Record<string, unknown> | undefined;
    const strategies = Array.isArray(input.strategies) ? input.strategies.map(String) : [];
    const runBacktest = input.runBacktest !== false;
    const backtestDays = Math.max(5, Math.min(365, Number(input.backtestDays ?? 90)));

    if (step.agentId === "event-analysis") {
      return {
        currentEvent: {
          title: eventTitle,
          eventType: "macro",
          assetClasses: assetClass === "forex" ? ["forex", "stocks", "crypto"] : ["crypto", "forex", "stocks"],
          affectedAssets: affectedAssetsFor(asset),
          importance: "high",
          surpriseDirection: "unknown",
          timeWindow: "next 0-24h",
        },
      };
    }
    if (step.agentId === "market-data") {
      return { asset, granularity: 300, limit: 120 };
    }
    if (step.agentId === "risk") {
      return {
        snapshot: {
          ...(marketResult ?? {}),
          asset,
          spreadPct: assetClass === "forex" ? 0.08 : 0.6,
          liquidityUsdc: assetClass === "forex" ? 1000000 : 1500,
          recentLosses: 0,
          evPct: 0.45,
        },
      };
    }
    if (step.agentId === "strategy-research") {
      return {
        marketSnapshot: { ...(marketResult ?? {}), strategies },
        riskCheck: riskResult ?? {},
        eventStudy: eventResult ?? {},
        asset,
        assetClass,
        assets: [asset],
        strategies,
        days: backtestDays,
        granularity: assetClass === "forex" ? 86400 : 3600,
        startingCash: 1000,
        feeBps: assetClass === "forex" ? 1 : 6,
        slippageBps: assetClass === "forex" ? 1 : 2,
        runBacktest,
      };
    }
    return {};
  }

  private toLoadedRun(row: Record<string, unknown>): LoadedRun {
    return {
      id: String(row.id),
      userId: String(row.user_id),
      agentId: String(row.agent_id),
      task: String(row.task),
      payload: (row.payload as Record<string, unknown>) ?? {},
      creditCost: BigInt(String(row.credit_cost)),
      status: String(row.status),
    };
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number) {
    let timeout: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(() => reject(new Error("Run timed out.")), ms);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}

interface LoadedRun {
  id: string;
  userId: string;
  agentId: string;
  task: string;
  payload: Record<string, unknown>;
  creditCost: bigint;
  status: string;
}

interface LoadedChain {
  id: string;
  userId: string;
  status: string;
  inputPayload: Record<string, unknown>;
}

interface LoadedChainStep {
  id: string;
  stepIndex: number;
  title: string;
  agentId: string;
  task: string;
  runId: string;
}

function normalizeAsset(asset: string) {
  const compact = asset.toUpperCase().replace(/-/g, "/");
  const aliases: Record<string, string> = {
    BTCUSD: "BTC",
    "BTC/USD": "BTC",
    "BTC/USDT": "BTC",
    ETHUSD: "ETH",
    "ETH/USD": "ETH",
    "ETH/USDT": "ETH",
    EURUSD: "EUR/USD",
    GBPUSD: "GBP/USD",
    USDJPY: "USD/JPY",
    AUDUSD: "AUD/USD",
    USDCAD: "USD/CAD",
    USDCHF: "USD/CHF",
    NZDUSD: "NZD/USD",
    EURGBP: "EUR/GBP",
    EURJPY: "EUR/JPY",
    GBPJPY: "GBP/JPY",
  };
  if (aliases[compact]) {
    return aliases[compact];
  }
  if (compact.includes("/")) {
    const [base, quote] = compact.split("/");
    return `${base}/${quote}`;
  }
  if (compact.includes("ETH")) {
    return "ETH";
  }
  return compact.includes("BTC") ? "BTC" : compact;
}

function affectedAssetsFor(asset: string) {
  if (asset.includes("/")) {
    const [base, quote] = asset.split("/");
    return [asset, base, quote, "DXY", "US10Y", "SPY"];
  }
  return [asset, `${asset}-USD`, "USD", "DXY", "QQQ"];
}
