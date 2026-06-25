"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

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

type TradeRecommendation = DashboardMarket & {
  recommendationScore: number;
  move: "Buy" | "Sell";
};

type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

type PanelEntry = {
  recommendation: TradeRecommendation;
  candles: Candle[];
};

export function TerminalChartPanel({ entries }: { entries: PanelEntry[] }) {
  const [idx, setIdx] = useState(0);

  if (entries.length === 0) {
    return (
      <div className="terminalChartPanel">
        <div className="tradePanelTop">
          <div>
            <p className="eyebrow">Agent Trade Desk</p>
            <h1>No actionable recommendation</h1>
          </div>
        </div>
        <p className="tradeSummary">No market currently clears the directional confidence filter.</p>
      </div>
    );
  }

  const total = entries.length;
  const { recommendation: rec, candles } = entries[idx];

  return (
    <div className={`terminalChartPanel move-${rec.move.toLowerCase()}`}>
      <div className="tradePanelTop">
        <div>
          <p className="eyebrow">Agent Trade Desk</p>
          <h1>{rec.move} {rec.label}</h1>
        </div>
        <div className="chartPanelTopRight">
          {total > 1 && (
            <div className="chartPairNav">
              <button
                className="chartPairNavBtn"
                onClick={() => setIdx((idx - 1 + total) % total)}
                aria-label="Previous pair"
              >
                ‹
              </button>
              <span className="chartPairNavCount">{idx + 1} / {total}</span>
              <button
                className="chartPairNavBtn"
                onClick={() => setIdx((idx + 1) % total)}
                aria-label="Next pair"
              >
                ›
              </button>
            </div>
          )}
          <div className="decisionStack">
            <span className={`moveBadge move-${rec.move.toLowerCase()}`}>{rec.move}</span>
            <small>{formatPercent(rec.consensus.finalConfidence)} confidence</small>
          </div>
        </div>
      </div>

      <div className="terminalChartFrame">
        <TradeHeroChart candles={candles} positive={rec.changePct >= 0} />
        <div className="chartOverlay">
          <span>{rec.label}</span>
          <strong>{formatPrice(rec.price)}</strong>
          <small className={rec.changePct >= 0 ? "positive" : "negative"}>{formatSignedPercent(rec.changePct)}</small>
        </div>
        <div className="chartInfoWrap">
          <button className="chartInfoBtn" aria-label="What this chart shows">ⓘ</button>
          <div className="chartInfoTooltip" role="tooltip">
            Closing-price trend for the most recent candles, scaled to the period&#39;s high and low. Grid lines mark 25 / 42 / 58 / 75% of the range. Signals below show agent score, agreement, confirmation, and conflict.
          </div>
        </div>
      </div>

      <div className="signalRail" aria-label="Agent recommendation quality">
        <SignalPill label="Score" value={formatPercent(rec.recommendationScore)} />
        <SignalPill label="Agree" value={formatPercent(rec.consensus.agreementScore)} />
        <SignalPill label="Confirm" value={formatPercent(rec.dependency.confirmationScore)} />
        <SignalPill label="Conflict" value={formatPercent(rec.dependency.conflictScore)} danger />
      </div>

      <p className="tradeSummary">{rec.summary}</p>

      <div className="tradeRationale">
        <div>
          <span>Agent Rationale</span>
          <strong>{rec.dependency.summary}</strong>
        </div>
        <div>
          <span>Invalidation</span>
          <strong>{rec.consensus.invalidation}</strong>
        </div>
      </div>

      {total > 1 && (
        <div className="chartPairDots" aria-label="Pair indicators">
          {entries.map((entry, i) => (
            <button
              key={entry.recommendation.symbol}
              className={`chartPairDot${i === idx ? " chartPairDotActive" : ""}`}
              onClick={() => setIdx(i)}
              aria-label={`View ${entry.recommendation.label}`}
              title={entry.recommendation.label}
            />
          ))}
        </div>
      )}
    </div>
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

  const closes = candles.map((c) => c.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  // Keep data between y=14 (top) and y=86 (bottom), leaving 14 units of padding on each side
  // so strokes never clip against the viewBox edge.
  const points = closes
    .map((close, i) => {
      const x = (i / (closes.length - 1)) * 100;
      const y = 86 - ((close - min) / range) * 72;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      className={`terminalHeroChart ${positive ? "positiveLine" : "negativeLine"}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="img"
      aria-label="Primary recommendation price chart"
    >
      {[25, 42, 58, 75].map((y) => (
        <line x1="0" x2="100" y1={y} y2={y} key={y} />
      ))}
      <polyline points={points} />
    </svg>
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
