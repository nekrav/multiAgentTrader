import type { CSSProperties } from "react";
import { TopNav } from "../../top-nav";
import { getPriceReference } from "../../lib/pricing-references";

type MarketDetail = {
  symbol: string;
  label: string;
  assetClass: string;
  price: number;
  changePct: number;
  regime: string;
  summary: string;
  candles: Array<{ time: string; open: number; high: number; low: number; close: number }>;
  agents: Array<{
    agent: string;
    bias: "bullish" | "bearish" | "neutral";
    confidence: number;
    score: number;
    summary: string;
    keyLevels?: { support: number[]; resistance: number[] };
    invalidation?: string;
    features: Record<string, string | number | boolean>;
  }>;
  dependency: {
    confirmationScore: number;
    conflictScore: number;
    adjustment: number;
    summary: string;
    relatedMarkets: Array<{ market: string; relationship: string; currentEffect: string; strength: number }>;
  };
  consensus: {
    finalBias: "bullish" | "bearish" | "neutral";
    finalConfidence: number;
    agreementScore: number;
    summary: string;
    bullishCase: string;
    bearishCase: string;
    invalidation: string;
    whatChanged: string;
  };
  scenarios: Array<{ name: string; probability: number; summary: string }>;
  confidenceHistory: Array<{ time: string; value: number }>;
};

async function getMarket(symbol: string): Promise<MarketDetail | null> {
  const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const response = await fetch(`${apiUrl}/markets/${symbol}`, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as MarketDetail;
  } catch {
    return null;
  }
}

export default async function MarketPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const market = await getMarket(symbol);

  if (!market) {
    return (
      <main className="shell intelligenceShell">
        <TopNav />
        <a className="backLink" href="/">Back to dashboard</a>
        <section className="empty">
          <h1>Market unavailable</h1>
          <p>The API does not have seeded intelligence for {symbol}.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell intelligenceShell">
      <TopNav />
      <a className="backLink" href="/">Back to dashboard</a>
      <section className={`marketDetailHero bias-${market.consensus.finalBias}`}>
        <div>
          <p className="eyebrow">{market.assetClass}</p>
          <h1>{market.label}</h1>
          <p className="heroCopy">{market.consensus.summary}</p>
        </div>
        <div className="heroStats">
          <div className="marketPriceActions">
            <Metric label="Price" value={market.price > 50 ? market.price.toFixed(2) : market.price.toFixed(4)} />
            <a
              href={getPriceReference(market.symbol, market.label).referenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="secondaryButton sourceReferenceButton"
            >
              Open source
            </a>
          </div>
          <Metric label="Bias" value={market.consensus.finalBias} />
          <Metric label="Confidence" value={pct(market.consensus.finalConfidence)} />
        </div>

      </section>

      <section className="detailGrid">
        <article className="widePanel">
          <div className="panelTitle">
            <h2>Price Structure</h2>
            <span>{market.regime}</span>
          </div>
          <Sparkline candles={market.candles} />
        </article>
        <article className="panelBlock">
          <h3>Consensus</h3>
          <Bar label="Final confidence" value={market.consensus.finalConfidence} />
          <Bar label="Agreement" value={market.consensus.agreementScore} />
          <p>{market.consensus.whatChanged}</p>
        </article>
      </section>

      <section className="detailGrid">
        <article className="panelBlock">
          <h3>Scenario Map</h3>
          <div className="eventList">
            {market.scenarios.map((scenario) => (
              <div className="eventItem" key={scenario.name}>
                <span>{scenario.probability}%</span>
                <strong>{scenario.name}</strong>
                <small>{scenario.summary}</small>
              </div>
            ))}
          </div>
        </article>
        <article className="panelBlock">
          <h3>Dependency Analysis</h3>
          <p>{market.dependency.summary}</p>
          <Bar label="Confirmation" value={market.dependency.confirmationScore} />
          <Bar label="Conflict" value={market.dependency.conflictScore} danger />
        </article>
      </section>

      <section className="dependencyGrid">
        {market.dependency.relatedMarkets.map((dependency) => (
          <article className={`dependencyCard effect-${dependency.currentEffect}`} key={dependency.market}>
            <span>{dependency.relationship}</span>
            <strong>{dependency.market}</strong>
            <p>{dependency.currentEffect.replaceAll("_", " ")}</p>
            <Bar label="Weight" value={dependency.strength} />
          </article>
        ))}
      </section>

      <section className="sectionHeader">
        <div>
          <p className="eyebrow">Agent outputs</p>
          <h2>Explainable Agent Cards</h2>
        </div>
      </section>
      <section className="agentOutputGrid">
        {market.agents.map((agent) => (
          <article className={`agentOutput bias-${agent.bias}`} key={agent.agent}>
            <div className="marketTop">
              <h3>{agent.agent}</h3>
              <span>{pct(agent.confidence)}</span>
            </div>
            <p>{agent.summary}</p>
            <Bar label="Score" value={agent.score / 10} />
            {agent.keyLevels ? (
              <div className="levelGrid">
                <div>
                  <span>Support</span>
                  <strong>{agent.keyLevels.support.join(" / ")}</strong>
                </div>
                <div>
                  <span>Resistance</span>
                  <strong>{agent.keyLevels.resistance.join(" / ")}</strong>
                </div>
              </div>
            ) : null}
            {agent.invalidation ? <small>Invalidation: {agent.invalidation}</small> : null}
          </article>
        ))}
      </section>
    </main>
  );
}

function Sparkline({ candles }: { candles: MarketDetail["candles"] }) {
  const closes = candles.map((candle) => candle.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = Math.max(0.0001, max - min);
  const points = closes
    .map((close, index) => `${(index / Math.max(1, closes.length - 1)) * 100},${90 - ((close - min) / range) * 80}`)
    .join(" ");

  return (
    <svg className="priceChart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Price chart">
      <polyline points={points} />
    </svg>
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
        <strong>{pct(value)}</strong>
      </div>
      <i style={{ "--bar-width": `${Math.max(4, Math.min(100, value * 100))}%` } as CSSProperties} className={danger ? "dangerBar" : ""} />
    </div>
  );
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}
