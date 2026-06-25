"use client";

import { useEffect, useMemo, useState } from "react";

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
    adjustment: number;
    summary: string;
  };
};

type Dashboard = {
  updatedAt: string;
  nextRefreshAt?: string;
  analysisRunId?: string;
  analysisRunSequence?: number;
  markets: DashboardMarket[];
  watchlist: DashboardMarket[];
};

type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

const pollIntervalSeconds = 60;
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function LiveHomeDashboard({
  initialDashboard,
  initialCandlesBySymbol,
}: {
  initialDashboard: Dashboard;
  initialCandlesBySymbol: Record<string, Candle[]>;
}) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [candlesBySymbol, setCandlesBySymbol] = useState<Record<string, Candle[]>>(initialCandlesBySymbol);
  const [lastFetchedAt, setLastFetchedAt] = useState<string>(() => new Date().toISOString());

  const recommendations = useMemo(() => buildRecommendations(dashboard.markets), [dashboard.markets]);
  const chartMarkets = useMemo(() => {
    const symbols = new Set<string>();
    [...recommendations, ...dashboard.watchlist].forEach((market) => symbols.add(market.symbol));
    return dashboard.markets.filter((market) => symbols.has(market.symbol)).slice(0, 8);
  }, [dashboard.markets, dashboard.watchlist, recommendations]);

  useEffect(() => {
    let ignore = false;

    async function refreshLiveData() {
      try {
        const dashboardResponse = await fetch(`${apiUrl}/dashboard`, { cache: "no-store" });
        if (!dashboardResponse.ok) {
          throw new Error("Dashboard fetch failed");
        }
        const nextDashboard = (await dashboardResponse.json()) as Dashboard;
        const nextRecommendations = buildRecommendations(nextDashboard.markets);
        const symbols = Array.from(
          new Set([...nextRecommendations, ...nextDashboard.watchlist].map((market) => market.symbol)),
        ).slice(0, 8);
        const candleEntries = await Promise.all(
          symbols.map(async (symbol) => {
            const response = await fetch(`${apiUrl}/markets/${encodeURIComponent(symbol)}/candles`, { cache: "no-store" });
            if (!response.ok) {
              return [symbol, []] as const;
            }
            return [symbol, (await response.json()) as Candle[]] as const;
          }),
        );

        if (!ignore) {
          setDashboard(nextDashboard);
          setCandlesBySymbol(Object.fromEntries(candleEntries));
          setLastFetchedAt(new Date().toISOString());
        }
      } catch {
        // Keep the last successful snapshot visible if a refresh fails.
      }
    }

    refreshLiveData();
    const interval = window.setInterval(refreshLiveData, pollIntervalSeconds * 1000);

    return () => {
      ignore = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section className="marketTickerDock" aria-label="Live charts, recommended moves, and latest update time">
      <div className="tickerCharts">
        {chartMarkets.slice(0, 5).map((market) => (
          <TickerChart market={market} candles={candlesBySymbol[market.symbol] ?? []} key={market.symbol} />
        ))}
      </div>

      <div className="tickerRightScroll" aria-label="Recommended moves and latest refresh time">
        <div className="tickerMoves">
          {recommendations.slice(0, 3).map((market) => (
            <TickerMove market={market} key={market.symbol} />
          ))}
        </div>

        <div className="tickerUpdated">
          <span>Last updated</span>
          <strong>{formatTime(lastFetchedAt)}</strong>
        </div>
      </div>
    </section>
  );
}

function TickerMove({ market }: { market: DashboardMarket }) {
  const move = recommendedMove(market.consensus.finalBias);
  return (
    <a className={`tickerMove move-${move.toLowerCase()}`} href={`/markets/${market.symbol}`}>
      <span>{move}</span>
      <strong>{market.label}</strong>
      <small>{formatPercent(market.consensus.finalConfidence)}</small>
    </a>
  );
}

function TickerChart({ market, candles }: { market: DashboardMarket; candles: Candle[] }) {
  const latest = candles.at(-1);
  return (
    <a className="tickerChart" href={`/markets/${market.symbol}`}>
      <div>
        <span>{market.label}</span>
        <strong>{formatPrice(latest?.close ?? market.price)}</strong>
        <small className={market.changePct >= 0 ? "positive" : "negative"}>{formatSignedPercent(market.changePct)}</small>
      </div>
      <Sparkline candles={candles} positive={market.changePct >= 0} />
    </a>
  );
}

function Sparkline({ candles, positive }: { candles: Candle[]; positive: boolean }) {
  if (candles.length < 2) {
    return <div className="liveSparkline emptySparkline">Waiting for candles</div>;
  }

  const closes = candles.map((candle) => candle.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const points = closes
    .map((close, index) => {
      const x = (index / (closes.length - 1)) * 100;
      const y = 92 - ((close - min) / range) * 80;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg className={`liveSparkline ${positive ? "positiveLine" : "negativeLine"}`} viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Recent price chart">
      <polyline points={points} />
    </svg>
  );
}

function buildRecommendations(markets: DashboardMarket[]) {
  return markets
    .filter((market) => market.consensus.finalBias !== "neutral")
    .sort((a, b) => {
      const aScore = a.consensus.finalConfidence * 0.65 + a.consensus.agreementScore * 0.25 - a.dependency.conflictScore * 0.1;
      const bScore = b.consensus.finalConfidence * 0.65 + b.consensus.agreementScore * 0.25 - b.dependency.conflictScore * 0.1;
      return bScore - aScore;
    })
    .slice(0, 5);
}

function recommendedMove(bias: Bias) {
  if (bias === "bullish") {
    return "Buy";
  }
  if (bias === "bearish") {
    return "Sell";
  }
  return "Hold";
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

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
