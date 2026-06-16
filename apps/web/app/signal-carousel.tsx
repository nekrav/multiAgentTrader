"use client";

import { type WheelEvent, useCallback, useRef } from "react";

const CHART_FALLBACK = 0.0015;
const CHART_WINDOW = 56;
const CHART_HEIGHT = 120;

type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

type SignalCarouselItem = {
  symbol: string;
  label: string;
  move: "Buy" | "Sell";
  recommendationScore: number;
  changePct: number;
  consensus: {
    finalConfidence: number;
    agreementScore: number;
    timeframe?: string;
  };
  dependency: {
    conflictScore: number;
  };
  risk: string;
};

type SignalCarouselProps = {
  signals: SignalCarouselItem[];
  candlesBySymbol: Record<string, Candle[]>;
  className?: string;
  title?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export function SignalCarousel({ signals, candlesBySymbol, className = "", title }: SignalCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const getCardStep = useCallback(() => {
    const node = scrollRef.current;
    if (!node) {
      return 1;
    }

    const firstCard = node.querySelector<HTMLElement>(".signalCarouselItem");
    if (!firstCard) {
      return Math.max(1, node.clientWidth);
    }

    const style = getComputedStyle(node);
    const gap = parseFloat(style.columnGap || "0") || parseFloat(style.rowGap || "0") || 0;
    return Math.max(1, firstCard.getBoundingClientRect().width + gap);
  }, []);

  const getCurrentIndex = useCallback(() => {
    const node = scrollRef.current;
    if (!node) {
      return 0;
    }
    const step = getCardStep();
    return Math.max(0, Math.round(node.scrollLeft / Math.max(1, step)));
  }, [getCardStep]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const node = scrollRef.current;
      if (!node) {
        return;
      }

      const maxIndex = Math.max(0, signals.length - 1);
      const clamped = clamp(index, 0, maxIndex);
      const left = Math.round(getCardStep() * clamped);
      node.scrollTo({ left, behavior: "smooth" });
    },
    [getCardStep, signals.length],
  );

  const scrollBy = useCallback(
    (direction: -1 | 1) => {
      const node = scrollRef.current;
      if (!node) {
        return;
      }

      const maxIndex = Math.max(0, signals.length - 1);
      const step = getCardStep();
      if (maxIndex === 0) {
        return;
      }

      const current = getCurrentIndex();
      const target = clamp(current + direction, 0, maxIndex);
      if (target === current) {
        node.scrollBy({ left: direction * Math.max(1, step), behavior: "smooth" });
        return;
      }

      scrollToIndex(target);
    },
    [getCardStep, getCurrentIndex, scrollToIndex, signals.length],
  );

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (Math.abs(event.deltaY) < 2) {
        return;
      }
      event.preventDefault();
      scrollBy(event.deltaY > 0 ? 1 : -1);
    },
    [scrollBy],
  );

  return (
    <section className={`signalCarouselBlock ${className}`.trim()}>
      <div className="signalCarouselControls">
        {title ? (
          <div className="signalCarouselHeader">
            <span>{title}</span>
            <small>{signals.length} signals</small>
          </div>
        ) : null}

        <button
          type="button"
          className="signalCarouselButton signalCarouselButtonLeft"
          aria-label="Previous signals"
          onClick={() => scrollBy(-1)}
          disabled={signals.length < 2}
        >
          ◀
        </button>

        <div className="signalCarousel" ref={scrollRef} onWheel={handleWheel}>
          {signals.map((signal) => {
            const candles = candlesBySymbol[signal.symbol] ?? [];
            return (
              <a
                href={`/markets/${signal.symbol}`}
                className={`signalCarouselItem move-${signal.move.toLowerCase()}`}
                key={`${signal.symbol}-${signal.move}-${signal.consensus.timeframe ?? "1H"}`}
                aria-label={`Signal ${signal.label}. ${signal.move}. ${signal.consensus.timeframe ?? "1H"}.`}
              >
                <div className="signalCarouselMeta">
                  <span className="signalCarouselTitle">{signal.label}</span>
                  <span className={`signalMoveSquare move-${signal.move.toLowerCase()}`} />
                  <span className={`signalMoveBadge move-${signal.move.toLowerCase()}`}>{signal.move}</span>
                </div>
                <p className="signalCarouselTimeframe">{signal.consensus.timeframe ?? "1H"}</p>
                <div className="signalCarouselStats">
                  <span>{formatPercent(signal.consensus.finalConfidence)} confidence</span>
                  <span>{formatPercent(signal.consensus.agreementScore)} agreement</span>
                  <span className="signalCarouselRisk">{signal.risk} · {formatPercent(signal.dependency.conflictScore)} conflict</span>
                </div>
                <SignalMiniChart
                  candles={candles}
                  positive={signal.move === "Buy"}
                  symbol={signal.label}
                  move={signal.move}
                  timeframe={signal.consensus.timeframe ?? "1H"}
                />
              </a>
            );
          })}
        </div>

        <button
          type="button"
          className="signalCarouselButton signalCarouselButtonRight"
          aria-label="Next signals"
          onClick={() => scrollBy(1)}
          disabled={signals.length < 2}
        >
          ▶
        </button>
      </div>
    </section>
  );
}

function SignalMiniChart({ candles, positive, symbol, move, timeframe }: { candles: Candle[]; positive: boolean; symbol: string; move: "Buy" | "Sell"; timeframe: string }) {
  if (candles.length < 2) {
    return <div className="signalMiniChartEmpty">No graph yet</div>;
  }

  const window = candles.slice(-Math.max(2, Math.min(CHART_WINDOW, candles.length)));
  const series = window.map((candle) => candle.close);
  const rangeSamples = window.flatMap((candle) => [candle.open, candle.close, candle.low, candle.high]);
  const min = Math.min(...rangeSamples);
  const max = Math.max(...rangeSamples);
  const span = Math.max(max - min, CHART_FALLBACK);
  const paddedSpan = span * 1.12;
  const mid = (min + max) / 2;
  const lowerBound = mid - paddedSpan / 2;
  const upperBound = mid + paddedSpan / 2;
  const yRange = Math.max(upperBound - lowerBound, CHART_FALLBACK);

  const points = series
    .map((close, index) => {
      const x = (index / (series.length - 1)) * 100;
      const y = 94 - ((close - lowerBound) / yRange) * 84;
      const clampedY = Math.min(94, Math.max(6, y));
      return `${x.toFixed(2)},${clampedY.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      className={`signalMiniChart ${positive ? "positiveLine" : "negativeLine"}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Signal sparkline chart ${symbol}, ${move} ${timeframe}`}
      style={{ height: CHART_HEIGHT, width: "100%" }}
      height={CHART_HEIGHT}
      width="100%"
    >
      <line x1="0" x2="100" y1="16" y2="16" />
      <line x1="0" x2="100" y1="84" y2="84" />
      <polyline points={points} />
    </svg>
  );
}
