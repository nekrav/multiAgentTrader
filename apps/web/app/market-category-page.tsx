import type { CSSProperties, ReactNode } from "react";
import { TopNav } from "./top-nav";
import { HeroIntelMenu } from "./hero-intel-menu";
import { getPriceReference } from "./lib/pricing-references";

type Bias = "bullish" | "bearish" | "neutral";

export type DashboardMarket = {
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
  };
  dependency: {
    confirmationScore: number;
    conflictScore: number;
    adjustment: number;
    summary: string;
    relatedMarkets?: Array<{
      market: string;
      relationship: string;
      currentEffect: string;
      strength: number;
    }>;
  };
};

export type Dashboard = {
  markets: DashboardMarket[];
  updatedAt: string;
  events: MarketEvent[];
  alerts: MarketAlert[];
  reports: MarketReport[];
};

export type MarketEvent = {
  id: string;
  time: string;
  title: string;
  importance: string;
  affected: string[];
};

export type MarketAlert = {
  id: string;
  market: string;
  severity: string;
  message: string;
  createdAt?: string;
};

export type MarketReport = {
  id: string;
  title: string;
  cadence: string;
  markets: string[];
  summary: string;
  createdAt?: string;
};

export async function getDashboard(): Promise<Dashboard> {
  const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const response = await fetch(`${apiUrl}/dashboard`, { cache: "no-store" });
    if (!response.ok) {
      return emptyDashboard();
    }
    return (await response.json()) as Dashboard;
  } catch {
    return emptyDashboard();
  }
}

function emptyDashboard(): Dashboard {
  return { markets: [], updatedAt: "", events: [], alerts: [], reports: [] };
}

export async function MarketCategoryPage({
  title,
  include,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  include: (market: DashboardMarket) => boolean;
  children?: ReactNode;
}) {
  const dashboard = await getDashboard();
  const markets = dashboard.markets.filter(include);
  const symbols = markets.map((market) => market.symbol);
  const strongest = [...markets].sort((a, b) => b.consensus.finalConfidence - a.consensus.finalConfidence).slice(0, 3);
  const conflicts = markets.filter((market) => market.dependency.conflictScore >= 0.2);
  const { topNews, latestNews } = getNewsForSymbols(dashboard, symbols);
  const topTrades = getTopTrades(markets);

  return (
    <main className="shell intelligenceShell">
      <TopNav />
      <section className="categoryHero">
        <div className="categoryHeroTop">
          <h1>{title}</h1>
          <div className="heroStats">
            <Metric label="Markets" value={String(markets.length)} />
            <Metric label="Strongest" value={strongest[0]?.label ?? "n/a"} />
            <Metric label="Conflicts" value={String(conflicts.length)} />
          </div>
        </div>
        <HeroIntelMenu topNews={topNews} latestNews={latestNews} topTrades={topTrades} />
      </section>

      <section className="marketGrid">
        {markets.map((market) => (
          <CategoryMarketCard market={market} key={market.symbol} />
        ))}
      </section>

      <section className="dashboardColumns">
        <Panel title="Highest Confidence">
          <StackList markets={strongest} value="confidence" />
        </Panel>
        <Panel title="Dependency Conflicts">
          <StackList markets={conflicts} value="conflict" />
        </Panel>
      </section>
      {children}
    </main>
  );
}

function CategoryMarketCard({ market }: { market: DashboardMarket }) {
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
        <a
          href={getPriceReference(market.symbol).referenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="secondaryButton sourceReferenceButton"
        >
          Source
        </a>
      </div>
      <p>{market.summary}</p>
      <div className="miniBars">
        <Bar label="Confidence" value={market.consensus.finalConfidence} />
        <Bar label="Agreement" value={market.consensus.agreementScore} />
        <Bar label="Conflict" value={market.dependency.conflictScore} danger />
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

function StackList({ markets, value }: { markets: DashboardMarket[]; value: "confidence" | "conflict" }) {
  if (markets.length === 0) {
    return <p className="quietResult">No markets in this list.</p>;
  }
  return (
    <div className="stackList">
      {markets.map((market) => (
        <a href={`/markets/${market.symbol}`} className="stackItem" key={market.symbol}>
          <span>{market.label}</span>
          <strong>
            {formatPercent(value === "confidence" ? market.consensus.finalConfidence : market.dependency.conflictScore)}
          </strong>
        </a>
      ))}
    </div>
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

function Bar({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
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

export type NewsItem = {
  id: string;
  kicker: string;
  title: string;
  summary: string;
  tone: "high" | "medium" | "info";
  href?: string;
};

export type TradeSignal = {
  id: string;
  label: string;
  move: "Buy" | "Sell" | "Watch";
  confidence: number;
  summary: string;
  tone: "buy" | "sell" | "watch";
  href: string;
};

export function getTopTrades(markets: DashboardMarket[]): TradeSignal[] {
  return [...markets]
    .sort((a, b) => b.consensus.finalConfidence - a.consensus.finalConfidence)
    .slice(0, 5)
    .map((market) => {
      const isBullish = market.consensus.finalBias === "bullish";
      const isBearish = market.consensus.finalBias === "bearish";

      return {
        id: `trade-${market.symbol}`,
        label: market.label,
        move: isBullish ? "Buy" : isBearish ? "Sell" : "Watch",
        confidence: market.consensus.finalConfidence,
        summary: market.summary,
        tone: isBullish ? "buy" : isBearish ? "sell" : "watch",
        href: `/markets/${market.symbol}`,
      };
    });
}

export function getNewsForSymbols(dashboard: Dashboard, symbols: string[]) {
  const symbolSet = new Set(symbols);
  const matches = (items: string[]) => items.some((item) => symbolSet.has(item));
  const marketLabel = (symbol: string) => dashboard.markets.find((market) => market.symbol === symbol)?.label ?? symbol;

  const eventNews: NewsItem[] = dashboard.events
    .filter((event) => matches(event.affected))
    .map((event) => ({
      id: `event-${event.id}`,
      kicker: `${event.time} · ${event.importance}`,
      title: event.title,
      summary: event.affected.filter((symbol) => symbolSet.has(symbol)).map(marketLabel).join(", "),
      tone: event.importance === "high" ? "high" : "medium",
    }));

  const alertNews: NewsItem[] = dashboard.alerts
    .filter((alert) => symbolSet.has(alert.market))
    .map((alert) => ({
      id: `alert-${alert.id}`,
      kicker: `${marketLabel(alert.market)} · ${alert.severity}`,
      title: alert.message,
      summary: "Agent alert from the latest market intelligence run.",
      tone: alert.severity === "warning" ? "high" : "info",
    }));

  const reportNews: NewsItem[] = dashboard.reports
    .filter((report) => matches(report.markets))
    .map((report) => ({
      id: `report-${report.id}`,
      kicker: report.cadence,
      title: report.title,
      summary: report.summary,
      tone: report.cadence === "Daily" ? "medium" : "info",
      href: `/reports#${report.id}`,
    }));

  const allNews = [...eventNews, ...alertNews, ...reportNews];
  const toneRank = { high: 3, medium: 2, info: 1 } satisfies Record<NewsItem["tone"], number>;

  return {
    topNews: [...allNews].sort((a, b) => toneRank[b.tone] - toneRank[a.tone]).slice(0, 4),
    latestNews: allNews.slice(0, 5),
  };
}

function formatPrice(value: number) {
  return value > 50 ? value.toFixed(2) : value.toFixed(4);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
