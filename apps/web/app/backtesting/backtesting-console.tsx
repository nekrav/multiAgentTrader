"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "../lib/api";

type CatalogBalance = { balance: string };

type RunStatus = "queued" | "running" | "succeeded" | "failed" | "refunded" | "pending" | "cancelled";

type Run = {
  id: string;
  agentId: string;
  task: string;
  status: RunStatus;
  payload?: Record<string, unknown>;
  result?: unknown;
  error?: string | null;
};

type BacktestPayload = {
  runBacktest: true;
  assets: string[];
  strategies: string[];
  days: number;
  granularity: number;
  startingCash: number;
  feeBps: number;
  slippageBps: number;
  payoutMode: "binary_polymarket" | "spot_directional";
  indicators: string[];
};

type BacktestTrade = {
  asset: string;
  strategy: string;
  side: string;
  entry: number;
  exit: number;
  returnPct: number;
  entryTime: number;
  exitTime: number;
};

type StrategyRunAgentResult = {
  summary?: string;
  backtest?: {
    pnl?: number;
    trades?: number;
    winRate?: number;
    returnPct?: number;
    maxDrawdownPct?: number;
  };
  backtestDetails?: {
    mode?: string;
    dataSource?: string;
    summary?: string;
    portfolio?: {
      pnl?: number;
      trades?: number;
      winRate?: number;
      returnPct?: number;
      maxDrawdownPct?: number;
    };
    strategyResults?: Array<{
      asset: string;
      strategy: string;
      returnPct?: number;
      pnl?: number;
      trades?: number;
      winRate?: number;
      maxDrawdownPct?: number;
    }>;
    trades?: Array<{
      asset: string;
      strategy: string;
      side: string;
      entry: number;
      exit: number;
      returnPct: number;
      entryTime: number;
      exitTime: number;
    }>;
  };
};

type StrategyOption = {
  value: string;
  label: string;
};

const STRATEGY_PRESETS: StrategyOption[] = [
  { value: "trend_momentum_continuation", label: "Trend momentum continuation" },
  { value: "mean_reversion_exhaustion", label: "Mean-reversion exhaustion" },
  { value: "squeeze_breakout_confirmation", label: "Squeeze breakout confirmation" },
  { value: "ny_session_reversal", label: "NY session reversal" },
  { value: "reversal_confluence", label: "Reversal confluence" },
];

const GRANULARITY_OPTIONS = [60, 300, 900, 3600];
const CHART_STRATEGY_ALL = "all-strategies";

function parseCommaList(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseResult(raw: unknown): StrategyRunAgentResult | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const direct = raw as Record<string, unknown>;
  const nested = direct.result;
  if (nested && typeof nested === "object") {
    return nested as StrategyRunAgentResult;
  }

  return direct as StrategyRunAgentResult;
}

function parseTradeList(raw: unknown): BacktestTrade[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const trades: BacktestTrade[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const next = item as Record<string, unknown>;
    const entry = typeof next.entry === "number" ? next.entry : Number(next.entry);
    const exit = typeof next.exit === "number" ? next.exit : Number(next.exit);
    const returnPct = typeof next.returnPct === "number" ? next.returnPct : Number(next.returnPct);
    const entryTime = typeof next.entryTime === "number" ? next.entryTime : Number(next.entryTime);
    const exitTime = typeof next.exitTime === "number" ? next.exitTime : Number(next.exitTime);

    if (
      typeof next.asset !== "string" ||
      typeof next.strategy !== "string" ||
      typeof next.side !== "string" ||
      !Number.isFinite(entry) ||
      !Number.isFinite(exit) ||
      !Number.isFinite(returnPct) ||
      !Number.isFinite(entryTime) ||
      !Number.isFinite(exitTime)
    ) {
      continue;
    }

    trades.push({
      asset: next.asset,
      strategy: next.strategy,
      side: next.side,
      entry,
      exit,
      returnPct,
      entryTime,
      exitTime,
    });
  }

  return trades;
}

function toFixedPercent(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }
  return `${value.toFixed(4)}%`;
}

function toMoney(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function toTimeLabel(unixSeconds: number): string {
  const dt = new Date(unixSeconds * 1000);
  return dt.toLocaleString();
}

function strategyColor(strategy: string) {
  const seed = Math.abs([...strategy].reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 17));
  const hue = seed % 360;
  return `hsl(${hue} 78% 58%)`;
}

function TradeChart({ trades, chartStrategyFilter }: { trades: BacktestTrade[]; chartStrategyFilter: string }) {
  if (trades.length === 0) {
    return <p>No trade markers yet.</p>;
  }

  const filteredTrades =
    chartStrategyFilter === CHART_STRATEGY_ALL
      ? trades
      : trades.filter((trade) => trade.strategy === chartStrategyFilter);

  if (filteredTrades.length === 0) {
    return <p>No trades found for this strategy filter.</p>;
  }

  const ordered = [...filteredTrades].sort((a, b) => a.entryTime - b.entryTime);
  const xMin = Math.min(...ordered.flatMap((trade) => [trade.entryTime, trade.exitTime]));
  const xMax = Math.max(...ordered.flatMap((trade) => [trade.entryTime, trade.exitTime]));
  const yMinRaw = Math.min(...ordered.flatMap((trade) => [trade.entry, trade.exit]));
  const yMaxRaw = Math.max(...ordered.flatMap((trade) => [trade.entry, trade.exit]));

  const xSpan = Math.max(1, xMax - xMin);
  const ySpan = Math.max(1e-9, yMaxRaw - yMinRaw);

  const pad = 38;
  const width = 980;
  const height = 360;
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;

  const yMin = yMinRaw - ySpan * 0.05;
  const yMax = yMaxRaw + ySpan * 0.05;
  const yAdjustedSpan = Math.max(1e-9, yMax - yMin);

  const xScale = (time: number) => pad + ((time - xMin) / xSpan) * innerWidth;
  const yScale = (value: number) => pad + ((yMax - value) / yAdjustedSpan) * innerHeight;

  const xTicks = Array.from({ length: 5 }, (_, i) => xMin + (i * xSpan) / 4);
  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (i * yAdjustedSpan) / 4);

  return (
    <div className="backtestChartWrap">
      <div className="chartLegendHead">
        <strong>Trade markers (entry → exit)</strong>
        <span>{filteredTrades.length} trade events</span>
      </div>
      <svg className="backtestChart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Backtest trade chart">
        <rect x="0" y="0" width={width} height={height} fill="var(--panel)" />

        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="var(--line)" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="var(--line)" />

        {xTicks.map((tick, index) => {
          const x = xScale(tick);
          return (
            <g key={`x-${index}`}>
              <line x1={x} y1={pad} x2={x} y2={height - pad} stroke="var(--line)" strokeDasharray="3 4" />
              <text x={x} y={height - 12} textAnchor="middle" fontSize="11" fill="var(--muted)">
                {new Date(tick * 1000).toLocaleDateString()}
              </text>
            </g>
          );
        })}

        {yTicks.map((tick, index) => {
          const y = yScale(tick);
          return (
            <g key={`y-${index}`}>
              <line x1={pad} y1={y} x2={width - pad} y2={y} stroke="var(--line)" strokeDasharray="3 4" />
              <text x={12} y={y + 4} textAnchor="start" fontSize="11" fill="var(--muted)">
                {tick.toFixed(5)}
              </text>
            </g>
          );
        })}

        {ordered.map((trade) => {
          const x1 = xScale(trade.entryTime);
          const y1 = yScale(trade.entry);
          const x2 = xScale(trade.exitTime);
          const y2 = yScale(trade.exit);
          const lineColor = strategyColor(trade.strategy);
          const isLong = trade.side.toLowerCase() === "long";
          const sideMark = isLong ? "L" : "S";

          return (
            <g key={`${trade.asset}-${trade.entryTime}-${trade.entry}`}>
              <title>{`${trade.asset} / ${trade.strategy} / ${trade.side} / ${toFixedPercent(trade.returnPct)} from ${trade.entry} to ${trade.exit}`}</title>

              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={lineColor} strokeWidth="2.8" />

              <circle cx={x1} cy={y1} r="5" fill={lineColor} />
              <text x={x1} y={y1 - 8} textAnchor="middle" fontSize="9" fill={lineColor}>
                E
              </text>

              <circle cx={x2} cy={y2} r="5" fill={lineColor} opacity="0.85" />
              <text x={x2} y={y2 + 12} textAnchor="middle" fontSize="8" fill={lineColor}>
                X
              </text>

              <text x={Math.min(width - pad, Math.max(pad, Math.min(x1, x2))) + 4} y={(y1 + y2) / 2} textAnchor="start" fontSize="10" fill="var(--muted)">
                {trade.asset} {sideMark}
              </text>
            </g>
          );
        })}
      </svg>

      <ul className="tradePointLegend">
        {[...new Set(filteredTrades.map((trade) => trade.strategy))].map((strategy) => (
          <li key={strategy}>
            <span style={{ background: strategyColor(strategy) }} />
            {strategy}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BacktestingConsole() {
  const [balance, setBalance] = useState("0");
  const [payload, setPayload] = useState<BacktestPayload>({
    runBacktest: true,
    assets: ["EUR/USD", "GBP/USD"],
    strategies: ["trend_momentum_continuation", "mean_reversion_exhaustion"],
    days: 30,
    granularity: 300,
    startingCash: 2000,
    feeBps: 6,
    slippageBps: 2,
    payoutMode: "binary_polymarket",
    indicators: ["EMA", "RSI"],
  });

  const [assetInput, setAssetInput] = useState(payload.assets.join(", "));
  const [indicatorInput, setIndicatorInput] = useState(payload.indicators.join(", "));
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(payload.strategies);
  const [chartStrategyFilter, setChartStrategyFilter] = useState<string>(CHART_STRATEGY_ALL);

  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rawPayload, setRawPayload] = useState("");

  const parsedResult = useMemo(() => parseResult(run?.result), [run]);
  const backtest = parsedResult?.backtestDetails;
  const topStrategies = (backtest?.strategyResults ?? []).slice(0, 8);
  const backtestTrades = useMemo(() => parseTradeList(backtest?.trades), [backtest?.trades]);
  const availableStrategyValues = useMemo(() => {
    const fromCatalog = STRATEGY_PRESETS.map((strategy) => strategy.value);
    const fromRun = Array.from(new Set(backtestTrades.map((trade) => trade.strategy)));
    return Array.from(new Set([...fromCatalog, ...fromRun]));
  }, [backtestTrades]);

  const filteredTrades = useMemo(
    () =>
      chartStrategyFilter === CHART_STRATEGY_ALL
        ? backtestTrades
        : backtestTrades.filter((trade) => trade.strategy === chartStrategyFilter),
    [backtestTrades, chartStrategyFilter],
  );

  const hasBalance = Number(balance) >= 25;

  useEffect(() => {
    void apiFetch<CatalogBalance>("/credits/balance")
      .then((next) => setBalance(next.balance))
      .catch(() => setBalance("0"));
  }, []);

  useEffect(() => {
    if (!run || !["queued", "running"].includes(run.status)) {
      return;
    }

    const timer = setInterval(() => {
      void apiFetch<Run>(`/runs/${run.id}`).then((next) => {
        setRun(next);
        if (!["queued", "running"].includes(next.status)) {
          clearInterval(timer);
        }

        if (next.status === "succeeded") {
          void apiFetch<CatalogBalance>("/credits/balance").then((nextBalance) => setBalance(nextBalance.balance));
        }

        if (["failed", "refunded"].includes(next.status)) {
          void apiFetch<CatalogBalance>("/credits/balance").then((nextBalance) => setBalance(nextBalance.balance));
        }
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [run]);

  useEffect(() => {
    setChartStrategyFilter(CHART_STRATEGY_ALL);
  }, [run?.id]);

  function updatePayload(next: Partial<BacktestPayload>) {
    setPayload((current) => ({
      ...current,
      ...next,
    }));
  }

  function onStrategyChange(event: ChangeEvent<HTMLSelectElement>) {
    const selected = Array.from(event.target.selectedOptions, (option) => option.value);

    if (selected.length === 0) {
      setSelectedStrategies([]);
      setError("Pick at least one strategy.");
      return;
    }

    setSelectedStrategies(selected);
    setPayload((current) => ({
      ...current,
      strategies: selected,
    }));
    setError("");
  }

  function inputToPayload(): BacktestPayload | null {
    const normalized: BacktestPayload = {
      ...payload,
      assets: parseCommaList(assetInput),
      strategies: selectedStrategies,
      indicators: parseCommaList(indicatorInput),
      days: Number(payload.days),
      granularity: Number(payload.granularity),
      startingCash: Number(payload.startingCash),
      feeBps: Number(payload.feeBps),
      slippageBps: Number(payload.slippageBps),
    };

    if (normalized.assets.length === 0) {
      setError("Pick at least one asset.");
      return null;
    }

    if (normalized.strategies.length === 0) {
      setError("Pick at least one strategy.");
      return null;
    }

    if (!Number.isFinite(normalized.days) || normalized.days < 5 || normalized.days > 365) {
      setError("Days must be between 5 and 365.");
      return null;
    }

    if (!Number.isFinite(normalized.startingCash) || normalized.startingCash < 50) {
      setError("Starting cash must be at least 50.");
      return null;
    }

    if (!Number.isFinite(normalized.feeBps) || normalized.feeBps < 0) {
      setError("Fee (bps) must be a non-negative number.");
      return null;
    }

    if (!Number.isFinite(normalized.slippageBps) || normalized.slippageBps < 0) {
      setError("Slippage (bps) must be a non-negative number.");
      return null;
    }

    if (!Number.isFinite(normalized.granularity) || ![60, 300, 900, 3600].includes(normalized.granularity)) {
      setError("Choose 60, 300, 900, or 3600 seconds for granularity.");
      return null;
    }

    return normalized;
  }

  async function runBacktest(nextPayload: BacktestPayload) {
    setError("");
    setLoading(true);
    setRun(null);
    setRawPayload(JSON.stringify(nextPayload, null, 2));

    try {
      const created = await apiFetch<{ runId: string; status: string; balance: string }>("/runs", {
        method: "POST",
        body: JSON.stringify({
          agentId: "strategy-research",
          task: "strategy_sweep",
          payload: nextPayload,
        }),
      });

      setBalance(created.balance);
      setRun(await apiFetch<Run>(`/runs/${created.runId}`));
      setChartStrategyFilter(CHART_STRATEGY_ALL);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setError("Insufficient credits. Strategy Sweep costs 25 credits.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to start backtest run.");
      }
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPayload = inputToPayload();
    if (!nextPayload) {
      return;
    }
    void runBacktest(nextPayload);
  }

  function runQuickPreset() {
    const nextPayload: BacktestPayload = {
      ...payload,
      assets: ["EUR/USD", "GBP/USD", "USD/JPY"],
      strategies: ["trend_momentum_continuation", "mean_reversion_exhaustion", "squeeze_breakout_confirmation"],
      days: 30,
      granularity: 900,
      startingCash: 2500,
      feeBps: 6,
      slippageBps: 2,
      indicators: ["EMA", "RSI", "MACD"],
    };

    setPayload(nextPayload);
    setAssetInput(nextPayload.assets.join(", "));
    setIndicatorInput(nextPayload.indicators.join(", "));
    setSelectedStrategies(nextPayload.strategies);
    setChartStrategyFilter(CHART_STRATEGY_ALL);
    void runBacktest(nextPayload);
  }

  function onTextArrayChange(event: ChangeEvent<HTMLInputElement>, setState: (value: string) => void) {
    setState(event.target.value);
  }

  function onNumberChange(
    event: ChangeEvent<HTMLInputElement>,
    key: keyof Omit<BacktestPayload, "assets" | "strategies" | "indicators" | "payoutMode" | "runBacktest">,
  ) {
    const nextNumber = Number(event.target.value);
    updatePayload({
      ...(payload as BacktestPayload),
      [key]: nextNumber,
    } as BacktestPayload);
  }

  return (
    <section className="runConsole">
      <section className="sectionHeader compactHeader">
        <div>
          <p className="eyebrow">Backtesting</p>
          <h1>Agent Backtesting</h1>
          <small>Run strategy_research sweeps against real market history.</small>
        </div>
        <div className="metricTile runBalance">
          <span>Credits</span>
          <strong>{balance}</strong>
        </div>
      </section>

      <div className="runWorkbench">
        <form className="panelBlock runBuilder" onSubmit={onSubmit}>
          <div className="marketTop">
            <div>
              <span>Task</span>
              <h3>strategy_research • strategy_sweep</h3>
            </div>
            <strong>25 credits</strong>
          </div>

          <label>
            Assets (comma-separated)
            <input value={assetInput} onChange={(event) => onTextArrayChange(event, setAssetInput)} placeholder="EUR/USD, GBP/USD" />
          </label>

          <label>
            Strategies
            <select multiple size={6} value={selectedStrategies} onChange={onStrategyChange} className="strategyMultiSelect">
              {STRATEGY_PRESETS.map((strategy) => (
                <option key={strategy.value} value={strategy.value}>
                  {strategy.label}
                </option>
              ))}
            </select>
            <small>
              Tip: hold Ctrl/Cmd to select multiple, then run.
            </small>
          </label>

          <label>
            Indicators (comma-separated)
            <input value={indicatorInput} onChange={(event) => onTextArrayChange(event, setIndicatorInput)} placeholder="EMA, RSI" />
          </label>

          <label>
            Payout mode
            <select
              value={payload.payoutMode}
              onChange={(event) =>
                updatePayload({
                  payoutMode: event.target.value as "binary_polymarket" | "spot_directional",
                })
              }
            >
              <option value="binary_polymarket">Binary Polymarket</option>
              <option value="spot_directional">Spot Directional</option>
            </select>
          </label>

          <label>
            Days
            <input
              min={5}
              max={365}
              type="number"
              value={payload.days}
              onChange={(event) => onNumberChange(event, "days")}
            />
          </label>

          <label>
            Granularity
            <select
              value={payload.granularity}
              onChange={(event) =>
                updatePayload({
                  granularity: Number(event.target.value),
                })
              }
            >
              {GRANULARITY_OPTIONS.map((value) => (
                <option value={value} key={value}>
                  {value} sec
                </option>
              ))}
            </select>
          </label>

          <label>
            Starting cash
            <input
              min={100}
              type="number"
              value={payload.startingCash}
              onChange={(event) => onNumberChange(event, "startingCash")}
            />
          </label>

          <label>
            Fee (bps)
            <input
              min={0}
              type="number"
              value={payload.feeBps}
              onChange={(event) => onNumberChange(event, "feeBps")}
            />
          </label>

          <label>
            Slippage (bps)
            <input
              min={0}
              type="number"
              value={payload.slippageBps}
              onChange={(event) => onNumberChange(event, "slippageBps")}
            />
          </label>

          <div className="runFooterActions">
            <button className="secondaryButton" type="button" onClick={runQuickPreset} disabled={loading}>
              Run quick real-history preset
            </button>
            <button className="primaryButton" type="submit" disabled={loading || !hasBalance || run?.status === "running" || run?.status === "queued"}>
              {loading ? "Starting..." : "Run Backtest"}
            </button>
          </div>

          {error ? <p className="result error">{error}</p> : null}
          {!hasBalance ? <p className="result error">Need at least 25 credits to run a backtest.</p> : null}
        </form>

        {run ? (
          <section className="panelBlock">
            <div className="marketTop">
              <h3>Latest Backtest Run</h3>
              <span className={`status status-${run.status}`}>{run.status}</span>
            </div>

            <p>
              <strong>Run ID:</strong> {run.id}
            </p>

            {run.error ? <p className="error">{run.error}</p> : null}

            {parsedResult ? (
              <>
                <h4>Summary</h4>
                <p>{parsedResult.summary ?? "Run completed without a textual summary."}</p>

                {backtest ? (
                  <div className="paramGrid">
                    <div>
                      <strong>Portfolio PnL</strong>
                      <p>{toMoney(backtest.portfolio?.pnl)}</p>
                    </div>
                    <div>
                      <strong>Return</strong>
                      <p>{toFixedPercent(backtest.portfolio?.returnPct)}</p>
                    </div>
                    <div>
                      <strong>Trades</strong>
                      <p>{backtest.portfolio?.trades ?? "--"}</p>
                    </div>
                    <div>
                      <strong>Win Rate</strong>
                      <p>{
                        typeof backtest.portfolio?.winRate === "number"
                          ? `${(backtest.portfolio.winRate * 100).toFixed(2)}%`
                          : "--"
                      }</p>
                    </div>
                    <div>
                      <strong>Max Drawdown</strong>
                      <p>{toFixedPercent(backtest.portfolio?.maxDrawdownPct)}</p>
                    </div>
                    <div>
                      <strong>Data Source</strong>
                      <p>{backtest.dataSource ?? "Real history"}</p>
                    </div>
                  </div>
                ) : null}

                {backtest?.summary ? <p>{backtest.summary}</p> : null}

                {backtest?.mode ? (
                  <p>
                    <strong>Mode:</strong> {backtest.mode}
                  </p>
                ) : null}

                <h4>Strategy Results</h4>
                {topStrategies.length > 0 ? (
                  <ul className="resultList">
                    {topStrategies.map((item) => (
                      <li key={`${item.asset}-${item.strategy}`}>
                        <strong>
                          {item.asset} / {item.strategy}
                        </strong>
                        : Return {toFixedPercent(item.returnPct)}, PnL {toMoney(item.pnl)}, Trades {item.trades ?? 0}, Win
                        {" "}
                        {typeof item.winRate === "number" ? `${(item.winRate * 100).toFixed(1)}%` : "--"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No strategy rows returned.</p>
                )}

                <div className="marketTop chartFilterRow">
                  <h4>Trades chart</h4>
                  <label>
                    Filter strategy
                    <select
                      value={chartStrategyFilter}
                      onChange={(event) => setChartStrategyFilter(event.target.value || CHART_STRATEGY_ALL)}
                    >
                      <option value={CHART_STRATEGY_ALL}>All strategies</option>
                      {availableStrategyValues.map((strategyValue) => (
                        <option key={strategyValue} value={strategyValue}>
                          {strategyValue}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <TradeChart trades={filteredTrades} chartStrategyFilter={chartStrategyFilter} />

                {backtestTrades.length ? (
                  <>
                    <h4>Latest Trades</h4>
                    <ul className="resultList">
                      {backtestTrades
                        .slice(-8)
                        .map((trade) => (
                          <li key={`${trade.asset}-${trade.entryTime}-${trade.returnPct}`}>
                            {trade.asset} {trade.strategy} {trade.side} {toFixedPercent(trade.returnPct)} | Entry {trade.entry.toFixed(5)} @ {toTimeLabel(
                              trade.entryTime,
                            )}
                          </li>
                        ))}
                    </ul>
                  </>
                ) : null}
              </>
            ) : (
              run.status === "succeeded" || run.status === "failed" || run.status === "refunded"
                ? <p>Run complete without parsed strategy output.</p>
                : <p>Working...</p>
            )}

            <details className="rawDetails">
              <summary>Run payload</summary>
              <pre>{rawPayload || JSON.stringify(run.payload, null, 2)}</pre>
            </details>
          </section>
        ) : null}
      </div>
    </section>
  );
}
