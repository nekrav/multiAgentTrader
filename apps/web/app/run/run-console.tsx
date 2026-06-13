"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AgentResult } from "../agents-dashboard";
import { ApiError, apiFetch } from "../lib/api";

type CatalogItem = {
  id: string;
  agentId: string;
  agentName: string;
  task: string;
  displayName: string;
  description: string;
  creditCost: string;
  paramsSchema: Record<string, unknown>;
  endpointConfigured: boolean;
};

type AnalysisRun = {
  id: string;
  agentId: string;
  task: string;
  creditCost: string;
  status: string;
  result?: Record<string, unknown> | null;
  error: string | null;
};

type Balance = { balance: string; updatedAt: string };

type InputExample = {
  name: string;
  description: string;
  payload: Record<string, unknown>;
};

const ASSET_OPTIONS = ["BTC", "ETH", "BTC-USD", "ETH-USD", "SOL-USD", "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD"];
const EVENT_TYPE_OPTIONS = [
  { value: "cpi", label: "Inflation / CPI" },
  { value: "nfp", label: "Jobs / NFP" },
  { value: "central_bank", label: "Central Bank" },
  { value: "earnings", label: "Earnings" },
  { value: "crypto_regulation", label: "Crypto Regulation" },
  { value: "crypto_etf", label: "Crypto ETF / Flows" },
];
const SURPRISE_OPTIONS = ["hot", "cool", "strong", "weak", "hawkish", "dovish", "positive", "negative", "unknown"];
const IMPORTANCE_OPTIONS = ["high", "medium", "low"];
const EVENT_ASSET_CLASS_OPTIONS = ["forex", "stocks", "crypto"];
const MARKET_DATA_ASSET_OPTIONS = ["BTC", "ETH", "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "USD/CHF", "NZD/USD", "EUR/GBP", "EUR/JPY", "GBP/JPY"];
const TREND_OPTIONS = ["up", "flat", "down", "unknown"];
const VOLATILITY_OPTIONS = ["low", "medium", "high", "unknown"];
const RISK_LEVEL_OPTIONS = ["low", "medium", "high", "unknown"];
const STRATEGY_OPTIONS = [
  { value: "market_favorite_90", label: "Market Favorite 90" },
  { value: "market_favorite_95", label: "Market Favorite 95" },
  { value: "trend_momentum_continuation", label: "Trend + Momentum" },
  { value: "london_session_breakout", label: "London Breakout" },
  { value: "ny_session_reversal", label: "NY Reversal" },
  { value: "squeeze_breakout_confirmation", label: "Squeeze Breakout" },
  { value: "mean_reversion_exhaustion", label: "Mean Reversion" },
  { value: "pattern_breakout_with_trend_filter", label: "Pattern Breakout" },
  { value: "reversal_confluence", label: "Reversal Confluence" },
];
const INDICATOR_OPTIONS = ["EMA", "MACD", "ADX", "RSI", "Bollinger Bands", "Stochastic", "ATR", "Support/Resistance"];
const GRANULARITY_OPTIONS = [
  { value: 60, label: "1 minute" },
  { value: 300, label: "5 minutes" },
  { value: 900, label: "15 minutes" },
  { value: 3600, label: "1 hour" },
];
const THRESHOLD_PRESETS = {
  default: {
    maxVolatilitySeverity: 2,
    maxRangePct: 0.12,
    maxFastMoveX: 4,
    maxSpreadPct: 3,
    minLiquidityUsdc: 100,
    maxRecentLosses: 4,
    minEvPct: 0.3,
  },
  strict: {
    maxVolatilitySeverity: 1.25,
    maxRangePct: 0.07,
    maxFastMoveX: 3,
    maxSpreadPct: 2,
    minLiquidityUsdc: 500,
    maxRecentLosses: 3,
    minEvPct: 0.4,
  },
  loose: {
    maxVolatilitySeverity: 2.5,
    maxRangePct: 0.16,
    maxFastMoveX: 5,
    maxSpreadPct: 4,
    minLiquidityUsdc: 50,
    maxRecentLosses: 5,
    minEvPct: 0.2,
  },
} satisfies Record<string, Record<string, number>>;

const INPUT_EXAMPLES: Record<string, InputExample[]> = {
  "risk:evaluate": [
    {
      name: "Low-volatility BTC pass",
      description: "Clean liquidity, tight spread, positive EV, and calm candle action.",
      payload: {
        snapshot: {
          asset: "BTC-USD",
          trend: "up",
          volatility: { level: "low", severityX: 0.82, rangePct: 0.045, fastMoveX: 1.2 },
          spreadPct: 0.42,
          liquidityUsdc: 2450,
          recentLosses: 1,
          evPct: 0.72,
        },
      },
    },
    {
      name: "Medium-volatility warning",
      description: "Still tradable, but close enough to limits to trigger caution.",
      payload: {
        snapshot: {
          asset: "ETH-USD",
          trend: "flat",
          volatility: { level: "medium", severityX: 1.62, rangePct: 0.086, fastMoveX: 2.7 },
          spreadPct: 1.1,
          liquidityUsdc: 780,
          recentLosses: 2,
          evPct: 0.48,
        },
      },
    },
    {
      name: "High-volatility veto",
      description: "Volatility, range, and fast move all cross the default veto thresholds.",
      payload: {
        snapshot: {
          asset: "BTC-USD",
          trend: "down",
          volatility: { level: "high", severityX: 2.35, rangePct: 0.18, fastMoveX: 4.8 },
          spreadPct: 1.9,
          liquidityUsdc: 1220,
          recentLosses: 1,
          evPct: 0.58,
        },
      },
    },
    {
      name: "Thin-liquidity veto",
      description: "Good price action, but market depth and spread are not acceptable.",
      payload: {
        snapshot: {
          asset: "SOL-USD",
          trend: "up",
          volatility: { level: "low", severityX: 0.96, rangePct: 0.052, fastMoveX: 1.6 },
          spreadPct: 3.8,
          liquidityUsdc: 58,
          recentLosses: 1,
          evPct: 0.81,
        },
      },
    },
    {
      name: "Custom strict thresholds",
      description: "Same market under tighter research-stage limits.",
      payload: {
        snapshot: {
          asset: "ETH-USD",
          trend: "up",
          volatility: { level: "medium", severityX: 1.32, rangePct: 0.072, fastMoveX: 2.1 },
          spreadPct: 0.82,
          liquidityUsdc: 960,
          recentLosses: 2,
          evPct: 0.44,
        },
        thresholds: {
          maxVolatilitySeverity: 1.25,
          maxRangePct: 0.07,
          maxFastMoveX: 3.2,
          maxSpreadPct: 2,
          minLiquidityUsdc: 500,
          maxRecentLosses: 3,
          minEvPct: 0.4,
        },
      },
    },
  ],
  "strategy-research:propose": [
    {
      name: "Promote after positive backtest",
      description: "Low-risk conditions with positive PnL and acceptable drawdown.",
      payload: {
        marketSnapshot: { asset: "BTC-USD", trend: "up", volatility: { level: "low", severityX: 0.88, rangePct: 0.041, fastMoveX: 1.1 } },
        riskCheck: { passed: true, riskLevel: "low", riskScore: 18.5 },
        backtestResult: { portfolio: { pnl: 42.6, maxDrawdownPct: -1.1, trades: 54, winRate: 0.61, returnPct: 4.26 } },
      },
    },
    {
      name: "Reject weak backtest",
      description: "Good market/risk context but losing or underpowered historical evidence.",
      payload: {
        marketSnapshot: { asset: "ETH-USD", trend: "flat", volatility: { level: "low", severityX: 0.74, rangePct: 0.038, fastMoveX: 0.9 } },
        riskCheck: { passed: true, riskLevel: "low", riskScore: 14.2 },
        backtestResult: { portfolio: { pnl: -8.35, maxDrawdownPct: -2.8, trades: 18, winRate: 0.44, returnPct: -0.84 } },
      },
    },
    {
      name: "Do not trade high risk",
      description: "Risk engine has already vetoed the setup.",
      payload: {
        marketSnapshot: { asset: "BTC-USD", trend: "down", volatility: { level: "high", severityX: 2.42, rangePct: 0.19, fastMoveX: 5.2 } },
        riskCheck: { passed: false, riskLevel: "high", riskScore: 86.4, vetoes: ["volatility severity 2.42x >= 2.00x"] },
      },
    },
    {
      name: "Medium-volatility tighten filters",
      description: "No hard veto, but volatility requires stricter strategy gates.",
      payload: {
        marketSnapshot: { asset: "ETH-USD", trend: "up", volatility: { level: "medium", severityX: 1.48, rangePct: 0.091, fastMoveX: 2.8 } },
        riskCheck: { passed: true, riskLevel: "medium", riskScore: 41.2, warnings: ["volatility elevated at 1.48x"] },
      },
    },
    {
      name: "Observe until inputs improve",
      description: "Sparse inputs show how the agent handles insufficient evidence.",
      payload: {
        marketSnapshot: { asset: "BTC-USD", trend: "unknown", volatility: { level: "unknown" } },
        riskCheck: { passed: true, riskLevel: "unknown" },
      },
    },
  ],
  "strategy-research:strategy_sweep": [
    {
      name: "BTC/ETH two-day favorite sweep",
      description: "Default fast Strategy Lab sweep for BTC and ETH.",
      payload: {
        runBacktest: true,
        assets: ["BTC", "ETH"],
        days: 2,
        granularity: 300,
        startingCash: 1000,
        feeBps: 6,
        slippageBps: 2,
        strategies: ["market_favorite_90", "market_favorite_95"],
        payoutMode: "binary_polymarket",
      },
    },
    {
      name: "Low-fee sensitivity sweep",
      description: "Tests whether the strategy survives tighter trading costs.",
      payload: {
        runBacktest: true,
        assets: ["BTC", "ETH"],
        days: 3,
        granularity: 300,
        startingCash: 2500,
        feeBps: 3,
        slippageBps: 1,
        strategies: ["market_favorite_90", "market_favorite_95"],
        payoutMode: "binary_polymarket",
      },
    },
    {
      name: "High-friction stress sweep",
      description: "Raises fees/slippage to see whether edge disappears.",
      payload: {
        runBacktest: true,
        assets: ["BTC", "ETH"],
        days: 2,
        granularity: 900,
        startingCash: 1000,
        feeBps: 12,
        slippageBps: 6,
        strategies: ["market_favorite_90", "market_favorite_95"],
        payoutMode: "binary_polymarket",
      },
    },
    {
      name: "BTC-only intraday sweep",
      description: "Narrows the sweep to BTC and shorter candles.",
      payload: {
        runBacktest: true,
        assets: ["BTC"],
        days: 1,
        granularity: 60,
        startingCash: 1000,
        feeBps: 6,
        slippageBps: 2,
        strategies: ["market_favorite_90"],
        payoutMode: "binary_polymarket",
      },
    },
    {
      name: "Use supplied backtest",
      description: "Skips live Strategy Lab call and proposes from supplied sweep evidence.",
      payload: {
        runBacktest: false,
        marketSnapshot: { asset: "ETH-USD", trend: "up", volatility: { level: "low", severityX: 0.91 } },
        riskCheck: { passed: true, riskLevel: "low", riskScore: 19.4 },
        backtestResult: { portfolio: { pnl: 36.2, maxDrawdownPct: -1.4, trades: 47, winRate: 0.58, returnPct: 3.62 } },
      },
    },
  ],
  "event-analysis:event_study": [
    {
      name: "Hot CPI macro shock",
      description: "Compare a high-impact inflation surprise against past macro reactions.",
      payload: {
        currentEvent: {
          title: "US CPI came in hotter than forecast",
          eventType: "cpi",
          assetClasses: ["forex", "stocks", "crypto"],
          affectedAssets: ["USD", "DXY", "EUR/USD", "USD/JPY", "QQQ", "BTC"],
          importance: "high",
          surpriseDirection: "hot",
          actual: "3.6%",
          forecast: "3.3%",
          previous: "3.2%",
          timeWindow: "next 0-24h",
        },
      },
    },
    {
      name: "FOMC hawkish hold",
      description: "Rate unchanged, but guidance is tighter than the market expected.",
      payload: {
        currentEvent: {
          title: "FOMC holds rates but signals fewer cuts",
          eventType: "central_bank",
          assetClasses: ["forex", "stocks", "crypto"],
          affectedAssets: ["USD", "DXY", "USD/JPY", "QQQ", "SPY", "BTC"],
          importance: "high",
          surpriseDirection: "hawkish",
          timeWindow: "decision through press conference",
        },
      },
    },
    {
      name: "NVDA earnings beat",
      description: "Single-stock earnings event with possible QQQ and AI-sector spillover.",
      payload: {
        currentEvent: {
          title: "NVIDIA beats earnings and raises guidance",
          eventType: "earnings",
          assetClasses: ["stocks", "crypto"],
          affectedAssets: ["NVDA", "QQQ", "SPY", "MSFT", "BTC"],
          importance: "high",
          surpriseDirection: "beat",
          timeWindow: "after-hours through next cash open",
        },
      },
    },
    {
      name: "Crypto ETF inflow spike",
      description: "Institutional-flow event that could affect BTC, ETH, and crypto equities.",
      payload: {
        currentEvent: {
          title: "Spot BTC ETF inflows accelerate",
          eventType: "crypto_etf",
          assetClasses: ["crypto", "stocks"],
          affectedAssets: ["BTC", "ETH", "COIN", "MSTR", "QQQ"],
          importance: "medium",
          surpriseDirection: "positive",
          timeWindow: "US cash session and daily flow update",
        },
      },
    },
  ],
};

export function RunConsole() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [balance, setBalance] = useState("0");
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [jsonPayload, setJsonPayload] = useState("{}");
  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = useMemo(() => catalog.find((item) => item.id === selectedId) ?? catalog[0], [catalog, selectedId]);
  const selectedExamples = useMemo(() => examplesFor(selected), [selected]);
  const balanceNumber = Number(balance);
  const selectedCost = Number(selected?.creditCost ?? 0);

  useEffect(() => {
    void Promise.all([apiFetch<CatalogItem[]>("/catalog"), apiFetch<Balance>("/credits/balance")])
      .then(([items, credits]) => {
        setCatalog(items);
        setSelectedId(items[0]?.id ?? "");
        setBalance(credits.balance);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load run console."));
  }, []);

  useEffect(() => {
    if (!selected) {
      return;
    }
    const defaults = selectedExamples[0]?.payload ?? buildDefaults(selected.paramsSchema);
    setPayload(defaults);
    setJsonPayload(JSON.stringify(defaults, null, 2));
  }, [selected, selectedExamples]);

  useEffect(() => {
    if (!run || !["queued", "running"].includes(run.status)) {
      return;
    }
    const timer = setInterval(() => {
      void apiFetch<AnalysisRun>(`/runs/${run.id}`).then((next) => {
        setRun(next);
        if (["failed", "refunded"].includes(next.status)) {
          void apiFetch<Balance>("/credits/balance").then((credits) => setBalance(credits.balance));
        }
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [run]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) {
      return;
    }
    setError("");
    setLoading(true);
    try {
      const bodyPayload = isSimpleSchema(selected.paramsSchema) ? payload : JSON.parse(jsonPayload || "{}");
      const created = await apiFetch<{ runId: string; balance: string }>(`/runs`, {
        method: "POST",
        body: JSON.stringify({ agentId: selected.agentId, task: selected.task, payload: bodyPayload }),
      });
      setBalance(created.balance);
      setRun(await apiFetch<AnalysisRun>(`/runs/${created.runId}`));
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setError("Insufficient credits for this run.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to start run.");
      }
    } finally {
      setLoading(false);
    }
  }

  function applyExample(example: InputExample) {
    setPayloadFromControls(example.payload);
  }

  function setPayloadFromControls(nextPayload: Record<string, unknown>) {
    setPayload(nextPayload);
    setJsonPayload(JSON.stringify(nextPayload, null, 2));
  }

  async function saveLatestRun() {
    if (!run) {
      return;
    }
    setSaveMessage("");
    try {
      await apiFetch("/saved-analyses", {
        method: "POST",
        body: JSON.stringify({
          runId: run.id,
          title: `${run.agentId} ${run.task}`,
          tags: [run.agentId, run.task],
        }),
      });
      setSaveMessage("Saved to analysis history.");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Failed to save analysis.");
    }
  }

  return (
    <div className="runConsole">
      <section className="sectionHeader compactHeader">
        <div>
          <p className="eyebrow">Run analysis</p>
          <h1>Agent Analysis Console</h1>
        </div>
        <div className="metricTile runBalance">
          <span>Credits</span>
          <strong>{balance}</strong>
        </div>
      </section>

      <div className="runWorkbench">
        <section className="agentPicker" aria-label="Analysis tasks">
          <div className="inputExamplesTop">
            <span>Analysis type</span>
            <strong>{catalog.length} tasks</strong>
          </div>
          {catalog.map((item) => (
            <button
              className={`catalogCard ${selected?.id === item.id ? "active" : ""}`}
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              type="button"
            >
              <span>{item.agentId}</span>
              <strong>{item.displayName}</strong>
              <small>{item.description}</small>
              <b>{item.creditCost} credits</b>
            </button>
          ))}
        </section>

        {selected ? (
          <form className="panelBlock runBuilder" onSubmit={submit}>
            <div className="marketTop">
              <div>
                <span>{selected.agentName}</span>
                <h3>{selected.displayName}</h3>
              </div>
              <strong>{selected.creditCost} credits</strong>
            </div>
            <RunTaskSummary selected={selected} />
            {selectedExamples.length > 0 ? <ExampleInputs examples={selectedExamples} onSelect={applyExample} /> : null}
            <GuidedPayloadBuilder selected={selected} payload={payload} setPayload={setPayloadFromControls} />
            <details className="rawDetails advancedPayload">
              <summary>Advanced JSON payload</summary>
              <textarea className="jsonTextarea" value={jsonPayload} onChange={(event) => setJsonPayload(event.target.value)} rows={10} />
            </details>
            <button
              className="primaryButton"
              disabled={loading || balanceNumber < selectedCost || !selected.endpointConfigured}
              title={balanceNumber < selectedCost ? "Insufficient credits" : undefined}
              type="submit"
            >
              {loading ? "Starting..." : "Run Analysis"}
            </button>
            {error ? <p className="result error">{error}</p> : null}
          </form>
        ) : null}
      </div>

      {run ? (
        <section className="panelBlock">
          <div className="marketTop">
            <h3>Latest Run</h3>
            <span className={`status status-${run.status}`}>{run.status}</span>
          </div>
          <div className="resultActions">
            <button className="secondaryButton" disabled={run.status !== "succeeded"} onClick={saveLatestRun} type="button">
              Save Analysis
            </button>
            <a className="secondaryButton linkButton" href="/history">
              Open History
            </a>
          </div>
          {saveMessage ? <p className="schemaNote">{saveMessage}</p> : null}
          {run.error ? <p className="result error">{run.error}</p> : null}
          {run.result ? <AgentResult agentId={run.agentId} result={run.result} /> : null}
        </section>
      ) : null}
    </div>
  );
}

function ExampleInputs({ examples, onSelect }: { examples: InputExample[]; onSelect: (example: InputExample) => void }) {
  return (
    <section className="inputExamples" aria-label="Example inputs">
      <div className="inputExamplesTop">
        <span>Example inputs</span>
        <strong>{examples.length} presets</strong>
      </div>
      <div className="inputExampleGrid">
        {examples.map((example) => (
          <button className="inputExampleCard" key={example.name} onClick={() => onSelect(example)} type="button">
            <strong>{example.name}</strong>
            <span>{example.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function RunTaskSummary({ selected }: { selected: CatalogItem }) {
  const key = taskKey(selected);
  const copy =
    key === "market-data:snapshot"
      ? { label: "Market data", text: "Fetches live candles and returns trend, volatility, range, and chart-ready OHLC data." }
      : key === "risk:evaluate"
        ? { label: "Risk gate", text: "Tests a proposed market snapshot against spread, liquidity, volatility, EV, and recent-loss thresholds." }
        : key === "strategy-research:propose"
          ? { label: "Strategy decision", text: "Combines market, risk, selected indicators, and backtest evidence into a promote/reject/observe proposal." }
          : key === "strategy-research:strategy_sweep"
            ? { label: "Strategy lab", text: "Runs or simulates a parameter sweep across assets, strategies, fees, slippage, and candle windows." }
            : key === "event-analysis:event_study"
              ? { label: "Event study", text: "Compares a current event with historical analogs and returns cross-asset impact, timing risk, and trade guidance." }
            : { label: "Custom payload", text: "Use the JSON payload drawer for this task." };

  return (
    <section className="runTaskSummary">
      <span>{copy.label}</span>
      <p>{copy.text}</p>
    </section>
  );
}

function GuidedPayloadBuilder({
  selected,
  payload,
  setPayload,
}: {
  selected: CatalogItem;
  payload: Record<string, unknown>;
  setPayload: (payload: Record<string, unknown>) => void;
}) {
  const key = taskKey(selected);
  if (key === "market-data:snapshot") {
    return <MarketSnapshotBuilder payload={payload} setPayload={setPayload} schema={selected.paramsSchema} />;
  }
  if (key === "risk:evaluate") {
    return <RiskEvaluationBuilder payload={payload} setPayload={setPayload} />;
  }
  if (key === "strategy-research:propose") {
    return <StrategyProposalBuilder payload={payload} setPayload={setPayload} />;
  }
  if (key === "strategy-research:strategy_sweep") {
    return <StrategySweepBuilder payload={payload} setPayload={setPayload} />;
  }
  if (key === "event-analysis:event_study") {
    return <EventStudyBuilder payload={payload} setPayload={setPayload} />;
  }
  return <ParameterForm schema={selected.paramsSchema} payload={payload} setPayload={setPayload} jsonPayload="" setJsonPayload={() => undefined} />;
}

function MarketSnapshotBuilder({
  payload,
  setPayload,
  schema,
}: {
  payload: Record<string, unknown>;
  setPayload: (payload: Record<string, unknown>) => void;
  schema: Record<string, unknown>;
}) {
  const selectedIndicators = asStringArray(payload.indicators);
  return (
    <section className="guidedPanel">
      <div className="guidedPanelTop">
        <div>
          <span>Market request</span>
          <strong>Live candle snapshot</strong>
        </div>
      </div>
      <div className="paramGrid">
        <SelectField label="Asset" value={String(payload.asset ?? "BTC")} options={MARKET_DATA_ASSET_OPTIONS} onChange={(asset) => setPayload({ ...payload, asset })} />
        <SelectField
          label="Candle size"
          value={String(payload.granularity ?? 60)}
          options={GRANULARITY_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))}
          onChange={(granularity) => setPayload({ ...payload, granularity: Number(granularity) })}
        />
        <NumberField label="Candles" value={numberValue(payload.limit, 120)} min={10} max={300} onChange={(limit) => setPayload({ ...payload, limit })} />
      </div>
      <CheckboxGroup
        label="Indicators to inspect"
        options={INDICATOR_OPTIONS}
        values={selectedIndicators}
        onChange={(indicators) => setPayload({ ...payload, indicators })}
      />
      <ParameterSchemaNote schema={schema} />
    </section>
  );
}

function RiskEvaluationBuilder({ payload, setPayload }: { payload: Record<string, unknown>; setPayload: (payload: Record<string, unknown>) => void }) {
  const snapshot = asRecord(payload.snapshot) || payload;
  const volatility = asRecord(snapshot.volatility);
  const thresholds = asRecord(payload.thresholds) ?? THRESHOLD_PRESETS.default;
  const updateSnapshot = (next: Record<string, unknown>) => setPayload({ ...payload, snapshot: { ...snapshot, ...next } });
  const updateVolatility = (next: Record<string, unknown>) => updateSnapshot({ volatility: { ...volatility, ...next } });

  return (
    <section className="guidedPanel">
      <div className="guidedPanelTop">
        <div>
          <span>Risk inputs</span>
          <strong>Market snapshot + veto thresholds</strong>
        </div>
      </div>
      <div className="paramGrid">
        <SelectField label="Asset or pair" value={String(snapshot.asset ?? "BTC-USD")} options={ASSET_OPTIONS} onChange={(asset) => updateSnapshot({ asset })} />
        <SelectField label="Trend" value={String(snapshot.trend ?? "up")} options={TREND_OPTIONS} onChange={(trend) => updateSnapshot({ trend })} />
        <SelectField label="Volatility" value={String(volatility.level ?? "low")} options={VOLATILITY_OPTIONS} onChange={(level) => updateVolatility({ level })} />
        <NumberField label="Severity x" value={numberValue(volatility.severityX, 1)} step={0.01} onChange={(severityX) => updateVolatility({ severityX })} />
        <NumberField label="Range %" value={numberValue(volatility.rangePct, 0.05)} step={0.001} onChange={(rangePct) => updateVolatility({ rangePct })} />
        <NumberField label="Fast move x" value={numberValue(volatility.fastMoveX, 1.2)} step={0.1} onChange={(fastMoveX) => updateVolatility({ fastMoveX })} />
        <NumberField label="Spread %" value={numberValue(snapshot.spreadPct, 0.5)} step={0.01} onChange={(spreadPct) => updateSnapshot({ spreadPct })} />
        <NumberField label="Liquidity USDC" value={numberValue(snapshot.liquidityUsdc, 1000)} step={10} onChange={(liquidityUsdc) => updateSnapshot({ liquidityUsdc })} />
        <NumberField label="Recent losses" value={numberValue(snapshot.recentLosses, 1)} step={1} onChange={(recentLosses) => updateSnapshot({ recentLosses })} />
        <NumberField label="EV %" value={numberValue(snapshot.evPct, 0.6)} step={0.01} onChange={(evPct) => updateSnapshot({ evPct })} />
        <SelectField
          label="Threshold preset"
          value={thresholdPresetName(thresholds)}
          options={[
            { value: "default", label: "Default" },
            { value: "strict", label: "Strict" },
            { value: "loose", label: "Loose" },
            { value: "custom", label: "Custom" },
          ]}
          onChange={(name) =>
            name === "custom" ? undefined : setPayload({ ...payload, snapshot, thresholds: THRESHOLD_PRESETS[name as keyof typeof THRESHOLD_PRESETS] })
          }
        />
      </div>
    </section>
  );
}

function StrategyProposalBuilder({ payload, setPayload }: { payload: Record<string, unknown>; setPayload: (payload: Record<string, unknown>) => void }) {
  const marketSnapshot = asRecord(payload.marketSnapshot);
  const riskCheck = asRecord(payload.riskCheck);
  const backtestResult = asRecord(payload.backtestResult);
  const portfolio = asRecord(backtestResult.portfolio) ?? backtestResult;
  const updateMarket = (next: Record<string, unknown>) => setPayload({ ...payload, marketSnapshot: { ...marketSnapshot, ...next } });
  const updateRisk = (next: Record<string, unknown>) => setPayload({ ...payload, riskCheck: { ...riskCheck, ...next } });
  const updatePortfolio = (next: Record<string, unknown>) =>
    setPayload({ ...payload, backtestResult: { ...backtestResult, portfolio: { ...portfolio, ...next } } });

  return (
    <section className="guidedPanel">
      <div className="guidedPanelTop">
        <div>
          <span>Proposal inputs</span>
          <strong>Market + risk + evidence</strong>
        </div>
      </div>
      <div className="formSectionTitle">Market context</div>
      <div className="paramGrid">
        <SelectField label="Asset or pair" value={String(marketSnapshot.asset ?? "BTC-USD")} options={ASSET_OPTIONS} onChange={(asset) => updateMarket({ asset })} />
        <SelectField label="Trend" value={String(marketSnapshot.trend ?? "up")} options={TREND_OPTIONS} onChange={(trend) => updateMarket({ trend })} />
        <SelectField
          label="Volatility"
          value={String(asRecord(marketSnapshot.volatility).level ?? "low")}
          options={VOLATILITY_OPTIONS}
          onChange={(level) => updateMarket({ volatility: { ...asRecord(marketSnapshot.volatility), level } })}
        />
        <SelectField label="Risk level" value={String(riskCheck.riskLevel ?? "low")} options={RISK_LEVEL_OPTIONS} onChange={(riskLevel) => updateRisk({ riskLevel })} />
        <SelectField
          label="Risk passed"
          value={String(riskCheck.passed ?? true)}
          options={[
            { value: "true", label: "Passed" },
            { value: "false", label: "Vetoed" },
          ]}
          onChange={(passed) => updateRisk({ passed: passed === "true" })}
        />
        <NumberField label="Risk score" value={numberValue(riskCheck.riskScore, 20)} step={0.1} onChange={(riskScore) => updateRisk({ riskScore })} />
      </div>
      <CheckboxGroup
        label="Indicators"
        options={INDICATOR_OPTIONS}
        values={asStringArray(payload.indicators)}
        onChange={(indicators) => setPayload({ ...payload, indicators })}
      />
      <CheckboxGroup
        label="Candidate strategies"
        options={STRATEGY_OPTIONS}
        values={asStringArray(payload.strategies)}
        onChange={(strategies) => setPayload({ ...payload, strategies })}
      />
      <div className="formSectionTitle">Backtest evidence</div>
      <div className="paramGrid">
        <NumberField label="PnL" value={numberValue(portfolio.pnl, 25)} step={0.1} onChange={(pnl) => updatePortfolio({ pnl })} />
        <NumberField label="Return %" value={numberValue(portfolio.returnPct, 2.5)} step={0.1} onChange={(returnPct) => updatePortfolio({ returnPct })} />
        <NumberField label="Max drawdown %" value={numberValue(portfolio.maxDrawdownPct, -1.4)} step={0.1} onChange={(maxDrawdownPct) => updatePortfolio({ maxDrawdownPct })} />
        <NumberField label="Trades" value={numberValue(portfolio.trades, 40)} step={1} onChange={(trades) => updatePortfolio({ trades })} />
        <NumberField label="Win rate" value={numberValue(portfolio.winRate, 0.58)} step={0.01} onChange={(winRate) => updatePortfolio({ winRate })} />
      </div>
    </section>
  );
}

function StrategySweepBuilder({ payload, setPayload }: { payload: Record<string, unknown>; setPayload: (payload: Record<string, unknown>) => void }) {
  return (
    <section className="guidedPanel">
      <div className="guidedPanelTop">
        <div>
          <span>Sweep inputs</span>
          <strong>Backtest settings + strategy basket</strong>
        </div>
      </div>
      <div className="paramGrid">
        <SelectField
          label="Mode"
          value={String(payload.runBacktest ?? true)}
          options={[
            { value: "true", label: "Run Strategy Lab" },
            { value: "false", label: "Use supplied evidence" },
          ]}
          onChange={(runBacktest) => setPayload({ ...payload, runBacktest: runBacktest === "true" })}
        />
        <NumberField label="Days" value={numberValue(payload.days, 2)} min={1} max={14} step={1} onChange={(days) => setPayload({ ...payload, days })} />
        <SelectField
          label="Candle size"
          value={String(payload.granularity ?? 300)}
          options={GRANULARITY_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))}
          onChange={(granularity) => setPayload({ ...payload, granularity: Number(granularity) })}
        />
        <NumberField label="Starting cash" value={numberValue(payload.startingCash, 1000)} step={100} onChange={(startingCash) => setPayload({ ...payload, startingCash })} />
        <NumberField label="Fee bps" value={numberValue(payload.feeBps, 6)} step={1} onChange={(feeBps) => setPayload({ ...payload, feeBps })} />
        <NumberField label="Slippage bps" value={numberValue(payload.slippageBps, 2)} step={1} onChange={(slippageBps) => setPayload({ ...payload, slippageBps })} />
        <SelectField
          label="Payout mode"
          value={String(payload.payoutMode ?? "binary_polymarket")}
          options={[
            { value: "binary_polymarket", label: "Binary Polymarket" },
            { value: "spot_directional", label: "Spot Directional" },
          ]}
          onChange={(payoutMode) => setPayload({ ...payload, payoutMode })}
        />
      </div>
      <CheckboxGroup
        label="Assets"
        options={MARKET_DATA_ASSET_OPTIONS}
        values={asStringArray(payload.assets).length ? asStringArray(payload.assets) : ["BTC", "ETH"]}
        onChange={(assets) => setPayload({ ...payload, assets })}
      />
      <CheckboxGroup
        label="Strategies"
        options={STRATEGY_OPTIONS}
        values={asStringArray(payload.strategies).length ? asStringArray(payload.strategies) : ["market_favorite_90", "market_favorite_95"]}
        onChange={(strategies) => setPayload({ ...payload, strategies })}
      />
      <CheckboxGroup
        label="Indicators to report"
        options={INDICATOR_OPTIONS}
        values={asStringArray(payload.indicators)}
        onChange={(indicators) => setPayload({ ...payload, indicators })}
      />
    </section>
  );
}

function EventStudyBuilder({ payload, setPayload }: { payload: Record<string, unknown>; setPayload: (payload: Record<string, unknown>) => void }) {
  const currentEvent = asRecord(payload.currentEvent).title ? asRecord(payload.currentEvent) : payload;
  const assetClasses = asStringArray(currentEvent.assetClasses);
  const affectedAssets = asStringArray(currentEvent.affectedAssets);
  const updateEvent = (next: Record<string, unknown>) => setPayload({ ...payload, currentEvent: { ...currentEvent, ...next } });

  return (
    <section className="guidedPanel">
      <div className="guidedPanelTop">
        <div>
          <span>Event-study inputs</span>
          <strong>Current event + comparable history</strong>
        </div>
      </div>
      <div className="paramGrid">
        <label>
          Event title
          <input
            onChange={(event) => updateEvent({ title: event.target.value })}
            type="text"
            value={String(currentEvent.title ?? "US CPI came in hotter than forecast")}
          />
        </label>
        <SelectField
          label="Event type"
          value={String(currentEvent.eventType ?? "cpi")}
          options={EVENT_TYPE_OPTIONS}
          onChange={(eventType) => updateEvent({ eventType })}
        />
        <SelectField
          label="Importance"
          value={String(currentEvent.importance ?? "high")}
          options={IMPORTANCE_OPTIONS}
          onChange={(importance) => updateEvent({ importance })}
        />
        <SelectField
          label="Surprise"
          value={String(currentEvent.surpriseDirection ?? "hot")}
          options={SURPRISE_OPTIONS}
          onChange={(surpriseDirection) => updateEvent({ surpriseDirection })}
        />
        <label>
          Actual
          <input onChange={(event) => updateEvent({ actual: event.target.value })} type="text" value={String(currentEvent.actual ?? "")} />
        </label>
        <label>
          Forecast
          <input onChange={(event) => updateEvent({ forecast: event.target.value })} type="text" value={String(currentEvent.forecast ?? "")} />
        </label>
        <label>
          Previous
          <input onChange={(event) => updateEvent({ previous: event.target.value })} type="text" value={String(currentEvent.previous ?? "")} />
        </label>
        <label>
          Time window
          <input
            onChange={(event) => updateEvent({ timeWindow: event.target.value })}
            type="text"
            value={String(currentEvent.timeWindow ?? "next 0-24h")}
          />
        </label>
      </div>
      <CheckboxGroup
        label="Asset classes"
        options={EVENT_ASSET_CLASS_OPTIONS}
        values={assetClasses.length ? assetClasses : ["forex", "stocks", "crypto"]}
        onChange={(nextAssetClasses) => updateEvent({ assetClasses: nextAssetClasses })}
      />
      <CheckboxGroup
        label="Affected markets"
        options={["USD", "DXY", "EUR/USD", "GBP/USD", "USD/JPY", "SPY", "QQQ", "NVDA", "BTC", "ETH", "SOL", "COIN", "MSTR"]}
        values={affectedAssets.length ? affectedAssets : ["USD", "DXY", "EUR/USD", "USD/JPY", "QQQ", "BTC"]}
        onChange={(nextAffectedAssets) => updateEvent({ affectedAssets: nextAffectedAssets })}
      />
      <p className="schemaNote">The agent compares this event to built-in macro, earnings, and crypto historical templates. Add custom historicalEvents in Advanced JSON when needed.</p>
    </section>
  );
}

function ParameterForm({
  schema,
  payload,
  setPayload,
  jsonPayload,
  setJsonPayload,
}: {
  schema: Record<string, unknown>;
  payload: Record<string, unknown>;
  setPayload: (payload: Record<string, unknown>) => void;
  jsonPayload: string;
  setJsonPayload: (payload: string) => void;
}) {
  if (!isSimpleSchema(schema)) {
    return <textarea className="jsonTextarea" value={jsonPayload} onChange={(event) => setJsonPayload(event.target.value)} rows={8} />;
  }
  const properties = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
  return (
    <div className="paramGrid">
      {Object.entries(properties).map(([name, config]) => {
        const options = Array.isArray(config.enum) ? config.enum : null;
        return (
          <label key={name}>
            {name}
            {options ? (
              <select value={String(payload[name] ?? "")} onChange={(event) => setPayload({ ...payload, [name]: coerce(event.target.value, config.type) })}>
                {options.map((option) => (
                  <option key={String(option)} value={String(option)}>
                    {String(option)}
                  </option>
                ))}
              </select>
            ) : (
              <input
                max={typeof config.maximum === "number" ? config.maximum : undefined}
                min={typeof config.minimum === "number" ? config.minimum : undefined}
                onChange={(event) => setPayload({ ...payload, [name]: coerce(event.target.value, config.type) })}
                type={config.type === "integer" ? "number" : "text"}
                value={String(payload[name] ?? "")}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<string | { value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const normalized = typeof option === "string" ? { value: option, label: option } : option;
          return (
            <option key={normalized.value} value={normalized.value}>
              {normalized.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <input max={max} min={min} step={step} type="number" value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function CheckboxGroup({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: Array<string | { value: string; label: string }>;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const normalizedOptions = options.map((option) => (typeof option === "string" ? { value: option, label: option } : option));
  return (
    <fieldset className="checkboxPanel">
      <legend>{label}</legend>
      <div>
        {normalizedOptions.map((option) => {
          const checked = values.includes(option.value);
          return (
            <label className={checked ? "checked" : ""} key={option.value}>
              <input
                checked={checked}
                onChange={() => onChange(checked ? values.filter((value) => value !== option.value) : [...values, option.value])}
                type="checkbox"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ParameterSchemaNote({ schema }: { schema: Record<string, unknown> }) {
  if (!isSimpleSchema(schema)) {
    return null;
  }
  const required = Array.isArray(schema.required) ? schema.required.map(String) : [];
  if (!required.length) {
    return null;
  }
  return <p className="schemaNote">Required by API: {required.join(", ")}</p>;
}

function examplesFor(item?: CatalogItem): InputExample[] {
  if (!item) {
    return [];
  }
  return INPUT_EXAMPLES[`${item.agentId}:${item.task}`] ?? [];
}

function taskKey(item: CatalogItem) {
  return `${item.agentId}:${item.task}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function numberValue(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function thresholdPresetName(thresholds: Record<string, unknown>) {
  const serialized = JSON.stringify(thresholds);
  const match = Object.entries(THRESHOLD_PRESETS).find(([, preset]) => JSON.stringify(preset) === serialized);
  return match?.[0] ?? "custom";
}

function isSimpleSchema(schema: Record<string, unknown>): schema is { properties?: Record<string, Record<string, unknown>>; required?: unknown[] } {
  return schema.type === "object" && typeof schema.properties === "object" && schema.properties !== null;
}

function buildDefaults(schema: Record<string, unknown>) {
  if (!isSimpleSchema(schema)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(schema.properties ?? {}).map(([name, config]) => {
      const options = Array.isArray(config.enum) ? config.enum : null;
      return [name, options?.[0] ?? (config.type === "integer" ? config.minimum ?? 10 : "")];
    }),
  );
}

function coerce(value: string, type: unknown) {
  return type === "integer" ? Number(value) : value;
}
