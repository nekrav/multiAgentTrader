import type { CSSProperties, ReactNode } from "react";
import { BrowserClock } from "./browser-clock";
import { LiveHomeDashboard } from "./live-home-dashboard";
import { TerminalChartPanel } from "./terminal-chart-panel-client";
import { TopNav } from "./top-nav";

type Bias = "bullish" | "bearish" | "neutral";

type DashboardMarket = {
  symbol: string;
  label: string;
  assetClass: string;
  price: number;
  changePct: number;
  bias: Bias;
  confidence: number;
  regime: string;
  risk: string;
  summary: string;
  consensus: {
    finalBias: Bias;
    finalConfidence: number;
    agreementScore: number;
    invalidation: string;
    timeframe?: string;
  };
  dependency: {
    confirmationScore: number;
    conflictScore: number;
    adjustment: number;
    summary: string;
  };
};

type Dashboard = {
  title: string;
  updatedAt: string;
  markets: DashboardMarket[];
  watchlist: DashboardMarket[];
  strongestBullish: DashboardMarket[];
  strongestBearish: DashboardMarket[];
  conflicts: DashboardMarket[];
  events: Array<{ id: string; time: string; title: string; importance: string; affected: string[] }>;
  alerts: Array<{ id: string; market: string; severity: string; message: string }>;
  reports: Array<{ id: string; title: string; cadence: string; summary: string }>;
  plans: Array<{ id: string; name: string; price: string; agents: number; markets: number; features: string[] }>;
};

type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

type CatalogItem = {
  id: string;
  agentId: string;
  agentName: string;
  task: string;
  displayName: string;
  description: string;
  creditCost: string;
};

type OpportunityRow = TradeRecommendation & {
  readinessScore: number;
  strategyMatches: string[];
  volatilityRegime: "Low" | "Normal" | "High";
  liquidityQuality: "Thin" | "Normal" | "Deep";
  action: "Trade setup" | "Watch" | "Avoid";
  reason: string;
};

type TradeTicket = {
  symbol: string;
  label: string;
  side: "Buy" | "Sell";
  timeframe: string;
  entry: string;
  stop: string;
  targetOne: string;
  targetTwo: string;
  riskReward: string;
  positionRisk: string;
  invalidation: string;
};

type StrategyPerformanceRow = {
  name: string;
  bestFor: string;
  winRate: string;
  expectancy: string;
  drawdown: string;
  signalQuality: string;
};

const implementationPhases = [
  {
    phase: "Phase 1",
    status: "Live on dashboard",
    title: "Decision Scanner",
    items: ["Opportunity ranking", "asset comparison matrix", "trade ticket preview", "strategy performance table"],
  },
  {
    phase: "Phase 2",
    status: "Next",
    title: "News And Timing Risk",
    items: ["economic calendar", "session overlap", "event warnings", "avoid-trade windows"],
  },
  {
    phase: "Phase 3",
    status: "Queued",
    title: "Portfolio Exposure",
    items: ["currency exposure map", "correlation clusters", "duplicate-bet warnings", "watchlist alerts"],
  },
  {
    phase: "Phase 4",
    status: "Queued",
    title: "Live Execution Readiness",
    items: ["broker spread checks", "liquidity quality", "sizing from account risk", "post-trade review loop"],
  },
];

const strategyPerformanceRows: StrategyPerformanceRow[] = [
  {
    name: "Trend-Momentum Continuation",
    bestFor: "Clean directional markets",
    winRate: "54-62%",
    expectancy: "+0.28R",
    drawdown: "Medium",
    signalQuality: "Strong when ADX and moving averages agree",
  },
  {
    name: "Squeeze Breakout Confirmation",
    bestFor: "Low volatility before expansion",
    winRate: "45-55%",
    expectancy: "+0.34R",
    drawdown: "Medium-high",
    signalQuality: "Needs volume or MACD confirmation",
  },
  {
    name: "Mean-Reversion Exhaustion",
    bestFor: "Range-bound oversold/overbought markets",
    winRate: "58-66%",
    expectancy: "+0.18R",
    drawdown: "Low-medium",
    signalQuality: "Avoid during strong trend days",
  },
  {
    name: "Pattern Breakout With Trend Filter",
    bestFor: "Flags, triangles, continuation ranges",
    winRate: "48-58%",
    expectancy: "+0.31R",
    drawdown: "Medium",
    signalQuality: "Best after compression and trend alignment",
  },
];

const fallbackDashboard: Dashboard = {
  title: "Multi-agent market intelligence for forex, crypto, stocks, gold, and oil",
  updatedAt: new Date(0).toISOString(),
  markets: [],
  watchlist: [],
  strongestBullish: [],
  strongestBearish: [],
  conflicts: [],
  events: [],
  alerts: [],
  reports: [],
  plans: [],
};

async function getJson<T>(path: string, fallback: T): Promise<T> {
  const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const response = await fetch(`${apiUrl}${path}`, { cache: "no-store" });
    if (!response.ok) {
      return fallback;
    }
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export default async function Home() {
  const [dashboard, catalog] = await Promise.all([
    getJson<Dashboard>("/dashboard", fallbackDashboard),
    getJson<CatalogItem[]>("/catalog", []),
  ]);

  const forexMarkets = dashboard.markets.filter((market) =>
    ["forex", "metal", "energy", "index"].includes(market.assetClass),
  );
  const cryptoMarkets = dashboard.markets.filter((market) => market.assetClass === "crypto");
  const stockMarkets = dashboard.markets.filter((market) => market.assetClass === "equity");
  const tradeRecommendations = buildTradeRecommendations(dashboard.markets);
  const primaryRecommendation = tradeRecommendations[0];
  const secondaryRecommendations = tradeRecommendations.slice(1, 4);
  const highRiskCount = dashboard.markets.filter((market) => market.risk === "high-risk").length;
  const conflictCount = dashboard.conflicts.length;
  const initialLiveSymbols = getInitialLiveSymbols(dashboard, tradeRecommendations);
  const initialCandlesBySymbol = Object.fromEntries(
    await Promise.all(
      initialLiveSymbols.map(async (symbol) => [
        symbol,
        await getJson<Candle[]>(`/markets/${encodeURIComponent(symbol)}/candles`, []),
      ] as const),
    ),
  );

  return (
    <main className="shell intelligenceShell" id="main-content">
      <TopNav />

      <LiveHomeDashboard initialDashboard={dashboard} initialCandlesBySymbol={initialCandlesBySymbol} />

      <BeginnerSnapshot
        primary={primaryRecommendation}
        marketCount={dashboard.markets.length}
        conflictCount={conflictCount}
        highRiskCount={highRiskCount}
      />

      <TraderDecisionPanel
        primary={primaryRecommendation}
        primaryCandles={initialCandlesBySymbol[primaryRecommendation?.symbol ?? ""] ?? []}
        secondary={secondaryRecommendations}
        secondaryCandles={Object.fromEntries(
          secondaryRecommendations.map((rec) => [rec.symbol, initialCandlesBySymbol[rec.symbol] ?? []])
        )}
        watchlist={dashboard.watchlist}
        alerts={dashboard.alerts.slice(0, 2)}
        events={dashboard.events.slice(0, 2)}
        reports={dashboard.reports.slice(0, 2)}
        marketCount={dashboard.markets.length}
        conflictCount={conflictCount}
        highRiskCount={highRiskCount}
      />

      <DashboardSectionHub
        marketCounts={{
          forex: forexMarkets.length,
          crypto: cryptoMarkets.length,
          stocks: stockMarkets.length,
        }}
        watchlistCount={dashboard.watchlist.length}
        eventCount={dashboard.events.length}
        alertCount={dashboard.alerts.length}
        reportCount={dashboard.reports.length}
        catalogCount={catalog.length}
      />
    </main>
  );
}

function BeginnerSnapshot({
  primary,
  marketCount,
  conflictCount,
  highRiskCount,
}: {
  primary?: TradeRecommendation;
  marketCount: number;
  conflictCount: number;
  highRiskCount: number;
}) {
  const move = primary?.move ?? "Watch";
  const confidence = primary ? formatPercent(primary.recommendationScore) : "n/a";
  const riskLine = highRiskCount > 0
    ? `${highRiskCount} risky market${highRiskCount === 1 ? "" : "s"} flagged`
    : "No high-risk markets flagged";

  return (
    <section className="beginnerSnapshot" aria-label="Beginner friendly market summary">
      <div className="beginnerHeroCopy">
        <span>Simple View</span>
        <h1>Today’s easiest read</h1>
        <p>
          A calmer dashboard that explains the next move in plain English. Use Technical when you want the full trading desk back.
        </p>
      </div>
      <div className={`beginnerActionCard move-${move.toLowerCase()}`}>
        <span>Top idea</span>
        <strong>{primary ? `${move} ${primary.label}` : "No clear move yet"}</strong>
        <small>{primary ? primary.summary : "Waiting for agent agreement across markets."}</small>
      </div>
      <div className="beginnerSteps">
        <div>
          <span>1</span>
          <strong>Check direction</strong>
          <small>{confidence} confidence from the agents</small>
        </div>
        <div>
          <span>2</span>
          <strong>Check risk</strong>
          <small>{riskLine}</small>
        </div>
        <div>
          <span>3</span>
          <strong>Open details</strong>
          <small>{conflictCount} conflict{conflictCount === 1 ? "" : "s"} across {marketCount} markets</small>
        </div>
      </div>
    </section>
  );
}

function DashboardSectionHub({
  marketCounts,
  watchlistCount,
  eventCount,
  alertCount,
  reportCount,
  catalogCount,
}: {
  marketCounts: { forex: number; crypto: number; stocks: number };
  watchlistCount: number;
  eventCount: number;
  alertCount: number;
  reportCount: number;
  catalogCount: number;
}) {
  const sections = [
    {
      href: "/decision-support",
      eyebrow: "Decision Support",
      title: "Scanner, Tickets, Risk",
      summary: "Opportunity ranking, trade tickets, strategy comparisons, news windows, and exposure warnings.",
      meta: `${watchlistCount} watched markets`,
    },
    {
      href: "/forex",
      eyebrow: "Markets",
      title: "Forex And Macro",
      summary: "Currencies, gold, oil, dollar drivers, macro event sensitivity, and cross-market dependencies.",
      meta: `${marketCounts.forex} markets`,
    },
    {
      href: "/crypto",
      eyebrow: "Markets",
      title: "Crypto",
      summary: "BTC beta, liquidity, on-chain confirmation, risk sentiment, and relative rotation.",
      meta: `${marketCounts.crypto} markets`,
    },
    {
      href: "/stocks",
      eyebrow: "Markets",
      title: "Stocks",
      summary: "Equity beta, rates, volatility, sector leadership, and single-name momentum.",
      meta: `${marketCounts.stocks} markets`,
    },
    {
      href: "/strategies",
      eyebrow: "Strategy",
      title: "Playbook",
      summary: "Indicator formulas, chart patterns, combined setups, visual explanations, and example outputs.",
      meta: "Strategy library",
    },
    {
      href: "/run",
      eyebrow: "Analysis",
      title: "Run Analysis",
      summary: "Guided agent workbench with dropdowns, strategy inputs, indicator selections, and advanced JSON.",
      meta: `${catalogCount} agent tasks`,
    },
    {
      href: "/reports",
      eyebrow: "Reports",
      title: "Research Summaries",
      summary: "Market reports, sweep results, and strategy comparison summaries grouped away from the dashboard.",
      meta: `${reportCount} reports`,
    },
    {
      href: "/alerts",
      eyebrow: "Operations",
      title: "Alerts",
      summary: "Watchlist triggers, event warnings, and risk state changes that need attention.",
      meta: `${alertCount} alerts · ${eventCount} events`,
    },
    {
      href: "/tutorial",
      eyebrow: "Help",
      title: "Tutorial",
      summary: "A screenshot-based walkthrough for the dashboard, decision-support phases, and analysis workbench.",
      meta: "Step-by-step guide",
    },
    {
      href: "/faq",
      eyebrow: "Help",
      title: "FAQ",
      summary: "Plain-language answers about agents, credits, decision support, event analysis, and safety limits.",
      meta: "Common questions",
    },
  ];

  return (
    <section className="dashboardSectionHub">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Dashboard Pages</p>
          <h2>Grouped Trading Workspaces</h2>
        </div>
        <span className="quiet">Open one focused page at a time</span>
      </div>
      <div className="dashboardSectionGrid">
        {sections.map((section) => (
          <a className="dashboardSectionCard" href={section.href} key={section.href}>
            <span>{section.eyebrow}</span>
            <strong>{section.title}</strong>
            <p>{section.summary}</p>
            <small>{section.meta}</small>
          </a>
        ))}
      </div>
    </section>
  );
}

function MarketUniverseSection({
  title,
  eyebrow,
  description,
  markets,
}: {
  title: string;
  eyebrow: string;
  description: string;
  markets: DashboardMarket[];
}) {
  return (
    <section className="universeSection">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <span className="quiet">{markets.length} markets</span>
      </div>
      <p className="universeCopy">{description}</p>
      <div className="marketGrid compactMarketGrid">
        {markets.map((market) => (
          <MarketCard key={market.symbol} market={market} />
        ))}
      </div>
    </section>
  );
}

function DecisionSupportRoadmap({
  opportunities,
  tickets,
  events,
}: {
  opportunities: OpportunityRow[];
  tickets: TradeTicket[];
  events: Dashboard["events"];
}) {
  return (
    <section className="decisionSupport">
      <div className="sectionHeader decisionSupportHeader">
        <div>
          <p className="eyebrow">Decision support phases</p>
          <h2>Trade-Useful Market Intelligence</h2>
        </div>
        <a className="backLink" href="/run">Run analysis</a>
      </div>

      <div className="phaseRoadmap">
        {implementationPhases.map((phase) => (
          <article className={`phaseCard ${phase.status === "Live on dashboard" ? "phaseLive" : ""}`} key={phase.phase}>
            <div>
              <span>{phase.phase}</span>
              <strong>{phase.status}</strong>
            </div>
            <h3>{phase.title}</h3>
            <ul>
              {phase.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="decisionGrid">
        <section className="decisionPanel wideDecisionPanel">
          <div className="decisionPanelTop">
            <div>
              <span>Phase 1</span>
              <h3>Market Opportunity Scanner</h3>
            </div>
            <strong>{opportunities.length} ranked</strong>
          </div>
          <div className="opportunityTable">
            <div className="opportunityRow opportunityHead">
              <span>Market</span>
              <span>Trend</span>
              <span>Volatility</span>
              <span>Strategies</span>
              <span>Readiness</span>
              <span>Action</span>
            </div>
            {opportunities.slice(0, 6).map((market) => (
              <a className="opportunityRow" href={`/markets/${market.symbol}`} key={market.symbol}>
                <strong>{market.label}</strong>
                <span className={`biasText-${market.consensus.finalBias}`}>{market.consensus.finalBias}</span>
                <span>{market.volatilityRegime}</span>
                <span>{market.strategyMatches.length}</span>
                <span>{formatPercent(market.readinessScore)}</span>
                <span>{market.action}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="decisionPanel">
          <div className="decisionPanelTop">
            <div>
              <span>Trade Ticket</span>
              <h3>Entry, Stop, Targets</h3>
            </div>
          </div>
          <div className="ticketStack">
            {tickets.map((ticket) => (
              <article className={`ticketCard ticket-${ticket.side.toLowerCase()}`} key={ticket.symbol}>
                <div>
                  <span>{ticket.side}</span>
                  <strong>{ticket.label}</strong>
                  <small>{ticket.timeframe}</small>
                </div>
                <dl>
                  <div>
                    <dt>Entry</dt>
                    <dd>{ticket.entry}</dd>
                  </div>
                  <div>
                    <dt>Stop</dt>
                    <dd>{ticket.stop}</dd>
                  </div>
                  <div>
                    <dt>Targets</dt>
                    <dd>{ticket.targetOne} / {ticket.targetTwo}</dd>
                  </div>
                  <div>
                    <dt>R/R</dt>
                    <dd>{ticket.riskReward}</dd>
                  </div>
                </dl>
                <small>{ticket.positionRisk} · {ticket.invalidation}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="decisionPanel">
          <div className="decisionPanelTop">
            <div>
              <span>Comparison</span>
              <h3>Strategy Performance</h3>
            </div>
          </div>
          <div className="strategyCompareList">
            {strategyPerformanceRows.map((strategy) => (
              <article key={strategy.name}>
                <div>
                  <strong>{strategy.name}</strong>
                  <small>{strategy.bestFor}</small>
                </div>
                <div className="strategyStats">
                  <span>{strategy.winRate}</span>
                  <span>{strategy.expectancy}</span>
                  <span>{strategy.drawdown}</span>
                </div>
                <p>{strategy.signalQuality}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="decisionPanel">
          <div className="decisionPanelTop">
            <div>
              <span>News Risk</span>
              <h3>Next Event Windows</h3>
            </div>
          </div>
          <div className="eventList">
            {events.slice(0, 4).map((event) => (
              <div className="eventItem" key={event.id}>
                <span>{event.time} · {event.importance}</span>
                <strong>{event.title}</strong>
                <small>{event.affected.join(", ")} · Check spread and volatility before new entries.</small>
              </div>
            ))}
            {events.length === 0 ? <p className="quietResult">No scheduled events in the current dashboard feed.</p> : null}
          </div>
        </section>

        <section className="decisionPanel">
          <div className="decisionPanelTop">
            <div>
              <span>Exposure</span>
              <h3>Correlation Watch</h3>
            </div>
          </div>
          <div className="exposureGrid">
            {buildExposureRows(opportunities).map((row) => (
              <div className="exposureItem" key={row.label}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
                <small>{row.note}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

type TradeRecommendation = DashboardMarket & {
  recommendationScore: number;
  move: "Buy" | "Sell";
};

function TraderDecisionPanel({
  primary,
  primaryCandles,
  secondary,
  secondaryCandles,
  watchlist,
  alerts,
  events,
  reports,
  marketCount,
  conflictCount,
  highRiskCount,
}: {
  primary?: TradeRecommendation;
  primaryCandles: Candle[];
  secondary: TradeRecommendation[];
  secondaryCandles: Record<string, Candle[]>;
  watchlist: DashboardMarket[];
  alerts: Dashboard["alerts"];
  events: Dashboard["events"];
  reports: Dashboard["reports"];
  marketCount: number;
  conflictCount: number;
  highRiskCount: number;
}) {
  const chartEntries = [
    ...(primary ? [{ recommendation: primary, candles: primaryCandles }] : []),
    ...secondary.map((rec) => ({ recommendation: rec, candles: secondaryCandles[rec.symbol] ?? [] })),
  ];

  return (
    <section className="terminalHero">
      <aside className="terminalRail">
        <div className="terminalPanelTitle">
          <span>Market Tape</span>
          <strong>{marketCount}</strong>
        </div>
        <div className="tapeSummary">
          <strong>{watchlist.length}</strong>
          <span>active watchlist names ordered by agent priority</span>
        </div>
        <div className="terminalWatchlist">
          {watchlist.slice(0, 8).map((market) => (
            <a href={`/markets/${market.symbol}`} className="terminalWatchItem" key={market.symbol}>
              <span>{market.label}</span>
              <small>{market.assetClass}</small>
              <strong className={market.changePct >= 0 ? "positive" : "negative"}>{formatSignedPercent(market.changePct)}</strong>
            </a>
          ))}
        </div>
      </aside>

      <TerminalChartPanel entries={chartEntries} />

      <aside className="terminalIntelPanel">
        <div className="terminalPanelTitle">
          <span>Live Briefing</span>
          <BrowserClock />
        </div>
        <div className="decisionMetrics compactDecisionMetrics">
          <MetricTile label="Conflicts" value={String(conflictCount)} />
          <MetricTile label="High Risk" value={String(highRiskCount)} />
          <MetricTile label="Score" value={primary ? formatPercent(primary.recommendationScore) : "n/a"} />
          <MetricTile label="Markets" value={String(marketCount)} />
        </div>

        <div className="tradeListBlock">
          <span>Agent Suggestions</span>
          <div className="tradeList">
            {secondary.map((market) => (
              <a href={`/markets/${market.symbol}`} className="tradeListItem" key={market.symbol}>
                <strong>{market.move} {market.label}</strong>
                <small>{formatPercent(market.recommendationScore)} score · {formatPercent(market.dependency.conflictScore)} conflict</small>
              </a>
            ))}
          </div>
        </div>

        <div className="tradeListBlock">
          <span>News & Intelligence</span>
          <div className="tradeList">
            {[
              ...alerts.map((alert) => alert.message),
              ...events.map((event) => `${event.time}: ${event.title}`),
              ...reports.map((report) => report.summary),
            ].slice(0, 5).map((item) => (
              <div className="tradeListItem" key={item}>
                <small>{item}</small>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}

function SignalPill({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`signalPill ${danger ? "dangerSignal" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TradeHeroChart({ candles, positive }: { candles: Candle[]; positive: boolean }) {
  if (candles.length < 2) {
    return <div className="terminalChartEmpty">Waiting for candles</div>;
  }

  const closes = candles.map((candle) => candle.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const points = closes
    .map((close, index) => {
      const x = (index / (closes.length - 1)) * 100;
      const y = 90 - ((close - min) / range) * 78;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg className={`terminalHeroChart ${positive ? "positiveLine" : "negativeLine"}`} viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Primary recommendation price chart">
      {[20, 40, 60, 80].map((y) => (
        <line x1="0" x2="100" y1={y} y2={y} key={y} />
      ))}
      <polyline points={points} />
    </svg>
  );
}

function MarketCard({ market }: { market: DashboardMarket }) {
  return (
    <article className={`marketCard bias-${market.consensus.finalBias}`}>
      <div className="marketTop">
        <div>
          <span>{market.assetClass}</span>
          <h3>{market.label}</h3>
        </div>
        <a href={`/markets/${market.symbol}`}>Open</a>
      </div>
      <div className="marketPrice">
        <strong>{formatPrice(market.price)}</strong>
        <span className={market.changePct >= 0 ? "positive" : "negative"}>{formatPercent(market.changePct / 100)}</span>
      </div>
      <p>{market.summary}</p>
      <div className="miniBars">
        <BarLine label="Confidence" value={market.consensus.finalConfidence} />
        <BarLine label="Agreement" value={market.consensus.agreementScore} />
        <BarLine label="Conflict" value={market.dependency.conflictScore} danger />
      </div>
    </article>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panelBlock">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function StackedMarkets({ markets, conflict = false }: { markets: DashboardMarket[]; conflict?: boolean }) {
  if (markets.length === 0) {
    return <p className="quietResult">No markets match this view right now.</p>;
  }
  return (
    <div className="stackList">
      {markets.map((market) => (
        <a href={`/markets/${market.symbol}`} className="stackItem" key={market.symbol}>
          <span>{market.label}</span>
          <strong>{conflict ? formatPercent(market.dependency.conflictScore) : formatPercent(market.consensus.finalConfidence)}</strong>
        </a>
      ))}
    </div>
  );
}

function getInitialLiveSymbols(dashboard: Dashboard, opportunities: TradeRecommendation[]) {
  const prioritizedSymbols: string[] = [
    ...opportunities.slice(0, 4).map((market) => market.symbol),
    ...dashboard.watchlist.map((market) => market.symbol),
    ...opportunities.map((market) => market.symbol),
  ];

  const dashboardSymbols = new Set(dashboard.markets.map((market) => market.symbol));
  const symbols: string[] = [];

  for (const symbol of prioritizedSymbols) {
    if (!symbols.includes(symbol) && dashboardSymbols.has(symbol) && symbols.length < 8) {
      symbols.push(symbol);
    }
  }

  return symbols;
}

function buildTradeRecommendations(markets: DashboardMarket[]): TradeRecommendation[] {
  return markets
    .filter((market) => market.consensus.finalBias !== "neutral")
    .map((market) => ({
      ...market,
      move: market.consensus.finalBias === "bullish" ? ("Buy" as const) : ("Sell" as const),
      recommendationScore:
        market.consensus.finalConfidence * 0.62 +
        market.consensus.agreementScore * 0.26 +
        market.dependency.confirmationScore * 0.16 -
        market.dependency.conflictScore * 0.14,
    }))
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
}

function buildOpportunityRows(markets: DashboardMarket[]): OpportunityRow[] {
  return buildTradeRecommendations(markets)
    .map((market) => {
      const volatilityRegime = getVolatilityRegime(market);
      const liquidityQuality = getLiquidityQuality(market);
      const strategyMatches = getStrategyMatches(market, volatilityRegime);
      const readinessScore = clamp01(
        market.recommendationScore * 0.58 +
          market.consensus.agreementScore * 0.18 +
          strategyMatches.length * 0.035 -
          (market.risk === "high-risk" ? 0.18 : 0) -
          (liquidityQuality === "Thin" ? 0.08 : 0),
      );
      const action: OpportunityRow["action"] = readinessScore >= 0.68 && market.risk !== "high-risk"
        ? "Trade setup"
        : readinessScore >= 0.52
          ? "Watch"
          : "Avoid";

      return {
        ...market,
        readinessScore,
        strategyMatches,
        volatilityRegime,
        liquidityQuality,
        action,
        reason: `${strategyMatches[0] ?? "Directional bias"} with ${formatPercent(market.consensus.agreementScore)} agent agreement.`,
      };
    })
    .sort((a, b) => b.readinessScore - a.readinessScore);
}

function buildTradeTickets(opportunities: OpportunityRow[]): TradeTicket[] {
  return opportunities
    .filter((market) => market.action !== "Avoid")
    .slice(0, 3)
    .map((market) => {
      const isBuy = market.move === "Buy";
      const riskDistance = getRiskDistance(market);
      const entryLow = isBuy ? market.price - riskDistance * 0.35 : market.price + riskDistance * 0.35;
      const entryHigh = isBuy ? market.price + riskDistance * 0.15 : market.price - riskDistance * 0.15;
      const stop = isBuy ? market.price - riskDistance : market.price + riskDistance;
      const targetOne = isBuy ? market.price + riskDistance * 1.5 : market.price - riskDistance * 1.5;
      const targetTwo = isBuy ? market.price + riskDistance * 2.4 : market.price - riskDistance * 2.4;

      return {
        symbol: market.symbol,
        label: market.label,
        side: market.move,
        entry: `${formatPrice(Math.min(entryLow, entryHigh))}-${formatPrice(Math.max(entryLow, entryHigh))}`,
        stop: formatPrice(stop),
        timeframe: market.consensus.timeframe ?? "1H",
        targetOne: formatPrice(targetOne),
        targetTwo: formatPrice(targetTwo),
        riskReward: "1.5R / 2.4R",
        positionRisk: market.risk === "high-risk" ? "Max 0.25% risk" : "Max 0.5% risk",
        invalidation: market.consensus.invalidation || "Invalid if agent bias flips",
      };
    });
}

function buildExposureRows(opportunities: OpportunityRow[]) {
  const top = opportunities.slice(0, 6);
  const usdTrades = top.filter((market) => market.label.includes("USD")).length;
  const cryptoTrades = top.filter((market) => market.assetClass === "crypto").length;
  const riskOffTrades = top.filter((market) => ["metal", "index"].includes(market.assetClass)).length;
  const highConflict = top.filter((market) => market.dependency.conflictScore >= 0.25).length;

  return [
    {
      label: "USD exposure",
      value: `${usdTrades} setups`,
      note: usdTrades > 1 ? "Avoid stacking the same dollar view without reducing size." : "No major concentration in the top list.",
    },
    {
      label: "Crypto beta",
      value: `${cryptoTrades} setups`,
      note: cryptoTrades > 1 ? "BTC and ETH signals can behave like one risk trade." : "Crypto exposure is contained.",
    },
    {
      label: "Macro hedge",
      value: `${riskOffTrades} markets`,
      note: "Compare gold, oil, and index signals before adding directional FX risk.",
    },
    {
      label: "Conflict load",
      value: `${highConflict} warnings`,
      note: highConflict > 0 ? "Prefer smaller sizing or wait for confirmation." : "Top ideas have clean cross-market agreement.",
    },
  ];
}

function getStrategyMatches(market: DashboardMarket, volatilityRegime: OpportunityRow["volatilityRegime"]) {
  const matches: string[] = [];
  if (market.consensus.finalConfidence >= 0.62 && market.dependency.confirmationScore >= 0.5) {
    matches.push("Trend momentum");
  }
  if (volatilityRegime === "Low" && market.consensus.agreementScore >= 0.55) {
    matches.push("Squeeze breakout");
  }
  if (volatilityRegime === "High" && market.dependency.conflictScore <= 0.18) {
    matches.push("Volatility continuation");
  }
  if (market.dependency.conflictScore >= 0.18 && market.consensus.agreementScore >= 0.5) {
    matches.push("Reversal watch");
  }
  if (market.risk !== "high-risk" && market.consensus.finalConfidence >= 0.55) {
    matches.push("Risk-approved candidate");
  }
  return matches;
}

function getVolatilityRegime(market: DashboardMarket): OpportunityRow["volatilityRegime"] {
  const absoluteMove = Math.abs(market.changePct);
  if (absoluteMove >= 2.2 || market.regime.toLowerCase().includes("volatile")) {
    return "High";
  }
  if (absoluteMove <= 0.35 || market.regime.toLowerCase().includes("range")) {
    return "Low";
  }
  return "Normal";
}

function getLiquidityQuality(market: DashboardMarket): OpportunityRow["liquidityQuality"] {
  if (market.assetClass === "forex" || market.assetClass === "index") {
    return "Deep";
  }
  if (market.risk === "high-risk") {
    return "Thin";
  }
  return "Normal";
}

function getRiskDistance(market: OpportunityRow) {
  const basis = Math.max(market.price * (market.volatilityRegime === "High" ? 0.018 : market.volatilityRegime === "Low" ? 0.006 : 0.011), 0.0001);
  return basis;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}


function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="metricTile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BarLine({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="barLine">
      <div>
        <span>{label}</span>
        <strong>{formatPercent(value)}</strong>
      </div>
      <i style={{ "--bar-width": `${Math.max(4, Math.min(100, value * 100))}%` } as CSSProperties} className={danger ? "dangerBar" : ""} />
    </div>
  );
}

function EmptyApi() {
  return (
    <div className="empty">
      <h2>API not connected</h2>
      <p>Start the NestJS API on port 4000 or run the local tmux stack.</p>
    </div>
  );
}

function formatPrice(value: number) {
  return value > 50 ? value.toFixed(2) : value.toFixed(4);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatSignedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
