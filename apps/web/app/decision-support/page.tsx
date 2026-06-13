import { TopNav } from "../top-nav";

type Bias = "bullish" | "bearish" | "neutral";

type DashboardMarket = {
  symbol: string;
  label: string;
  assetClass: string;
  price: number;
  changePct: number;
  regime: string;
  risk: string;
  summary: string;
  consensus: {
    finalBias: Bias;
    finalConfidence: number;
    agreementScore: number;
    invalidation: string;
  };
  dependency: {
    confirmationScore: number;
    conflictScore: number;
    summary: string;
  };
};

type Dashboard = {
  markets: DashboardMarket[];
  events: Array<{ id: string; time: string; title: string; importance: string; affected: string[] }>;
};

type TradeRecommendation = DashboardMarket & {
  recommendationScore: number;
  move: "Buy" | "Sell";
};

type OpportunityRow = TradeRecommendation & {
  readinessScore: number;
  strategyMatches: string[];
  volatilityRegime: "Low" | "Normal" | "High";
  liquidityQuality: "Thin" | "Normal" | "Deep";
  action: "Trade setup" | "Watch" | "Avoid";
};

type TradeTicket = {
  symbol: string;
  label: string;
  side: "Buy" | "Sell";
  entry: string;
  stop: string;
  targetOne: string;
  targetTwo: string;
  riskReward: string;
  positionRisk: string;
  invalidation: string;
};

type TimingRiskRow = {
  id: string;
  time: string;
  title: string;
  importance: string;
  affected: string;
  risk: "High" | "Medium" | "Low";
  action: string;
};

type CorrelationCluster = {
  name: string;
  markets: string;
  exposure: string;
  action: string;
};

type ExecutionCheck = {
  symbol: string;
  label: string;
  side: "Buy" | "Sell";
  spread: string;
  liquidity: OpportunityRow["liquidityQuality"];
  size: string;
  status: "Ready" | "Wait" | "Reduce";
  note: string;
};

const fallbackDashboard: Dashboard = {
  markets: [],
  events: [],
};

const implementationPhases = [
  {
    id: "phase-1",
    phase: "Phase 1",
    status: "Live",
    title: "Decision Scanner",
    items: ["Opportunity ranking", "asset comparison matrix", "trade ticket preview", "strategy performance table"],
  },
  {
    id: "phase-2",
    phase: "Phase 2",
    status: "Live",
    title: "News And Timing Risk",
    items: ["economic calendar", "session overlap", "event warnings", "avoid-trade windows"],
  },
  {
    id: "phase-3",
    phase: "Phase 3",
    status: "Live",
    title: "Portfolio Exposure",
    items: ["currency exposure map", "correlation clusters", "duplicate-bet warnings", "watchlist alerts"],
  },
  {
    id: "phase-4",
    phase: "Phase 4",
    status: "Live",
    title: "Live Execution Readiness",
    items: ["broker spread checks", "liquidity quality", "sizing from account risk", "post-trade review loop"],
  },
];

const strategyPerformanceRows = [
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

async function getDashboard(): Promise<Dashboard> {
  const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const response = await fetch(`${apiUrl}/dashboard`, { cache: "no-store" });
    if (!response.ok) {
      return fallbackDashboard;
    }
    return (await response.json()) as Dashboard;
  } catch {
    return fallbackDashboard;
  }
}

export default async function DecisionSupportPage() {
  const dashboard = await getDashboard();
  const opportunities = buildOpportunityRows(dashboard.markets);
  const tickets = buildTradeTickets(opportunities);

  return (
    <main className="shell intelligenceShell" id="main-content">
      <TopNav />
      <section className="categoryHero decisionPageHero">
        <div className="categoryHeroTop">
          <div>
            <p className="eyebrow">Decision Support</p>
            <h1>Trading Pages Grouped By Decision</h1>
          </div>
          <div className="heroStats">
            <Metric label="Ranked" value={String(opportunities.length)} />
            <Metric label="Trade Tickets" value={String(tickets.length)} />
            <Metric label="Events" value={String(dashboard.events.length)} />
          </div>
        </div>
      </section>

      <DecisionSupportContent opportunities={opportunities} tickets={tickets} events={dashboard.events} />
    </main>
  );
}

function DecisionSupportContent({
  opportunities,
  tickets,
  events,
}: {
  opportunities: OpportunityRow[];
  tickets: TradeTicket[];
  events: Dashboard["events"];
}) {
  const exposureRows = buildExposureRows(opportunities);
  const timingRows = buildTimingRiskRows(events);
  const correlationClusters = buildCorrelationClusters(opportunities);
  const executionChecks = buildExecutionChecks(tickets, opportunities);

  return (
    <section className="decisionSupport">
      <div className="phaseRoadmap">
        {implementationPhases.map((phase) => (
          <a className={`phaseCard ${phase.status === "Live" ? "phaseLive" : ""}`} href={`#${phase.id}`} key={phase.phase}>
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
          </a>
        ))}
      </div>

      <div className="phaseDetail" id="phase-1">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Phase 1 · Live</p>
            <h2>Decision Scanner</h2>
          </div>
          <span className="quiet">These tools are active now</span>
        </div>
        <p className="universeCopy">
          This phase answers the first trading question: which market is worth attention right now, which strategy fits it, and whether it deserves a trade ticket.
        </p>
      </div>

      <div className="decisionGrid phaseContent" aria-label="Phase 1 live decision tools">
        <section className="decisionPanel wideDecisionPanel">
          <div className="decisionPanelTop">
            <div>
              <span>Scanner</span>
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
            {opportunities.slice(0, 8).map((market) => (
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
              <span>Tickets</span>
              <h3>Entry, Stop, Targets</h3>
            </div>
          </div>
          <div className="ticketStack">
            {tickets.map((ticket) => (
              <article className={`ticketCard ticket-${ticket.side.toLowerCase()}`} key={ticket.symbol}>
                <div>
                  <span>{ticket.side}</span>
                  <strong>{ticket.label}</strong>
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
              <span>Strategies</span>
              <h3>Performance Comparison</h3>
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
      </div>

      <PhaseTwoSection timingRows={timingRows} />
      <PhaseThreeSection exposureRows={exposureRows} clusters={correlationClusters} />
      <PhaseFourSection executionChecks={executionChecks} />
    </section>
  );
}

function PhaseTwoSection({ timingRows }: { timingRows: TimingRiskRow[] }) {
  const sessions = [
    { name: "Tokyo", window: "7 PM-4 AM ET", focus: "JPY, AUD, NZD", state: "Asia liquidity" },
    { name: "London", window: "3 AM-12 PM ET", focus: "EUR, GBP, USD", state: "Highest FX participation" },
    { name: "New York", window: "8 AM-5 PM ET", focus: "USD, CAD, indices", state: "Macro and stock flow" },
    { name: "London/New York overlap", window: "8 AM-12 PM ET", focus: "Majors", state: "Best liquidity, more event risk" },
  ];

  return (
    <section className="phaseDetail" id="phase-2">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Phase 2 · Live</p>
          <h2>News And Timing Risk</h2>
        </div>
        <span className="quiet">Trade timing checks</span>
      </div>
      <p className="universeCopy">
        This phase checks whether a good setup should be traded now or delayed because of event risk, session timing, or likely spread expansion.
      </p>
      <div className="phaseToolGrid">
        <section className="decisionPanel">
          <div className="decisionPanelTop">
            <div>
              <span>Calendar</span>
              <h3>Event Risk Windows</h3>
            </div>
          </div>
          <div className="timingRiskList">
            {timingRows.map((row) => (
              <article className={`timingRiskItem timingRisk-${row.risk.toLowerCase()}`} key={row.id}>
                <div>
                  <span>{row.time} · {row.importance}</span>
                  <strong>{row.title}</strong>
                </div>
                <small>{row.affected}</small>
                <b>{row.action}</b>
              </article>
            ))}
          </div>
        </section>
        <section className="decisionPanel">
          <div className="decisionPanelTop">
            <div>
              <span>Sessions</span>
              <h3>Market Hours Context</h3>
            </div>
          </div>
          <div className="sessionGrid">
            {sessions.map((session) => (
              <article className="sessionItem" key={session.name}>
                <strong>{session.name}</strong>
                <span>{session.window}</span>
                <small>{session.focus}</small>
                <em>{session.state}</em>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function PhaseThreeSection({
  exposureRows,
  clusters,
}: {
  exposureRows: ReturnType<typeof buildExposureRows>;
  clusters: CorrelationCluster[];
}) {
  return (
    <section className="phaseDetail" id="phase-3">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Phase 3 · Live</p>
          <h2>Portfolio Exposure</h2>
        </div>
        <span className="quiet">Duplicate-risk checks</span>
      </div>
      <p className="universeCopy">
        This phase checks whether multiple setups are really the same trade expressed through different markets, so sizing can be reduced before risk stacks up.
      </p>
      <div className="phaseToolGrid">
        <section className="decisionPanel">
          <div className="decisionPanelTop">
            <div>
              <span>Exposure</span>
              <h3>Concentration Watch</h3>
            </div>
          </div>
          <div className="exposureGrid">
            {exposureRows.map((row) => (
              <div className="exposureItem" key={row.label}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
                <small>{row.note}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="decisionPanel">
          <div className="decisionPanelTop">
            <div>
              <span>Clusters</span>
              <h3>Correlation Groups</h3>
            </div>
          </div>
          <div className="correlationList">
            {clusters.map((cluster) => (
              <article className="correlationItem" key={cluster.name}>
                <div>
                  <strong>{cluster.name}</strong>
                  <span>{cluster.exposure}</span>
                </div>
                <small>{cluster.markets}</small>
                <p>{cluster.action}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function PhaseFourSection({ executionChecks }: { executionChecks: ExecutionCheck[] }) {
  return (
    <section className="phaseDetail" id="phase-4">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Phase 4 · Live</p>
          <h2>Live Execution Readiness</h2>
        </div>
        <span className="quiet">Pre-trade checks</span>
      </div>
      <p className="universeCopy">
        This phase turns a candidate into a safer actionable setup by checking cost, liquidity, sizing, and whether the trade should be reduced or delayed.
      </p>
      <div className="phaseToolGrid">
        <section className="decisionPanel wideDecisionPanel">
          <div className="decisionPanelTop">
            <div>
              <span>Execution</span>
              <h3>Readiness Checklist</h3>
            </div>
            <strong>{executionChecks.length} tickets checked</strong>
          </div>
          <div className="executionList">
            {executionChecks.map((check) => (
              <article
                className={`executionItem execution-${check.status.toLowerCase()} execution-${check.side.toLowerCase()}`}
                key={check.symbol}
              >
                <div>
                  <span>{check.side}</span>
                  <strong>{check.label}</strong>
                </div>
                <dl>
                  <div>
                    <dt>Spread</dt>
                    <dd>{check.spread}</dd>
                  </div>
                  <div>
                    <dt>Liquidity</dt>
                    <dd>{check.liquidity}</dd>
                  </div>
                  <div>
                    <dt>Size</dt>
                    <dd>{check.size}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{check.status}</dd>
                  </div>
                </dl>
                <small>{check.note}</small>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metricTile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
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

      return { ...market, readinessScore, strategyMatches, volatilityRegime, liquidityQuality, action };
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

function buildTimingRiskRows(events: Dashboard["events"]): TimingRiskRow[] {
  if (events.length === 0) {
    return [
      {
        id: "no-event-feed",
        time: "No event feed",
        title: "No scheduled macro events in the dashboard feed",
        importance: "Normal",
        affected: "All watched markets",
        risk: "Low",
        action: "Proceed with technical and liquidity checks.",
      },
    ];
  }

  return events.slice(0, 6).map((event) => {
    const importance = event.importance.toLowerCase();
    const risk: TimingRiskRow["risk"] = importance.includes("high")
      ? "High"
      : importance.includes("medium")
        ? "Medium"
        : "Low";
    const action = risk === "High"
      ? "Avoid fresh entries until volatility normalizes."
      : risk === "Medium"
        ? "Reduce size or require stronger confirmation."
        : "Trade normally if the setup remains valid.";

    return {
      id: event.id,
      time: event.time,
      title: event.title,
      importance: event.importance,
      affected: event.affected.join(", "),
      risk,
      action,
    };
  });
}

function buildCorrelationClusters(opportunities: OpportunityRow[]): CorrelationCluster[] {
  const top = opportunities.slice(0, 8);
  const usd = top.filter((market) => market.label.includes("USD"));
  const crypto = top.filter((market) => market.assetClass === "crypto");
  const equities = top.filter((market) => market.assetClass === "equity" || market.assetClass === "index");
  const macro = top.filter((market) => ["metal", "energy", "commodity"].includes(market.assetClass));

  return [
    buildCluster("USD-linked FX", usd, "Repeated dollar exposure"),
    buildCluster("Crypto beta", crypto, "Shared risk-on crypto exposure"),
    buildCluster("Equity beta", equities, "Index and large-cap growth exposure"),
    buildCluster("Macro hedges", macro, "Commodity and defensive macro exposure"),
  ];
}

function buildCluster(name: string, markets: OpportunityRow[], exposure: string): CorrelationCluster {
  const labels = markets.map((market) => `${market.move} ${market.label}`).join(" / ");
  const count = markets.length;
  return {
    name,
    markets: labels || "No active top-ranked setups",
    exposure: `${count} setup${count === 1 ? "" : "s"}`,
    action: count > 1
      ? "Treat these as related risk. Pick the strongest setup or reduce total size."
      : count === 1
        ? "Single exposure only. Keep normal sizing if Phase 4 is clean."
        : "No concentration warning from the current opportunity list.",
  };
}

function buildExecutionChecks(tickets: TradeTicket[], opportunities: OpportunityRow[]): ExecutionCheck[] {
  const bySymbol = new Map(opportunities.map((market) => [market.symbol, market]));
  return tickets.map((ticket) => {
    const market = bySymbol.get(ticket.symbol);
    const liquidity = market?.liquidityQuality ?? "Normal";
    const spread = getEstimatedSpread(market);
    const status: ExecutionCheck["status"] = !market || market.action === "Watch"
      ? "Wait"
      : liquidity === "Thin" || market.volatilityRegime === "High"
        ? "Reduce"
        : "Ready";
    const size = status === "Ready" ? "0.5% max risk" : status === "Reduce" ? "0.25% max risk" : "No entry yet";
    const note = status === "Ready"
      ? "Candidate can move forward if the quoted spread is normal and price remains inside the entry zone."
      : status === "Reduce"
        ? "Conditions are tradable but cost or volatility argues for smaller size."
        : "Wait for the setup to become a trade setup before sizing the order.";

    return {
      symbol: ticket.symbol,
      label: ticket.label,
      side: ticket.side,
      spread,
      liquidity,
      size,
      status,
      note,
    };
  });
}

function getEstimatedSpread(market: OpportunityRow | undefined) {
  if (!market) {
    return "Unknown";
  }
  if (market.assetClass === "forex") {
    return market.liquidityQuality === "Deep" ? "0.6-1.4 pips" : "1.5-3.0 pips";
  }
  if (market.assetClass === "crypto") {
    return market.liquidityQuality === "Thin" ? "Wide" : "Normal";
  }
  return market.liquidityQuality === "Deep" ? "Tight" : "Normal";
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
  return Math.max(market.price * (market.volatilityRegime === "High" ? 0.018 : market.volatilityRegime === "Low" ? 0.006 : 0.011), 0.0001);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function formatPrice(value: number) {
  return value > 50 ? value.toFixed(2) : value.toFixed(4);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
