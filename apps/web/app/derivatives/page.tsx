import { TopNav } from "../top-nav";

type Bias =
  | "bullish"
  | "bearish"
  | "neutral"
  | "vol_expansion"
  | "vol_compression"
  | "curve_bullish"
  | "curve_bearish"
  | "mixed";

type AgentOutput = {
  market: string;
  timeframe: string;
  timestamp: string;
  agent_key: string;
  bias: Bias;
  confidence: string | number;
  score: string | number;
  summary: string;
  risk_flags_json: string[];
  features_json: Record<string, unknown>;
  model_version: string;
};

type FutureCurve = {
  underlying: string;
  timestamp: string;
  curve_json: Array<{ contract: string; price: number }>;
  front_contract: string;
  second_contract: string;
  third_contract: string;
  m1_price: string | number;
  m2_price: string | number;
  m3_price: string | number;
  m1_m2_spread: string | number;
  m2_m3_spread: string | number;
};

type OptionChainRow = {
  underlying: string;
  expiry: string;
  strike: string | number;
  option_type: "call" | "put";
  mid: string | number;
  volume: string | number;
  open_interest: string | number;
  implied_vol: string | number;
  delta: string | number;
};

type VolSurface = {
  underlying: string;
  timestamp: string;
  surface_json: Record<string, unknown>;
  atm_term_structure_json: Record<string, number>;
  skew_score: string | number;
  smile_curvature: string | number;
  iv_rank: string | number;
  iv_percentile: string | number;
};

type StrategyRecommendation = {
  underlying: string;
  timestamp: string;
  timeframe: string;
  strategy_family: string;
  confidence: string | number;
  rationale: string;
  risk_note: string;
  invalidation_note: string;
  features_json: Record<string, unknown>;
};

type DerivativesData = {
  clCurve: FutureCurve | null;
  clAgents: AgentOutput[];
  clConsensus: AgentOutput | null;
  gcCurve: FutureCurve | null;
  gcAgents: AgentOutput[];
  optionsChain: OptionChainRow[];
  optionsSurface: VolSurface | null;
  optionsAgents: AgentOutput[];
  optionStrategies: StrategyRecommendation[];
};

const emptyData: DerivativesData = {
  clCurve: null,
  clAgents: [],
  clConsensus: null,
  gcCurve: null,
  gcAgents: [],
  optionsChain: [],
  optionsSurface: null,
  optionsAgents: [],
  optionStrategies: [],
};

async function apiGet<T>(path: string): Promise<T | null> {
  const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const response = await fetch(`${apiUrl}${path}`, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function getDerivativesData(): Promise<DerivativesData> {
  const [clCurve, clAgents, clConsensus, gcCurve, gcAgents, optionsChain, optionsSurface, optionsAgents, optionStrategies] =
    await Promise.all([
      apiGet<FutureCurve>("/futures/CL/curve"),
      apiGet<AgentOutput[]>("/futures/CL/agents?timeframe=1H"),
      apiGet<AgentOutput>("/futures/CL/consensus?timeframe=1H"),
      apiGet<FutureCurve>("/futures/GC/curve"),
      apiGet<AgentOutput[]>("/futures/GC/agents?timeframe=1H"),
      apiGet<OptionChainRow[]>("/options/GC_OPTIONS/chain"),
      apiGet<VolSurface>("/options/GC_OPTIONS/vol-surface"),
      apiGet<AgentOutput[]>("/options/GC_OPTIONS/agents?timeframe=1D"),
      apiGet<StrategyRecommendation[]>("/options/GC_OPTIONS/strategies"),
    ]);

  return {
    clCurve: clCurve ?? emptyData.clCurve,
    clAgents: clAgents ?? emptyData.clAgents,
    clConsensus: clConsensus ?? emptyData.clConsensus,
    gcCurve: gcCurve ?? emptyData.gcCurve,
    gcAgents: gcAgents ?? emptyData.gcAgents,
    optionsChain: optionsChain ?? emptyData.optionsChain,
    optionsSurface: optionsSurface ?? emptyData.optionsSurface,
    optionsAgents: optionsAgents ?? emptyData.optionsAgents,
    optionStrategies: optionStrategies ?? emptyData.optionStrategies,
  };
}

export default async function DerivativesPage() {
  const data = await getDerivativesData();
  const allFuturesAgents = [...data.clAgents, ...data.gcAgents];
  const primaryStrategy = data.optionStrategies[0];
  const atmCall = data.optionsChain.find((row) => row.option_type === "call");
  const atmPut = data.optionsChain.find((row) => row.option_type === "put");

  return (
    <main className="shell intelligenceShell derivativesPage" id="main-content">
      <TopNav />

      <section className="categoryHero derivativesHero">
        <div className="categoryHeroTop">
          <div>
            <p className="eyebrow">Derivatives Intelligence</p>
            <h1>Futures and Options Agents</h1>
            <p className="universeCopy">
              Deterministic futures curve, open-interest, implied-volatility, skew, Greeks, and strategy-family analytics. Scenario guidance only — not guaranteed signals.
            </p>
          </div>
          <div className="heroStats">
            <Metric label="Futures agents" value={String(allFuturesAgents.length)} />
            <Metric label="Options agents" value={String(data.optionsAgents.length)} />
            <Metric label="Strategies" value={String(data.optionStrategies.length)} />
          </div>
        </div>
      </section>

      <section className="derivativeSummaryGrid" aria-label="Derivatives intelligence summary">
        <DerivativeStat title="CL consensus" value={labelBias(data.clConsensus?.bias)} detail={data.clConsensus?.summary ?? "Awaiting worker output"} />
        <DerivativeStat title="CL curve" value={curveLabel(data.clCurve)} detail={spreadDetail(data.clCurve)} />
        <DerivativeStat title="GC curve" value={curveLabel(data.gcCurve)} detail={spreadDetail(data.gcCurve)} />
        <DerivativeStat title="Options strategy" value={primaryStrategy?.strategy_family ?? "Waiting"} detail={primaryStrategy?.rationale ?? "Awaiting strategy recommender"} />
      </section>

      <section className="derivativesGrid">
        <section className="panelBlock derivativesPanel widePanel">
          <PanelTop eyebrow="Futures Layer" title="Curve + Direction + Flow Agents" meta="CL / GC" />
          <div className="futuresCurveGrid">
            {data.clCurve ? <CurveCard curve={data.clCurve} /> : <EmptyCard title="CL curve unavailable" />}
            {data.gcCurve ? <CurveCard curve={data.gcCurve} /> : <EmptyCard title="GC curve unavailable" />}
          </div>
          <AgentTable agents={allFuturesAgents} />
        </section>

        <section className="panelBlock derivativesPanel">
          <PanelTop eyebrow="Options Layer" title="Vol Surface Snapshot" meta="GC_OPTIONS" />
          {data.optionsSurface ? <VolSurfaceCard surface={data.optionsSurface} /> : <EmptyCard title="Vol surface unavailable" />}
          <div className="optionAtmGrid">
            {atmCall ? <OptionMiniCard row={atmCall} /> : null}
            {atmPut ? <OptionMiniCard row={atmPut} /> : null}
          </div>
        </section>

        <section className="panelBlock derivativesPanel widePanel">
          <PanelTop eyebrow="Options Agents" title="IV, Skew, Term, Greeks, Strategy" meta="Daily" />
          <AgentTable agents={data.optionsAgents} />
        </section>

        <section className="panelBlock derivativesPanel">
          <PanelTop eyebrow="Scenario Guidance" title="Strategy Families" meta="Risk framed" />
          <div className="strategyStack">
            {data.optionStrategies.length ? (
              data.optionStrategies.map((strategy) => <StrategyCard strategy={strategy} key={`${strategy.strategy_family}-${strategy.timestamp}`} />)
            ) : (
              <p className="quietResult">No strategy recommendations yet.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function PanelTop({ eyebrow, title, meta }: { eyebrow: string; title: string; meta: string }) {
  return (
    <div className="derivativesPanelTop">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <strong>{meta}</strong>
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

function DerivativeStat({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <article className="derivativeStat">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function CurveCard({ curve }: { curve: FutureCurve }) {
  return (
    <article className="curveCard">
      <div className="curveCardTop">
        <div>
          <span>Futures curve</span>
          <h3>{curve.underlying}</h3>
        </div>
        <strong>{curveLabel(curve)}</strong>
      </div>
      <div className="curveBars">
        {curve.curve_json.map((point) => (
          <div className="curveBar" key={point.contract}>
            <span>{point.contract}</span>
            <i style={{ height: `${Math.max(18, Math.min(100, (point.price / maxCurvePrice(curve)) * 100))}%` }} />
            <strong>{formatNumber(point.price)}</strong>
          </div>
        ))}
      </div>
      <p>{spreadDetail(curve)}</p>
    </article>
  );
}

function VolSurfaceCard({ surface }: { surface: VolSurface }) {
  const frontIv = getNumber(surface.atm_term_structure_json.front);
  const backIv = getNumber(surface.atm_term_structure_json.back);
  return (
    <article className="volSurfaceCard">
      <div className="volSurfaceDial">
        <span>IV rank</span>
        <strong>{formatNumber(surface.iv_rank)}</strong>
      </div>
      <div className="volSurfaceStats">
        <StatLine label="IV percentile" value={formatNumber(surface.iv_percentile)} />
        <StatLine label="Front ATM IV" value={formatPercent(frontIv)} />
        <StatLine label="Back ATM IV" value={formatPercent(backIv)} />
        <StatLine label="Skew score" value={formatNumber(surface.skew_score)} />
      </div>
    </article>
  );
}

function OptionMiniCard({ row }: { row: OptionChainRow }) {
  return (
    <article className={`optionMiniCard ${row.option_type}`}>
      <span>{row.option_type.toUpperCase()} · {formatNumber(row.strike)}</span>
      <strong>{formatNumber(row.mid)}</strong>
      <small>IV {formatPercent(getNumber(row.implied_vol))} · Δ {formatNumber(row.delta)}</small>
    </article>
  );
}

function AgentTable({ agents }: { agents: AgentOutput[] }) {
  if (!agents.length) {
    return <p className="quietResult">No agent outputs yet.</p>;
  }
  return (
    <div className="agentOutputTable">
      <div className="agentOutputRow agentOutputHead">
        <span>Agent</span>
        <span>Bias</span>
        <span>Confidence</span>
        <span>Score</span>
        <span>Summary</span>
      </div>
      {agents.map((agent) => (
        <div className="agentOutputRow" key={`${agent.market}-${agent.agent_key}-${agent.timestamp}`}>
          <strong>{agent.agent_key.replaceAll("_", " ")}</strong>
          <span className={`biasPill bias-${agent.bias}`}>{labelBias(agent.bias)}</span>
          <span>{formatPercent(getNumber(agent.confidence))}</span>
          <span>{formatNumber(agent.score)}</span>
          <p>{agent.summary}</p>
        </div>
      ))}
    </div>
  );
}

function StrategyCard({ strategy }: { strategy: StrategyRecommendation }) {
  return (
    <article className="strategyCard">
      <div>
        <span>{strategy.underlying}</span>
        <strong>{strategy.strategy_family}</strong>
      </div>
      <p>{strategy.rationale}</p>
      <small>{strategy.risk_note}</small>
      <b>{formatPercent(getNumber(strategy.confidence))} confidence</b>
    </article>
  );
}

function EmptyCard({ title }: { title: string }) {
  return <article className="curveCard emptyDerivativeCard"><h3>{title}</h3><p>Worker/API output has not arrived yet.</p></article>;
}

function StatLine({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function curveLabel(curve: FutureCurve | null) {
  if (!curve) return "Waiting";
  const m1 = getNumber(curve.m1_price);
  const m2 = getNumber(curve.m2_price);
  const m3 = getNumber(curve.m3_price);
  if (m1 > m2 && m2 > m3) return "Backwardation";
  if (m1 < m2 && m2 < m3) return "Contango";
  return "Mixed curve";
}

function spreadDetail(curve: FutureCurve | null) {
  if (!curve) return "No curve snapshot found.";
  return `${curve.front_contract}/${curve.second_contract}: ${formatNumber(curve.m1_m2_spread)} · ${curve.second_contract}/${curve.third_contract}: ${formatNumber(curve.m2_m3_spread)}`;
}

function maxCurvePrice(curve: FutureCurve) {
  return Math.max(...curve.curve_json.map((point) => point.price), 1);
}

function getNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: unknown) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(getNumber(value));
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, style: "percent" }).format(value);
}

function labelBias(value?: string) {
  return value ? value.replaceAll("_", " ") : "Waiting";
}
