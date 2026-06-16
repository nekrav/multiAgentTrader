import { existsSync, readFileSync, statSync } from "node:fs";
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

type ExternalNewsEvent = {
  id: string;
  time: string;
  title: string;
  importance: "high" | "medium" | "low";
  affected: string[];
};

type ExternalNewsAlert = {
  id: string;
  market: string;
  severity: "warning" | "info" | string;
  message: string;
  createdAt?: string;
};

@Injectable()
export class IntelligenceService implements OnModuleInit, OnModuleDestroy {
  private readonly newsFeedPath = process.env.NEWS_FEED_PATH ?? "/data/news/latest-news.json";
  private readonly refreshIntervalMs = Number(process.env.ANALYSIS_REFRESH_MS ?? 60_000);
  private readonly livePriceRefreshMs = Number(process.env.LIVE_PRICE_REFRESH_MS ?? this.refreshIntervalMs);
  private readonly livePriceTtlMs = Number(process.env.LIVE_PRICE_TTL_MS ?? this.refreshIntervalMs * 3);
  private readonly livePriceBySymbol = new Map<string, { price: number; updatedAt: number }>();
  private readonly priorLivePriceBySymbol = new Map<string, number>();
  private readonly marketDataEndpoint = this.getMarketDataEndpoint();
  private readonly liveAssetBySymbol = new Map<string, string>([
    ["EURUSD", "EUR/USD"],
    ["GBPUSD", "GBP/USD"],
    ["USDJPY", "USD/JPY"],
    ["AUDUSD", "AUD/USD"],
    ["USDCAD", "USD/CAD"],
    ["USDCHF", "USD/CHF"],
    ["NZDUSD", "NZD/USD"],
    ["EURGBP", "EUR/GBP"],
    ["EURJPY", "EUR/JPY"],
    ["GBPJPY", "GBP/JPY"],
    ["BTCUSD", "BTC"],
    ["ETHUSD", "ETH"],
  ]);

  private refreshTimer?: NodeJS.Timeout;
  private priceRefreshTimer?: NodeJS.Timeout;
  private runSequence = 0;
  private analysisSnapshot = this.buildAnalysisSnapshot("startup");
  private refreshingMarketPrices = false;

  constructor() {}

  async onModuleInit() {
    await this.refreshMarketPrices("startup");
    this.refreshAnalysis("startup");
    this.refreshTimer = setInterval(() => this.refreshAnalysis("interval"), this.refreshIntervalMs);
    this.refreshTimer.unref?.();

    this.priceRefreshTimer = setInterval(() => void this.refreshMarketPrices("interval"), this.livePriceRefreshMs);
    this.priceRefreshTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    if (this.priceRefreshTimer) {
      clearInterval(this.priceRefreshTimer);
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
      ...this.getNewsBundle(),
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
      news: this.getNewsIngestionStatus(),
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

  private getNewsBundle() {
    const news = this.loadExternalNews();
    return {
      events: [...events, ...news.events],
      alerts: [...alerts, ...news.alerts],
      reports,
    };
  }

  private getNewsIngestionStatus() {
    const feedLastUpdated = this.getNewsFeedUpdatedAt();
    if (feedLastUpdated === null) {
      return {
        status: "static",
        lagSeconds: null,
        source: "none",
      };
    }

    return {
      status: "script-updated",
      source: this.newsFeedPath,
      lagSeconds: Math.max(0, Math.round((Date.now() - feedLastUpdated) / 1000)),
      updatedAt: new Date(feedLastUpdated).toISOString(),
    };
  }

  private getNewsFeedUpdatedAt() {
    if (!existsSync(this.newsFeedPath)) {
      return null;
    }
    try {
      return Number(statSync(this.newsFeedPath).mtimeMs);
    } catch {
      return null;
    }
  }

  private loadExternalNews() {
    if (!existsSync(this.newsFeedPath)) {
      return { events: [], alerts: [] };
    }

    try {
      const raw = readFileSync(this.newsFeedPath, "utf-8").trim();
      if (!raw) {
        return { events: [], alerts: [] };
      }
      const payload = JSON.parse(raw) as {
        events?: Array<Partial<ExternalNewsEvent>>;
        alerts?: Array<Partial<ExternalNewsAlert>>;
      };

      const eventsFromFeed = this.normalizeNewsEvents(payload.events ?? []);
      const alertsFromFeed = this.normalizeNewsAlerts(payload.alerts ?? []);

      return {
        events: eventsFromFeed,
        alerts: alertsFromFeed,
      };
    } catch {
      return { events: [], alerts: [] };
    }
  }

  private normalizeNewsEvents(items: Array<Partial<ExternalNewsEvent>>): ExternalNewsEvent[] {
    return items
      .slice(0, 12)
      .map((item, index) => ({
        id: `news-${String(item.id ?? `item-${index}`).slice(0, 64)}`,
        time: this.normalizeNewsTime(item.time),
        title: String(item.title ?? "Untitled news update").slice(0, 130),
        importance: this.normalizeNewsImportance(item.importance),
        affected: this.normalizeStringArray(item.affected).slice(0, 8),
      }))
      .filter((item) => item.affected.length > 0);
  }

  private normalizeNewsAlerts(items: Array<Partial<ExternalNewsAlert>>): ExternalNewsAlert[] {
    return items
      .slice(0, 8)
      .map((item, index) => ({
        id: `news-alert-${String(item.id ?? `item-${index}`).slice(0, 60)}`,
        market: String(item.market ?? "DXY"),
        severity: String(item.severity ?? "info"),
        message: String(item.message ?? "News-derived signal processed.").slice(0, 190),
        createdAt: this.normalizeNewsTime(item.createdAt),
      }));
  }

  private normalizeNewsImportance(value: unknown): "high" | "medium" | "low" {
    if (value === "high" || value === "medium" || value === "low") {
      return value;
    }
    return "medium";
  }

  private normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  }

  private normalizeNewsTime(value: unknown): string {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    return new Date().toISOString();
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

  private async refreshMarketPrices(_context: "startup" | "interval" | "request") {
    if (this.refreshingMarketPrices) {
      return;
    }
    this.refreshingMarketPrices = true;

    try {
      await Promise.allSettled(
        Array.from(this.liveAssetBySymbol.entries()).map(async ([symbol, asset]) => {
          const spotPrice = await this.fetchLiveMarketPrice(asset);
          if (spotPrice === undefined || spotPrice <= 0 || Number.isNaN(spotPrice)) {
            return;
          }
          this.livePriceBySymbol.set(symbol, { price: spotPrice, updatedAt: Date.now() });
          if (!this.priorLivePriceBySymbol.has(symbol)) {
            this.priorLivePriceBySymbol.set(symbol, spotPrice);
          }
        }),
      );
      this.refreshAnalysis("request");
    } finally {
      this.refreshingMarketPrices = false;
    }
  }

  private getFreshLivePrice(symbol: string): number | undefined {
    const value = this.livePriceBySymbol.get(symbol);
    if (!value) {
      return undefined;
    }
    if (Date.now() - value.updatedAt > this.livePriceTtlMs) {
      return undefined;
    }
    return value.price;
  }

  private getMarketDataEndpoint() {
    const defaultEndpoint = "http://market-data-agent:7001";
    try {
      const raw = process.env.AGENT_ENDPOINTS_JSON;
      if (!raw) {
        return defaultEndpoint;
      }
      const endpoints = JSON.parse(raw) as Record<string, string>;
      return endpoints["market-data"] ?? defaultEndpoint;
    } catch {
      return defaultEndpoint;
    }
  }

  private async fetchLiveMarketPrice(asset: string): Promise<number | undefined> {
    try {
      const response = await fetch(`${this.marketDataEndpoint.replace(/\/$/, "")}/invoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "snapshot", payload: { asset, granularity: 60, limit: 120 } }),
      });
      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok || payload?.status !== "ok") {
        return undefined;
      }
      const result = payload.result as Record<string, unknown>;
      if (
        typeof result?.spotPrice === "number" &&
        Number.isFinite(result.spotPrice)
      ) {
        return result.spotPrice;
      }
      if (typeof result?.spotPrice === "string") {
        const candidate = Number(result.spotPrice);
        return Number.isFinite(candidate) ? candidate : undefined;
      }
      return undefined;
    } catch {
      return undefined;
    }
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
      const livePrice = this.getFreshLivePrice(market.symbol);
      if (livePrice !== undefined) {
        const previousPrice = this.priorLivePriceBySymbol.get(market.symbol);
        this.priorLivePriceBySymbol.set(market.symbol, livePrice);
        const roundedPrice = this.roundMarketPrice(livePrice);
        const change = previousPrice !== undefined && previousPrice > 0 ? ((roundedPrice - previousPrice) / previousPrice) * 100 : 0;
        const microWave = Math.sin((minuteSeed + index) / 9) * 0.015;
        return {
          ...market,
          price: roundedPrice,
          changePct: this.roundChange(change),
          confidence: this.clamp(market.confidence + microWave),
        };
      }

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
