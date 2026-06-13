import { Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import {
  alerts,
  buildAgentOutputs,
  buildCandles,
  buildConsensus,
  buildCrossMarketOutput,
  dependencies,
  events,
  Market,
  markets,
  plans,
  reports,
} from "./intelligence.data";

@Injectable()
export class IntelligenceService implements OnModuleInit, OnModuleDestroy {
  private readonly refreshIntervalMs = Number(process.env.ANALYSIS_REFRESH_MS ?? 60_000);
  private refreshTimer?: NodeJS.Timeout;
  private runSequence = 0;
  private analysisSnapshot = this.buildAnalysisSnapshot("startup");

  onModuleInit() {
    this.refreshAnalysis("startup");
    this.refreshTimer = setInterval(() => this.refreshAnalysis("interval"), this.refreshIntervalMs);
    this.refreshTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  getMarkets() {
    return this.getCurrentSnapshot().markets;
  }

  getPlans() {
    return plans;
  }

  register(body: Record<string, unknown>) {
    return {
      userId: "demo-user",
      email: body.email ?? "demo@example.com",
      plan: "trial",
      token: "demo-token",
      message: "Demo registration scaffold. Wire this to a real auth provider before production.",
    };
  }

  login(body: Record<string, unknown>) {
    return {
      userId: "demo-user",
      email: body.email ?? "demo@example.com",
      plan: "pro",
      token: "demo-token",
    };
  }

  createCheckoutSession(body: Record<string, unknown>) {
    return {
      id: "checkout_demo",
      planId: body.planId ?? "pro",
      url: "https://billing.example.local/checkout_demo",
      mode: "subscription",
    };
  }

  getDashboard() {
    const snapshot = this.getCurrentSnapshot();
    const enriched = snapshot.enrichedMarkets;

    return {
      title: "Multi-agent market intelligence for forex, crypto, stocks, gold, and oil",
      updatedAt: snapshot.updatedAt,
      nextRefreshAt: snapshot.nextRefreshAt,
      refreshIntervalSeconds: Math.round(this.refreshIntervalMs / 1000),
      analysisRunId: snapshot.runId,
      analysisRunSequence: snapshot.runSequence,
      markets: enriched,
      watchlist: enriched.filter((market) =>
        ["USDCAD", "XAUUSD", "USDJPY", "BTCUSD", "ETHUSD", "QQQ", "NVDA"].includes(market.symbol),
      ),
      strongestBullish: enriched
        .filter((market) => market.consensus.finalBias === "bullish")
        .sort((a, b) => b.consensus.finalConfidence - a.consensus.finalConfidence)
        .slice(0, 3),
      strongestBearish: enriched
        .filter((market) => market.consensus.finalBias === "bearish")
        .sort((a, b) => b.consensus.finalConfidence - a.consensus.finalConfidence)
        .slice(0, 3),
      conflicts: enriched.filter((market) => market.dependency.conflictScore >= 0.2),
      events,
      alerts,
      reports,
      plans,
    };
  }

  getMarket(symbol: string) {
    const snapshot = this.getCurrentSnapshot();
    const market = this.findMarket(symbol, snapshot.markets);
    return {
      ...market,
      candles: buildCandles(market, snapshot.updatedAt),
      agents: buildAgentOutputs(market, snapshot.updatedAt),
      dependency: buildCrossMarketOutput(market, snapshot.markets),
      consensus: buildConsensus(market, snapshot.markets, snapshot.updatedAt),
      analysisRunId: snapshot.runId,
      updatedAt: snapshot.updatedAt,
      scenarios: [
        {
          name: "Continuation",
          probability: Math.round(buildConsensus(market, snapshot.markets, snapshot.updatedAt).finalConfidence * 100),
          summary: `Price respects the current regime and dependency confirmation remains intact.`,
        },
        {
          name: "Invalidation",
          probability: Math.round((1 - buildConsensus(market, snapshot.markets, snapshot.updatedAt).finalConfidence) * 100),
          summary: buildConsensus(market, snapshot.markets, snapshot.updatedAt).invalidation,
        },
      ],
      confidenceHistory: buildCandles(market, snapshot.updatedAt).map((candle, index) => ({
        time: candle.time,
        value: Math.max(0.35, Math.min(0.9, market.confidence + Math.sin(index / 4) * 0.05)),
      })),
    };
  }

  getCandles(symbol: string) {
    const snapshot = this.getCurrentSnapshot();
    return buildCandles(this.findMarket(symbol, snapshot.markets), snapshot.updatedAt);
  }

  getMarketAgents(symbol: string) {
    const snapshot = this.getCurrentSnapshot();
    return buildAgentOutputs(this.findMarket(symbol, snapshot.markets), snapshot.updatedAt);
  }

  getConsensus(symbol: string) {
    const snapshot = this.getCurrentSnapshot();
    return buildConsensus(this.findMarket(symbol, snapshot.markets), snapshot.markets, snapshot.updatedAt);
  }

  getReports() {
    return reports;
  }

  getReport(id: string) {
    const report = reports.find((item) => item.id === id);
    if (!report) {
      throw new NotFoundException(`Unknown report: ${id}`);
    }
    return {
      ...report,
      sections: [
        "Consensus is strongest where market direction agrees with dependency drivers.",
        "Disagreements are surfaced explicitly so analysts can avoid false precision.",
        "All outputs are structured and suitable for historical storage once Postgres is enabled.",
      ],
    };
  }

  getAlerts() {
    return alerts;
  }

  createAlert(body: Record<string, unknown>) {
    return {
      id: `alert_${Date.now()}`,
      market: body.market ?? "USDCAD",
      type: body.type ?? "consensus_change",
      severity: body.severity ?? "info",
      message: body.message ?? "Demo alert rule created.",
      createdAt: new Date().toISOString(),
    };
  }

  updateAlert(id: string, body: Record<string, unknown>) {
    return { id, ...body, updatedAt: new Date().toISOString() };
  }

  deleteAlert(id: string) {
    return { id, deleted: true };
  }

  getSubscription() {
    return {
      userId: "demo-user",
      plan: "Pro",
      status: "trialing",
      trialEndsAt: "2026-06-18T13:00:00.000Z",
      activeAgents: 5,
      marketLimit: this.getCurrentSnapshot().markets.length,
      features: ["intraday dashboard", "advanced alerts", "dependency analysis", "report history"],
    };
  }

  getAdminUsers() {
    return [
      { id: "demo-user", email: "demo@example.com", plan: "Pro", status: "trialing" },
      { id: "analyst-2", email: "analyst@example.com", plan: "Elite", status: "active" },
    ];
  }

  getAdminSubscriptions() {
    return [
      { id: "sub_demo", userId: "demo-user", plan: "Pro", mrr: 149, status: "trialing" },
      { id: "sub_elite", userId: "analyst-2", plan: "Elite", mrr: 399, status: "active" },
    ];
  }

  getAdminAgents() {
    const snapshot = this.getCurrentSnapshot();
    return [
      { id: "technical", name: "Technical agent", health: "ok", latestRun: snapshot.updatedAt, cadenceSeconds: Math.round(this.refreshIntervalMs / 1000) },
      { id: "sentiment", name: "News / sentiment agent", health: "ok", latestRun: snapshot.updatedAt, cadenceSeconds: Math.round(this.refreshIntervalMs / 1000) },
      { id: "regime", name: "Regime / correlation agent", health: "ok", latestRun: snapshot.updatedAt, cadenceSeconds: Math.round(this.refreshIntervalMs / 1000) },
      { id: "risk", name: "Risk agent", health: "ok", latestRun: snapshot.updatedAt, cadenceSeconds: Math.round(this.refreshIntervalMs / 1000) },
      { id: "dependency", name: "Cross-market dependency agent", health: "ok", latestRun: snapshot.updatedAt, cadenceSeconds: Math.round(this.refreshIntervalMs / 1000) },
      { id: "consensus", name: "Meta-consensus agent", health: "ok", latestRun: snapshot.updatedAt, cadenceSeconds: Math.round(this.refreshIntervalMs / 1000) },
    ];
  }

  getIngestionHealth() {
    const snapshot = this.getCurrentSnapshot();
    const lagSeconds = Math.max(0, Math.round((Date.now() - Date.parse(snapshot.updatedAt)) / 1000));
    return {
      candles: { status: "minute-refresh", lagSeconds },
      news: { status: "scaffolded", lagSeconds: null },
      calendar: { status: "minute-refresh", lagSeconds },
      dependencies: { status: "config-driven", count: dependencies.length },
      analysis: {
        status: "running",
        runId: snapshot.runId,
        updatedAt: snapshot.updatedAt,
        nextRefreshAt: snapshot.nextRefreshAt,
        cadenceSeconds: Math.round(this.refreshIntervalMs / 1000),
      },
    };
  }

  getAgentRuns() {
    const snapshot = this.getCurrentSnapshot();
    return snapshot.markets.slice(0, 5).flatMap((market) =>
      buildAgentOutputs(market, snapshot.updatedAt).map((output) => ({
        id: `${snapshot.runId}-${market.symbol}-${output.agent.toLowerCase().replaceAll(" ", "-")}`,
        market: market.symbol,
        agent: output.agent,
        status: "completed",
        confidence: output.confidence,
        createdAt: output.timestamp,
        runId: snapshot.runId,
      })),
    );
  }

  updateAdminAgent(id: string, body: Record<string, unknown>) {
    return { id, ...body, updatedAt: new Date().toISOString() };
  }

  private getCurrentSnapshot() {
    const snapshotAge = Date.now() - Date.parse(this.analysisSnapshot.updatedAt);
    if (snapshotAge >= this.refreshIntervalMs) {
      this.refreshAnalysis("request");
    }
    return this.analysisSnapshot;
  }

  private refreshAnalysis(reason: "startup" | "interval" | "request") {
    this.analysisSnapshot = this.buildAnalysisSnapshot(reason);
  }

  private buildAnalysisSnapshot(reason: "startup" | "interval" | "request") {
    const updatedAt = new Date().toISOString();
    const runSequence = this.runSequence + 1;
    this.runSequence = runSequence;
    const runId = `analysis_${runSequence}_${Date.parse(updatedAt)}`;
    const refreshedMarkets = this.buildLiveMarkets(runSequence, updatedAt);
    const enrichedMarkets = refreshedMarkets.map((market) => ({
      ...market,
      consensus: buildConsensus(market, refreshedMarkets, updatedAt),
      dependency: buildCrossMarketOutput(market, refreshedMarkets),
    }));

    return {
      reason,
      runId,
      runSequence,
      updatedAt,
      nextRefreshAt: new Date(Date.parse(updatedAt) + this.refreshIntervalMs).toISOString(),
      markets: refreshedMarkets,
      enrichedMarkets,
    };
  }

  private buildLiveMarkets(runSequence: number, updatedAt: string): Market[] {
    const minuteSeed = Math.floor(Date.parse(updatedAt) / 60_000);
    return markets.map((market, index) => {
      const wave = Math.sin((minuteSeed + index * 7) / 5) * 0.0018;
      const microTrend = Math.cos((runSequence + index * 3) / 4) * 0.0009;
      const priceMultiplier = 1 + wave + microTrend;
      const changeAdjustment = (wave + microTrend) * 100;
      const confidenceAdjustment = Math.sin((minuteSeed + index) / 9) * 0.015;

      return {
        ...market,
        price: this.roundMarketPrice(market.price * priceMultiplier),
        changePct: this.roundChange(market.changePct + changeAdjustment),
        confidence: this.clamp(market.confidence + confidenceAdjustment),
      };
    });
  }

  private roundMarketPrice(value: number) {
    return Number(value.toFixed(value > 50 ? 2 : 4));
  }

  private roundChange(value: number) {
    return Number(value.toFixed(2));
  }

  private clamp(value: number) {
    return Math.max(0.05, Math.min(0.95, Number(value.toFixed(4))));
  }

  private findMarket(symbol: string, marketUniverse = this.getCurrentSnapshot().markets) {
    const normalized = symbol.replace("/", "").toUpperCase();
    const market = marketUniverse.find((item) => item.symbol === normalized || item.label.replace("/", "") === normalized);
    if (!market) {
      throw new NotFoundException(`Unknown market: ${symbol}`);
    }
    return market;
  }
}
