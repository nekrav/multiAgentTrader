"use client";

import { CSSProperties, FormEvent, useMemo, useState } from "react";

export type Agent = {
  id: string;
  name: string;
  description: string;
  canExecuteOrders: boolean;
  endpointConfigured: boolean;
};

type InvocationState = {
  loading: boolean;
  error?: string;
  result?: unknown;
};

type PairParts = {
  pair: string;
  base: string;
  quote: string;
  asset: string;
};

const DEFAULT_PAIR = "USD/BTC";

const POPULAR_MARKET_PAIRS = [
  "USD/BTC",
  "USD/ETH",
  "USD/SOL",
  "USD/BNB",
  "USD/XRP",
  "USD/USDT",
  "USD/USDC",
  "USD/DOGE",
  "USD/ADA",
  "USD/TRX",
  "USD/AVAX",
  "USD/LINK",
  "USD/DOT",
  "BTC/USD",
  "ETH/USD",
  "EUR/USD",
  "USD/EUR",
  "GBP/USD",
  "USD/GBP",
  "USD/JPY",
  "USD/CHF",
  "USD/CAD",
  "AUD/USD",
  "USD/AUD",
  "NZD/USD",
  "USD/MXN",
  "USD/CNH",
  "USD/SEK",
  "USD/NOK",
  "USD/SGD",
  "USD/HKD",
  "USD/ZAR",
  "USD/BRL",
];

const TASK_BY_AGENT: Record<string, string> = {
  "market-data": "snapshot",
  "strategy-research": "research",
  "event-analysis": "event_study",
  risk: "risk_check",
  execution: "execute_dry_run",
  "post-trade-review": "review",
};

export function AgentsDashboard({ agents }: { agents: Agent[] }) {
  const initialPairs = useMemo(
    () => Object.fromEntries(agents.map((agent) => [agent.id, DEFAULT_PAIR])) as Record<string, string>,
    [agents],
  );
  const [pairs, setPairs] = useState<Record<string, string>>(initialPairs);
  const [invocations, setInvocations] = useState<Record<string, InvocationState>>({});

  async function runAgent(agent: Agent, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parts = parsePair(pairs[agent.id] ?? DEFAULT_PAIR);
    const task = TASK_BY_AGENT[agent.id] ?? "run";

    setInvocations((current) => ({
      ...current,
      [agent.id]: { loading: true },
    }));

    try {
      const response = await fetch(`${apiUrl()}/agents/${agent.id}/invoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task,
          payload: buildPayload(agent.id, parts),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) {
        throw new Error(`Agent returned HTTP ${response.status}`);
      }
      setInvocations((current) => ({
        ...current,
        [agent.id]: { loading: false, result },
      }));
    } catch (error) {
      setInvocations((current) => ({
        ...current,
        [agent.id]: {
          loading: false,
          error: error instanceof Error ? error.message : "Agent invocation failed.",
        },
      }));
    }
  }

  return (
    <>
      {agents.map((agent) => {
        const invocation = invocations[agent.id];
        return (
          <article className="agent" key={agent.id}>
            <div className="agentTop">
              <h2>{agent.name}</h2>
              <span className={agent.endpointConfigured ? "status on" : "status off"}>
                {agent.endpointConfigured ? "Connected" : "Unconfigured"}
              </span>
            </div>
            <p>{agent.description}</p>

            <form className="invokeForm" onSubmit={(event) => runAgent(agent, event)}>
              <label htmlFor={`${agent.id}-pair`}>Market pair</label>
              <div className="invokeRow">
                <input
                  id={`${agent.id}-pair`}
                  list={`${agent.id}-popular-pairs`}
                  name="pair"
                  value={pairs[agent.id] ?? DEFAULT_PAIR}
                  placeholder="USD/BTC"
                  onChange={(event) =>
                    setPairs((current) => ({
                      ...current,
                      [agent.id]: event.target.value.toUpperCase(),
                    }))
                  }
                />
                <datalist id={`${agent.id}-popular-pairs`}>
                  {POPULAR_MARKET_PAIRS.map((pair) => (
                    <option key={`${agent.id}-${pair}`} value={pair} />
                  ))}
                </datalist>
                <button disabled={!agent.endpointConfigured || invocation?.loading} type="submit">
                  {invocation?.loading ? "Running" : "Run"}
                </button>
              </div>
            </form>

            {invocation?.error ? <div className="result error">{invocation.error}</div> : null}
            {invocation?.result ? <AgentResult agentId={agent.id} result={invocation.result} /> : null}

            <div className="meta">
              <span>{agent.id}</span>
              <span>{agent.canExecuteOrders ? "Execution gated" : "Advisory only"}</span>
            </div>
          </article>
        );
      })}
    </>
  );
}

function apiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function parsePair(rawPair: string): PairParts {
  const pair = rawPair.trim().toUpperCase() || DEFAULT_PAIR;
  const [first = "USD", second = "BTC"] = pair.split(/[/-]/).map((part) => part.trim()).filter(Boolean);
  const base = first;
  const quote = second;
  const asset = base === "USD" && quote ? quote : base;
  return { pair, base, quote, asset };
}

function buildPayload(agentId: string, parts: PairParts) {
  const common = {
    pair: parts.pair,
    base: parts.base,
    quote: parts.quote,
    asset: parts.asset,
  };

  if (agentId === "market-data") {
    return {
      ...common,
      granularity: 60,
      limit: 120,
    };
  }

  if (agentId === "strategy-research") {
    return {
      ...common,
      marketSnapshot: { asset: parts.asset, pair: parts.pair },
      riskCheck: { passed: true, riskLevel: "unknown" },
    };
  }

  if (agentId === "risk") {
    return {
      ...common,
      volatility: {},
    };
  }

  if (agentId === "event-analysis") {
    return {
      currentEvent: {
        title: `${parts.pair} macro and market event scan`,
        eventType: parts.asset === "BTC" || parts.asset === "ETH" ? "crypto_etf" : "cpi",
        assetClasses: inferPayloadAssetClasses(parts),
        affectedAssets: [parts.base, parts.quote, parts.pair, parts.asset],
        importance: "high",
        surpriseDirection: "unknown",
        actual: "latest market catalyst",
        forecast: "baseline expectation",
        previous: "prior comparable reaction",
        timeWindow: "next 0-24h",
      },
    };
  }

  return common;
}

function inferPayloadAssetClasses(parts: PairParts) {
  const assets = [parts.base, parts.quote, parts.asset].join(" ");
  const classes: string[] = [];
  if (/\b(USD|EUR|GBP|JPY|AUD|CAD|CHF|NZD)\b/.test(assets)) {
    classes.push("forex");
  }
  if (/\b(SPY|QQQ|NVDA|AAPL|MSFT|TSLA)\b/.test(assets)) {
    classes.push("stocks");
  }
  if (/\b(BTC|ETH|SOL|BNB|XRP|DOGE|ADA|AVAX)\b/.test(assets)) {
    classes.push("crypto");
  }
  return classes.length > 0 ? classes : ["forex", "stocks", "crypto"];
}

export function AgentResult({ agentId, result }: { agentId: string; result: unknown }) {
  const body = unwrapResult(result);

  if (agentId === "market-data") {
    return <MarketDataResult result={body} raw={result} />;
  }

  if (agentId === "risk") {
    return <RiskResult result={body} raw={result} />;
  }

  if (agentId === "strategy-research") {
    return <StrategyResult result={body} raw={result} />;
  }

  if (agentId === "event-analysis") {
    return <EventAnalysisResult result={body} raw={result} />;
  }

  return <GenericResult result={body} raw={result} />;
}

function MarketDataResult({ result, raw }: { result: Record<string, unknown>; raw: unknown }) {
  const volatility = objectAt(result, "volatility");
  const latestCandle = objectAt(result, "latestCandle");
  const series = candleSeriesFromResult(result, latestCandle);
  const severity = numberAt(volatility, "severityX");
  const fastMove = numberAt(volatility, "fastMoveX");
  const range = numberAt(volatility, "rangePct");
  const latestReturn = numberAt(latestCandle, "returnPct");
  const trend = textAt(result, "trend", "unknown");

  return (
    <section className="resultPanel">
      <ResultHeader
        title={`${textAt(result, "asset", "Market")} snapshot`}
        tone={toneForLevel(textAt(volatility, "level", "unknown"))}
        label={textAt(volatility, "level", "unknown")}
      />
      <div className="metrics">
        <Metric label="Spot" value={formatCurrency(numberAt(result, "spotPrice"))} />
        <Metric label="Trend" value={trend} />
        <Metric label="Latest return" value={formatSignedPercent(latestReturn)} />
        <Metric label="Candles" value={String(numberAt(result, "candles") ?? "-")} />
      </div>
      <div className="marketResultGrid">
        <PriceLineChart series={series} trend={trend} />
        <CandlestickChart series={series} />
      </div>
      <div className="marketDataTableWrap">
        <table className="marketDataTable">
          <caption>Latest candle</caption>
          <thead>
            <tr>
              <th>Time</th>
              <th>Open</th>
              <th>High</th>
              <th>Low</th>
              <th>Close</th>
              <th>Range</th>
              <th>Return</th>
              <th>Volume</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{formatTime(numberAt(latestCandle, "time"))}</td>
              <td>{formatCurrency(numberAt(latestCandle, "open"))}</td>
              <td>{formatCurrency(numberAt(latestCandle, "high"))}</td>
              <td>{formatCurrency(numberAt(latestCandle, "low"))}</td>
              <td>{formatCurrency(numberAt(latestCandle, "close"))}</td>
              <td>{formatPercent(range)}</td>
              <td>{formatSignedPercent(latestReturn)}</td>
              <td>{formatNumber(numberAt(latestCandle, "volume"))}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="volatilityGrid">
        <VolatilityStrip series={series} />
        <div className="chartStack">
          <Bar label="Volatility severity" value={severity} max={3} tone={toneForNumber(severity, 1.2, 2)} suffix="x" />
          <Bar label="Fast move" value={fastMove} max={5} tone={toneForNumber(fastMove, 2.5, 4)} suffix="x" />
          <Bar label="Latest candle range" value={range} max={0.5} tone={toneForNumber(range, 0.12, 0.25)} suffix="%" />
        </div>
      </div>
      <RawDetails raw={raw} />
    </section>
  );
}

type CandlePoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rangePct: number;
  returnPct: number;
};

function PriceLineChart({ series, trend }: { series: CandlePoint[]; trend: string }) {
  const points = scaleSeries(series, (item) => item.close);
  const first = series[0]?.close;
  const last = series.at(-1)?.close;
  const move = first && last ? ((last - first) / first) * 100 : undefined;
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const positive = (move ?? 0) >= 0;

  return (
    <article className="marketChart priceChartCard">
      <div className="chartTitleRow">
        <div>
          <span>Close path</span>
          <strong>{formatSignedPercent(move)}</strong>
        </div>
        <b className={positive ? "chartSignal good" : "chartSignal bad"}>{trend}</b>
      </div>
      <svg className="marketLineChart" viewBox="0 0 100 52" preserveAspectRatio="none" role="img" aria-label="Recent close price path">
        <path className="lineChartGrid" d="M0 12 H100 M0 26 H100 M0 40 H100" />
        {path ? <path className={positive ? "lineChartPath good" : "lineChartPath bad"} d={path} /> : null}
      </svg>
      <div className="chartFooter">
        <span>{formatCurrency(first)}</span>
        <span>{formatCurrency(last)}</span>
      </div>
    </article>
  );
}

function CandlestickChart({ series }: { series: CandlePoint[] }) {
  const candles = scaleCandles(series.slice(-24));
  return (
    <article className="marketChart">
      <div className="chartTitleRow">
        <div>
          <span>OHLC structure</span>
          <strong>{series.length ? `${Math.min(series.length, 24)} recent candles` : "No candles"}</strong>
        </div>
      </div>
      <svg className="candlestickChart" viewBox="0 0 120 58" preserveAspectRatio="none" role="img" aria-label="Recent candlestick chart">
        <path className="lineChartGrid" d="M0 12 H120 M0 29 H120 M0 46 H120" />
        {candles.map((candle) => (
          <g className={candle.close >= candle.open ? "candleUp" : "candleDown"} key={`${candle.time}-${candle.x}`}>
            <line x1={candle.x} x2={candle.x} y1={candle.highY} y2={candle.lowY} />
            <rect
              x={candle.x - candle.width / 2}
              y={Math.min(candle.openY, candle.closeY)}
              width={candle.width}
              height={Math.max(1.1, Math.abs(candle.closeY - candle.openY))}
              rx="0.8"
            />
          </g>
        ))}
      </svg>
      <div className="chartFooter">
        <span>{formatTime(series.at(-24)?.time)}</span>
        <span>{formatTime(series.at(-1)?.time)}</span>
      </div>
    </article>
  );
}

function VolatilityStrip({ series }: { series: CandlePoint[] }) {
  const recent = series.slice(-30);
  const maxRange = Math.max(0.0001, ...recent.map((item) => item.rangePct));
  return (
    <article className="marketChart volatilityStripCard">
      <div className="chartTitleRow">
        <div>
          <span>Volatility tape</span>
          <strong>Range per candle</strong>
        </div>
      </div>
      <div className="volatilityStrip" aria-label="Recent candle volatility range">
        {recent.map((item) => (
          <span
            className={toneForNumber(item.rangePct, maxRange * 0.5, maxRange * 0.78)}
            key={`${item.time}-${item.rangePct}`}
            title={`${formatTime(item.time)} ${formatPercent(item.rangePct)}`}
            style={{ "--vol-height": `${Math.max(8, (item.rangePct / maxRange) * 100)}%` } as CSSProperties}
          />
        ))}
      </div>
    </article>
  );
}

function RiskResult({ result, raw }: { result: Record<string, unknown>; raw: unknown }) {
  const score = numberAt(result, "riskScore");
  const passed = booleanAt(result, "passed");
  const vetoes = arrayAt(result, "vetoes");
  const warnings = arrayAt(result, "warnings");
  const tone = passed ? "good" : "bad";

  return (
    <section className="resultPanel">
      <ResultHeader title={passed ? "Risk check passed" : "Risk vetoed"} tone={tone} label={textAt(result, "riskLevel", "unknown")} />
      <div className="metrics">
        <Metric label="Risk score" value={formatNumber(score)} />
        <Metric label="Risk level" value={textAt(result, "riskLevel", "unknown")} />
        <Metric label="Vetoes" value={String(vetoes.length)} />
      </div>
      <Bar label="Risk score" value={score} max={100} tone={toneForNumber(score, 35, 70)} />
      {vetoes.length > 0 ? <ListBlock title="Vetoes" items={vetoes} tone="bad" /> : null}
      {warnings.length > 0 ? <ListBlock title="Warnings" items={warnings} tone="warn" /> : null}
      {vetoes.length === 0 && warnings.length === 0 ? <p className="quietResult">No vetoes or warnings for this input.</p> : null}
      <RawDetails raw={raw} />
    </section>
  );
}

function StrategyResult({ result, raw }: { result: Record<string, unknown>; raw: unknown }) {
  const proposals = arrayAt(result, "proposals").filter(isRecord);
  const backtest = objectAt(result, "backtest");
  const details = objectAt(result, "backtestDetails");
  const strategyResults = arrayAt(details, "strategyResults").filter(isRecord).slice(0, 6);

  return (
    <section className="resultPanel">
      <ResultHeader title="Strategy research" tone={proposals.length > 0 ? "good" : "neutral"} label={`${proposals.length} proposal(s)`} />
      <p className="summaryText">{textAt(result, "summary", "No summary returned.")}</p>
      {Object.keys(backtest).length > 0 ? (
        <div className="metrics">
          <Metric label="Backtest return" value={formatSignedPercent(numberAt(backtest, "returnPct"))} />
          <Metric label="PnL" value={formatCurrency(numberAt(backtest, "pnl"))} />
          <Metric label="Trades" value={String(numberAt(backtest, "trades") ?? "-")} />
          <Metric label="Win rate" value={formatPercentValue(numberAt(backtest, "winRate"), 100)} />
        </div>
      ) : null}
      {strategyResults.length > 0 ? (
        <div className="proposalList">
          {strategyResults.map((row, index) => (
            <article className="proposal" key={`${textAt(row, "asset", "asset")}-${textAt(row, "strategy", "strategy")}-${index}`}>
              <div className="proposalTop">
                <strong>
                  {textAt(row, "asset", "Asset")} · {textAt(row, "strategy", "strategy").replaceAll("_", " ")}
                </strong>
                <span>{formatSignedPercent(numberAt(row, "returnPct"))}</span>
              </div>
              <div className="metrics compactMetrics">
                <Metric label="Trades" value={String(numberAt(row, "trades") ?? "-")} />
                <Metric label="Win rate" value={formatPercentValue(numberAt(row, "winRate"), 100)} />
                <Metric label="Drawdown" value={formatSignedPercent(numberAt(row, "maxDrawdownPct"))} />
              </div>
            </article>
          ))}
        </div>
      ) : null}
      <div className="proposalList">
        {proposals.map((proposal, index) => (
          <article className="proposal" key={`${textAt(proposal, "id", "proposal")}-${index}`}>
            <div className="proposalTop">
              <strong>{textAt(proposal, "action", "proposal").replaceAll("_", " ")}</strong>
              <span>{formatPercentValue(numberAt(proposal, "confidence"), 100)}</span>
            </div>
            <p>{textAt(proposal, "rationale", "No rationale returned.")}</p>
            <Bar label="Confidence" value={(numberAt(proposal, "confidence") ?? 0) * 100} max={100} tone="good" />
          </article>
        ))}
      </div>
      <RawDetails raw={raw} />
    </section>
  );
}

function EventAnalysisResult({ result, raw }: { result: Record<string, unknown>; raw: unknown }) {
  const currentEvent = objectAt(result, "currentEvent");
  const guidance = objectAt(result, "tradeGuidance");
  const impact = objectAt(result, "crossAssetImpact");
  const impactByAssetClass = objectAt(impact, "byAssetClass");
  const comparables = arrayAt(result, "comparableEvents").filter(isRecord);
  const controls = arrayAt(result, "riskControls");
  const upgrades = arrayAt(result, "agentUpgradeIdeas").filter(isRecord);
  const eventRisk = textAt(guidance, "eventRisk", "unknown");

  return (
    <section className="resultPanel">
      <ResultHeader title={textAt(currentEvent, "title", "Event study")} tone={toneForLevel(eventRisk)} label={eventRisk} />
      <p className="summaryText">{textAt(result, "summary", "No event summary returned.")}</p>

      <div className="metrics">
        <Metric label="Event type" value={textAt(currentEvent, "eventType", "unknown").replaceAll("_", " ")} />
        <Metric label="Importance" value={textAt(currentEvent, "importance", "unknown")} />
        <Metric label="Surprise" value={textAt(currentEvent, "surpriseDirection", "unknown").replaceAll("_", " ")} />
        <Metric label="Preferred action" value={textAt(guidance, "preferredAction", "unknown").replaceAll("_", " ")} />
      </div>

      <div className="proposalList">
        {comparables.map((event, index) => (
          <article className="proposal eventComparable" key={`${textAt(event, "title", "event")}-${index}`}>
            <div className="proposalTop">
              <strong>{textAt(event, "title", "Historical comparable")}</strong>
              <span>{formatPercentValue(numberAt(event, "similarity"), 100)}</span>
            </div>
            <p>{textAt(event, "typicalImpact", "No impact note returned.")}</p>
            <p>{textAt(event, "tradingLesson", "No trading lesson returned.")}</p>
            <div className="meta">
              <span>{textAt(event, "eventType", "event").replaceAll("_", " ")}</span>
              <span>{textAt(event, "volatilityWindow", "event window")}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="eventImpactGrid">
        <ListBlock
          title="Trade guidance"
          items={[
            textAt(guidance, "beforeEvent", "No before-event guidance returned."),
            textAt(guidance, "duringEvent", "No during-event guidance returned."),
            textAt(guidance, "afterEvent", "No after-event guidance returned."),
            textAt(guidance, "setupFilter", "No setup filter returned."),
          ]}
          tone={toneForLevel(eventRisk)}
        />
        <ListBlock
          title="Cross-asset impact"
          items={[
            `Forex: ${textAt(impactByAssetClass, "forex", "No forex impact returned.")}`,
            `Stocks: ${textAt(impactByAssetClass, "stocks", "No stocks impact returned.")}`,
            `Crypto: ${textAt(impactByAssetClass, "crypto", "No crypto impact returned.")}`,
          ]}
          tone="neutral"
        />
      </div>

      {controls.length > 0 ? <ListBlock title="Risk controls" items={controls} tone="warn" /> : null}

      {upgrades.length > 0 ? (
        <div className="proposalList">
          {upgrades.map((idea, index) => (
            <article className="proposal" key={`${textAt(idea, "agent", "agent")}-${index}`}>
              <div className="proposalTop">
                <strong>{textAt(idea, "agent", "Agent")}</strong>
                <span>upgrade</span>
              </div>
              <p>{textAt(idea, "role", "No role returned.")}</p>
            </article>
          ))}
        </div>
      ) : null}

      <RawDetails raw={raw} />
    </section>
  );
}

function GenericResult({ result, raw }: { result: Record<string, unknown>; raw: unknown }) {
  return (
    <section className="resultPanel">
      <ResultHeader title={textAt(result, "agentId", "Agent result")} tone="neutral" label={textAt(result, "status", "returned")} />
      <p className="summaryText">{textAt(result, "message", textAt(result, "role", "Agent completed the request."))}</p>
      <RawDetails raw={raw} startOpen />
    </section>
  );
}

function ResultHeader({ title, tone, label }: { title: string; tone: Tone; label: string }) {
  return (
    <div className="resultHeader">
      <h3>{title}</h3>
      <span className={`resultChip ${tone}`}>{label}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Bar({ label, value, max, tone, suffix = "" }: { label: string; value?: number; max: number; tone: Tone; suffix?: string }) {
  const numericValue = value ?? 0;
  const width = Math.max(0, Math.min(100, (numericValue / max) * 100));
  return (
    <div className="barBlock">
      <div className="barTop">
        <span>{label}</span>
        <strong>
          {formatNumber(value)}
          {suffix}
        </strong>
      </div>
      <div className="barTrack">
        <div className={`barFill ${tone}`} style={{ "--bar-width": `${width}%` } as CSSProperties} />
      </div>
    </div>
  );
}

function ListBlock({ title, items, tone }: { title: string; items: unknown[]; tone: Tone }) {
  return (
    <div className={`listBlock ${tone}`}>
      <strong>{title}</strong>
      <ul>
        {items.map((item, index) => (
          <li key={`${String(item)}-${index}`}>{String(item)}</li>
        ))}
      </ul>
    </div>
  );
}

function RawDetails({ raw, startOpen = false }: { raw: unknown; startOpen?: boolean }) {
  return (
    <details className="rawDetails" open={startOpen}>
      <summary>Raw response</summary>
      <pre>{JSON.stringify(raw, null, 2)}</pre>
    </details>
  );
}

type Tone = "good" | "warn" | "bad" | "neutral";

function unwrapResult(value: unknown): Record<string, unknown> {
  let current = value;
  while (isRecord(current) && isRecord(current.result)) {
    current = current.result;
  }
  return isRecord(current) ? current : {};
}

function objectAt(value: Record<string, unknown>, key: string): Record<string, unknown> {
  const nested = value[key];
  return isRecord(nested) ? nested : {};
}

function arrayAt(value: Record<string, unknown>, key: string): unknown[] {
  const nested = value[key];
  return Array.isArray(nested) ? nested : [];
}

function candleSeriesFromResult(result: Record<string, unknown>, latestCandle: Record<string, unknown>): CandlePoint[] {
  const parsed = arrayAt(result, "priceSeries").map(toCandlePoint).filter((item): item is CandlePoint => Boolean(item));
  const latest = toCandlePoint(latestCandle);
  if (parsed.length > 0) {
    return parsed;
  }
  return latest ? [latest] : [];
}

function toCandlePoint(value: unknown): CandlePoint | null {
  if (!isRecord(value)) {
    return null;
  }
  const time = numberAt(value, "time");
  const open = numberAt(value, "open");
  const high = numberAt(value, "high");
  const low = numberAt(value, "low");
  const close = numberAt(value, "close");
  if (time === undefined || open === undefined || high === undefined || low === undefined || close === undefined) {
    return null;
  }
  return {
    time,
    open,
    high,
    low,
    close,
    volume: numberAt(value, "volume") ?? 0,
    rangePct: numberAt(value, "rangePct") ?? 0,
    returnPct: numberAt(value, "returnPct") ?? 0,
  };
}

function scaleSeries(series: CandlePoint[], select: (item: CandlePoint) => number) {
  if (series.length === 0) {
    return [];
  }
  const values = series.map(select);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  return series.map((item, index) => ({
    x: series.length === 1 ? 50 : (index / (series.length - 1)) * 100,
    y: 46 - ((select(item) - min) / spread) * 40,
  }));
}

function scaleCandles(series: CandlePoint[]) {
  if (series.length === 0) {
    return [];
  }
  const min = Math.min(...series.map((item) => item.low));
  const max = Math.max(...series.map((item) => item.high));
  const spread = max - min || 1;
  const width = Math.max(1.6, Math.min(3.6, 72 / series.length));
  const y = (value: number) => 52 - ((value - min) / spread) * 46;
  return series.map((item, index) => ({
    ...item,
    x: series.length === 1 ? 60 : 5 + (index / (series.length - 1)) * 110,
    width,
    openY: y(item.open),
    highY: y(item.high),
    lowY: y(item.low),
    closeY: y(item.close),
  }));
}

function numberAt(value: Record<string, unknown>, key: string): number | undefined {
  const nested = value[key];
  return typeof nested === "number" && Number.isFinite(nested) ? nested : undefined;
}

function booleanAt(value: Record<string, unknown>, key: string): boolean | undefined {
  const nested = value[key];
  return typeof nested === "boolean" ? nested : undefined;
}

function textAt(value: Record<string, unknown>, key: string, fallback: string): string {
  const nested = value[key];
  return typeof nested === "string" && nested.length > 0 ? nested : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toneForLevel(level: string): Tone {
  if (level === "low" || level === "ok") {
    return "good";
  }
  if (level === "medium" || level === "unknown") {
    return "warn";
  }
  if (level === "high" || level === "error") {
    return "bad";
  }
  return "neutral";
}

function toneForNumber(value: number | undefined, warnAt: number, badAt: number): Tone {
  if (value === undefined) {
    return "neutral";
  }
  if (value >= badAt) {
    return "bad";
  }
  if (value >= warnAt) {
    return "warn";
  }
  return "good";
}

function formatCurrency(value: number | undefined): string {
  if (value === undefined) {
    return "-";
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 2 : 5,
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatPercent(value: number | undefined): string {
  if (value === undefined) {
    return "-";
  }
  return `${formatNumber(value)}%`;
}

function formatSignedPercent(value: number | undefined): string {
  if (value === undefined) {
    return "-";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value)}%`;
}

function formatPercentValue(value: number | undefined, multiplier = 1): string {
  if (value === undefined) {
    return "-";
  }
  return `${formatNumber(value * multiplier)}%`;
}

function formatTime(value: number | undefined): string {
  if (value === undefined) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value * 1000));
}

function formatNumber(value: number | undefined): string {
  if (value === undefined) {
    return "-";
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
}
