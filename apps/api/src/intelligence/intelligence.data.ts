export type Bias = "bullish" | "bearish" | "neutral";
export type RiskLevel = "safe" | "caution" | "high-risk";
export type DependencyType = "direct" | "inverse" | "regime-dependent" | "event-sensitive";
export type DependencyEffect =
  | "strongly_confirming"
  | "confirming"
  | "neutral"
  | "conflicting"
  | "strongly_conflicting";

export type Market = {
  symbol: string;
  label: string;
  assetClass: "forex" | "metal" | "energy" | "index" | "crypto" | "equity";
  price: number;
  changePct: number;
  bias: Bias;
  confidence: number;
  regime: string;
  risk: RiskLevel;
  summary: string;
};

export type MarketDependency = {
  targetMarketId: string;
  sourceMarketId: string;
  dependencyType: DependencyType;
  weight: number;
  tier: "core" | "driver" | "context";
  stabilityScore: number;
  currentRegime: string;
};

export type AgentOutput = {
  agent: string;
  market: string;
  timeframe: string;
  timestamp: string;
  bias: Bias;
  confidence: number;
  score: number;
  summary: string;
  keyLevels?: { support: number[]; resistance: number[] };
  riskFlags?: string[];
  invalidation?: string;
  features: Record<string, string | number | boolean>;
};

export type CrossMarketOutput = {
  targetMarket: string;
  timeframe: string;
  baseBias: Bias;
  baseConfidence: number;
  relatedMarkets: Array<{
    market: string;
    relationship: DependencyType;
    currentEffect: DependencyEffect;
    strength: number;
  }>;
  confirmationScore: number;
  conflictScore: number;
  adjustment: number;
  finalConfidence: number;
  summary: string;
};

export type ConsensusOutput = {
  market: string;
  timeframe: string;
  timestamp: string;
  finalBias: Bias;
  finalConfidence: number;
  agreementScore: number;
  summary: string;
  bullishCase: string;
  bearishCase: string;
  invalidation: string;
  whatChanged: string;
};

const timestamp = "2026-06-11T13:00:00.000Z";
const minuteMs = 60_000;

export const markets: Market[] = [
  {
    symbol: "XAUUSD",
    label: "XAU/USD",
    assetClass: "metal",
    price: 3031.4,
    changePct: 0.42,
    bias: "bullish",
    confidence: 0.74,
    regime: "event-driven uptrend",
    risk: "caution",
    summary: "Gold remains supported while geopolitical stress offsets a firm dollar backdrop.",
  },
  {
    symbol: "EURUSD",
    label: "EUR/USD",
    assetClass: "forex",
    price: 1.0832,
    changePct: -0.18,
    bias: "bearish",
    confidence: 0.68,
    regime: "dollar-led trend",
    risk: "safe",
    summary: "Dollar strength and yield pressure keep EUR/USD offered below nearby resistance.",
  },
  {
    symbol: "GBPUSD",
    label: "GBP/USD",
    assetClass: "forex",
    price: 1.2734,
    changePct: 0.06,
    bias: "neutral",
    confidence: 0.57,
    regime: "range",
    risk: "caution",
    summary: "Sterling is range-bound with limited confirmation from EUR/USD.",
  },
  {
    symbol: "USDJPY",
    label: "USD/JPY",
    assetClass: "forex",
    price: 157.18,
    changePct: 0.34,
    bias: "bullish",
    confidence: 0.78,
    regime: "carry-friendly trend",
    risk: "caution",
    summary: "US yield strength confirms upside pressure, though intervention risk remains elevated.",
  },
  {
    symbol: "USDCAD",
    label: "USD/CAD",
    assetClass: "forex",
    price: 1.3712,
    changePct: 0.22,
    bias: "bullish",
    confidence: 0.77,
    regime: "oil-sensitive dollar trend",
    risk: "safe",
    summary: "Oil softness and a firmer DXY confirm the bullish USD/CAD setup.",
  },
  {
    symbol: "AUDUSD",
    label: "AUD/USD",
    assetClass: "forex",
    price: 0.6621,
    changePct: -0.31,
    bias: "bearish",
    confidence: 0.71,
    regime: "risk-off commodity pressure",
    risk: "caution",
    summary: "Weak risk sentiment and dollar strength pressure AUD/USD.",
  },
  {
    symbol: "USOIL",
    label: "WTI crude oil",
    assetClass: "energy",
    price: 74.86,
    changePct: -0.82,
    bias: "bearish",
    confidence: 0.66,
    regime: "growth-sensitive downtrend",
    risk: "caution",
    summary: "WTI is slipping as dollar strength and growth concern outweigh supply risk.",
  },
  {
    symbol: "DXY",
    label: "DXY / USD strength",
    assetClass: "index",
    price: 105.32,
    changePct: 0.27,
    bias: "bullish",
    confidence: 0.75,
    regime: "yield-supported dollar trend",
    risk: "safe",
    summary: "Dollar strength is supported by front-end yields and positive real-yield momentum.",
  },
  {
    symbol: "BTCUSD",
    label: "BTC/USD",
    assetClass: "crypto",
    price: 104850,
    changePct: 1.28,
    bias: "bullish",
    confidence: 0.73,
    regime: "macro-liquidity risk-on",
    risk: "caution",
    summary: "Bitcoin is supported by risk appetite, stablecoin liquidity, and positive ETF/fund-flow assumptions.",
  },
  {
    symbol: "ETHUSD",
    label: "ETH/USD",
    assetClass: "crypto",
    price: 3890,
    changePct: 0.84,
    bias: "neutral",
    confidence: 0.61,
    regime: "smart-contract rotation watch",
    risk: "caution",
    summary: "Ethereum has positive BTC beta but mixed relative confirmation from ETH/BTC and network fee capture.",
  },
  {
    symbol: "SOLUSD",
    label: "SOL/USD",
    assetClass: "crypto",
    price: 184.2,
    changePct: 2.14,
    bias: "bullish",
    confidence: 0.72,
    regime: "high-beta crypto rotation",
    risk: "high-risk",
    summary: "Solana shows strong high-beta crypto appetite, but leverage and retail-flow fragility keep risk elevated.",
  },
  {
    symbol: "SPY",
    label: "S&P 500 ETF",
    assetClass: "equity",
    price: 638.4,
    changePct: 0.35,
    bias: "bullish",
    confidence: 0.69,
    regime: "earnings-led risk-on",
    risk: "safe",
    summary: "The S&P 500 is supported by broad risk appetite and easing volatility.",
  },
  {
    symbol: "QQQ",
    label: "Nasdaq 100 ETF",
    assetClass: "equity",
    price: 557.2,
    changePct: 0.58,
    bias: "bullish",
    confidence: 0.74,
    regime: "mega-cap growth leadership",
    risk: "caution",
    summary: "Nasdaq leadership remains positive, but real-yield sensitivity keeps the setup vulnerable.",
  },
  {
    symbol: "NVDA",
    label: "NVIDIA",
    assetClass: "equity",
    price: 182.6,
    changePct: 1.12,
    bias: "bullish",
    confidence: 0.76,
    regime: "AI momentum leadership",
    risk: "caution",
    summary: "NVIDIA remains a leadership proxy for AI, semiconductors, and high-beta growth risk.",
  },
  {
    symbol: "AAPL",
    label: "Apple",
    assetClass: "equity",
    price: 215.8,
    changePct: -0.22,
    bias: "neutral",
    confidence: 0.58,
    regime: "mega-cap range",
    risk: "safe",
    summary: "Apple is range-bound with less direct AI beta than semiconductor leaders.",
  },
  {
    symbol: "TSLA",
    label: "Tesla",
    assetClass: "equity",
    price: 246.9,
    changePct: -0.74,
    bias: "bearish",
    confidence: 0.64,
    regime: "high-beta pressure",
    risk: "high-risk",
    summary: "Tesla remains a volatile high-beta stock with pressure from risk appetite and margin concerns.",
  },
];

export const dependencies: MarketDependency[] = [
  { targetMarketId: "DXY", sourceMarketId: "US2Y", dependencyType: "direct", weight: 0.9, tier: "driver", stabilityScore: 0.82, currentRegime: "yield-supported" },
  { targetMarketId: "DXY", sourceMarketId: "REALYIELDS", dependencyType: "direct", weight: 0.95, tier: "driver", stabilityScore: 0.86, currentRegime: "yield-supported" },
  { targetMarketId: "DXY", sourceMarketId: "RISK", dependencyType: "regime-dependent", weight: 0.7, tier: "context", stabilityScore: 0.61, currentRegime: "risk-off" },
  { targetMarketId: "DXY", sourceMarketId: "XAUUSD", dependencyType: "inverse", weight: 0.65, tier: "core", stabilityScore: 0.68, currentRegime: "event-driven" },
  { targetMarketId: "DXY", sourceMarketId: "USOIL", dependencyType: "regime-dependent", weight: 0.45, tier: "context", stabilityScore: 0.48, currentRegime: "growth-sensitive" },
  { targetMarketId: "EURUSD", sourceMarketId: "DXY", dependencyType: "inverse", weight: 0.95, tier: "core", stabilityScore: 0.9, currentRegime: "dollar-led trend" },
  { targetMarketId: "EURUSD", sourceMarketId: "USYIELDS", dependencyType: "inverse", weight: 0.8, tier: "driver", stabilityScore: 0.78, currentRegime: "yield-supported" },
  { targetMarketId: "EURUSD", sourceMarketId: "ECB_FED_SPREAD", dependencyType: "direct", weight: 0.95, tier: "driver", stabilityScore: 0.8, currentRegime: "policy divergence" },
  { targetMarketId: "EURUSD", sourceMarketId: "RISK", dependencyType: "regime-dependent", weight: 0.5, tier: "context", stabilityScore: 0.53, currentRegime: "risk-off" },
  { targetMarketId: "GBPUSD", sourceMarketId: "DXY", dependencyType: "inverse", weight: 0.9, tier: "core", stabilityScore: 0.84, currentRegime: "dollar-led trend" },
  { targetMarketId: "GBPUSD", sourceMarketId: "USYIELDS", dependencyType: "inverse", weight: 0.7, tier: "driver", stabilityScore: 0.73, currentRegime: "yield-supported" },
  { targetMarketId: "GBPUSD", sourceMarketId: "BOE_FED_SPREAD", dependencyType: "direct", weight: 0.85, tier: "driver", stabilityScore: 0.76, currentRegime: "policy divergence" },
  { targetMarketId: "GBPUSD", sourceMarketId: "EURUSD", dependencyType: "direct", weight: 0.6, tier: "core", stabilityScore: 0.62, currentRegime: "range" },
  { targetMarketId: "USDJPY", sourceMarketId: "US10Y", dependencyType: "direct", weight: 0.95, tier: "driver", stabilityScore: 0.88, currentRegime: "carry-friendly" },
  { targetMarketId: "USDJPY", sourceMarketId: "USJP_SPREAD", dependencyType: "direct", weight: 1, tier: "driver", stabilityScore: 0.9, currentRegime: "carry-friendly" },
  { targetMarketId: "USDJPY", sourceMarketId: "RISK", dependencyType: "regime-dependent", weight: 0.9, tier: "context", stabilityScore: 0.64, currentRegime: "risk-off" },
  { targetMarketId: "USDJPY", sourceMarketId: "DXY", dependencyType: "direct", weight: 0.7, tier: "core", stabilityScore: 0.71, currentRegime: "dollar-led trend" },
  { targetMarketId: "USDCAD", sourceMarketId: "USOIL", dependencyType: "inverse", weight: 0.95, tier: "core", stabilityScore: 0.86, currentRegime: "oil-sensitive" },
  { targetMarketId: "USDCAD", sourceMarketId: "DXY", dependencyType: "direct", weight: 0.85, tier: "core", stabilityScore: 0.82, currentRegime: "dollar-led trend" },
  { targetMarketId: "USDCAD", sourceMarketId: "USCA_SPREAD", dependencyType: "direct", weight: 0.75, tier: "driver", stabilityScore: 0.69, currentRegime: "policy divergence" },
  { targetMarketId: "AUDUSD", sourceMarketId: "DXY", dependencyType: "inverse", weight: 0.9, tier: "core", stabilityScore: 0.85, currentRegime: "dollar-led trend" },
  { targetMarketId: "AUDUSD", sourceMarketId: "RISK", dependencyType: "direct", weight: 0.85, tier: "context", stabilityScore: 0.75, currentRegime: "risk-off" },
  { targetMarketId: "AUDUSD", sourceMarketId: "COMMODITY_BASKET", dependencyType: "direct", weight: 0.8, tier: "driver", stabilityScore: 0.7, currentRegime: "commodity pressure" },
  { targetMarketId: "AUDUSD", sourceMarketId: "CHINA_PROXY", dependencyType: "direct", weight: 0.7, tier: "context", stabilityScore: 0.58, currentRegime: "growth-sensitive" },
  { targetMarketId: "XAUUSD", sourceMarketId: "REALYIELDS", dependencyType: "inverse", weight: 1, tier: "driver", stabilityScore: 0.9, currentRegime: "event-driven" },
  { targetMarketId: "XAUUSD", sourceMarketId: "DXY", dependencyType: "inverse", weight: 0.95, tier: "core", stabilityScore: 0.86, currentRegime: "dollar-led trend" },
  { targetMarketId: "XAUUSD", sourceMarketId: "GEOPOLITICAL_STRESS", dependencyType: "regime-dependent", weight: 0.7, tier: "context", stabilityScore: 0.62, currentRegime: "event-driven" },
  { targetMarketId: "XAUUSD", sourceMarketId: "INFLATION_EXPECTATIONS", dependencyType: "direct", weight: 0.55, tier: "driver", stabilityScore: 0.54, currentRegime: "event-driven" },
  { targetMarketId: "XAUUSD", sourceMarketId: "USOIL", dependencyType: "direct", weight: 0.35, tier: "context", stabilityScore: 0.42, currentRegime: "growth-sensitive" },
  { targetMarketId: "USOIL", sourceMarketId: "DXY", dependencyType: "inverse", weight: 0.75, tier: "core", stabilityScore: 0.73, currentRegime: "dollar-led trend" },
  { targetMarketId: "USOIL", sourceMarketId: "RISK", dependencyType: "direct", weight: 0.8, tier: "context", stabilityScore: 0.67, currentRegime: "growth-sensitive" },
  { targetMarketId: "USOIL", sourceMarketId: "SUPPLY_SHOCK", dependencyType: "event-sensitive", weight: 1, tier: "driver", stabilityScore: 0.63, currentRegime: "event-sensitive" },
  { targetMarketId: "USOIL", sourceMarketId: "GEOPOLITICAL_SCORE", dependencyType: "event-sensitive", weight: 0.85, tier: "context", stabilityScore: 0.6, currentRegime: "event-sensitive" },
  { targetMarketId: "BTCUSD", sourceMarketId: "DXY", dependencyType: "inverse", weight: 0.75, tier: "core", stabilityScore: 0.68, currentRegime: "macro-liquidity" },
  { targetMarketId: "BTCUSD", sourceMarketId: "REALYIELDS", dependencyType: "inverse", weight: 0.7, tier: "driver", stabilityScore: 0.62, currentRegime: "macro-liquidity" },
  { targetMarketId: "BTCUSD", sourceMarketId: "QQQ", dependencyType: "direct", weight: 0.65, tier: "core", stabilityScore: 0.58, currentRegime: "risk-on" },
  { targetMarketId: "BTCUSD", sourceMarketId: "STABLECOIN_SUPPLY", dependencyType: "direct", weight: 0.7, tier: "driver", stabilityScore: 0.75, currentRegime: "crypto-liquidity" },
  { targetMarketId: "BTCUSD", sourceMarketId: "ETF_FLOWS", dependencyType: "direct", weight: 0.85, tier: "driver", stabilityScore: 0.7, currentRegime: "spot-demand" },
  { targetMarketId: "ETHUSD", sourceMarketId: "BTCUSD", dependencyType: "direct", weight: 0.8, tier: "core", stabilityScore: 0.84, currentRegime: "crypto-beta" },
  { targetMarketId: "ETHUSD", sourceMarketId: "ETHBTC", dependencyType: "direct", weight: 0.9, tier: "core", stabilityScore: 0.74, currentRegime: "relative-rotation" },
  { targetMarketId: "ETHUSD", sourceMarketId: "ETH_TVL", dependencyType: "direct", weight: 0.75, tier: "driver", stabilityScore: 0.67, currentRegime: "network-confirmation" },
  { targetMarketId: "ETHUSD", sourceMarketId: "STAKING_SPREAD", dependencyType: "direct", weight: 0.55, tier: "context", stabilityScore: 0.52, currentRegime: "yield-comparison" },
  { targetMarketId: "SOLUSD", sourceMarketId: "BTCUSD", dependencyType: "direct", weight: 0.75, tier: "core", stabilityScore: 0.78, currentRegime: "crypto-beta" },
  { targetMarketId: "SOLUSD", sourceMarketId: "SOLETH", dependencyType: "direct", weight: 0.85, tier: "core", stabilityScore: 0.7, currentRegime: "platform-rotation" },
  { targetMarketId: "SOLUSD", sourceMarketId: "SOL_DEX_VOLUME", dependencyType: "direct", weight: 0.85, tier: "driver", stabilityScore: 0.68, currentRegime: "network-confirmation" },
  { targetMarketId: "SOLUSD", sourceMarketId: "SOL_STABLECOINS", dependencyType: "direct", weight: 0.7, tier: "driver", stabilityScore: 0.62, currentRegime: "crypto-liquidity" },
  { targetMarketId: "SOLUSD", sourceMarketId: "NETWORK_RELIABILITY", dependencyType: "inverse", weight: 0.8, tier: "context", stabilityScore: 0.6, currentRegime: "operational-risk" },
  { targetMarketId: "SPY", sourceMarketId: "US10Y", dependencyType: "inverse", weight: 0.65, tier: "driver", stabilityScore: 0.58, currentRegime: "rate-sensitive" },
  { targetMarketId: "SPY", sourceMarketId: "VIX", dependencyType: "inverse", weight: 0.85, tier: "core", stabilityScore: 0.8, currentRegime: "risk-on" },
  { targetMarketId: "SPY", sourceMarketId: "DXY", dependencyType: "inverse", weight: 0.45, tier: "context", stabilityScore: 0.4, currentRegime: "global-liquidity" },
  { targetMarketId: "QQQ", sourceMarketId: "REALYIELDS", dependencyType: "inverse", weight: 0.8, tier: "driver", stabilityScore: 0.7, currentRegime: "duration-growth" },
  { targetMarketId: "QQQ", sourceMarketId: "SPY", dependencyType: "direct", weight: 0.85, tier: "core", stabilityScore: 0.82, currentRegime: "equity-beta" },
  { targetMarketId: "QQQ", sourceMarketId: "VIX", dependencyType: "inverse", weight: 0.8, tier: "core", stabilityScore: 0.76, currentRegime: "risk-on" },
  { targetMarketId: "NVDA", sourceMarketId: "QQQ", dependencyType: "direct", weight: 0.9, tier: "core", stabilityScore: 0.82, currentRegime: "growth-leadership" },
  { targetMarketId: "NVDA", sourceMarketId: "SEMIS", dependencyType: "direct", weight: 0.85, tier: "driver", stabilityScore: 0.76, currentRegime: "AI-cycle" },
  { targetMarketId: "NVDA", sourceMarketId: "REALYIELDS", dependencyType: "inverse", weight: 0.55, tier: "context", stabilityScore: 0.52, currentRegime: "duration-growth" },
  { targetMarketId: "AAPL", sourceMarketId: "QQQ", dependencyType: "direct", weight: 0.8, tier: "core", stabilityScore: 0.78, currentRegime: "mega-cap-beta" },
  { targetMarketId: "AAPL", sourceMarketId: "DXY", dependencyType: "inverse", weight: 0.45, tier: "context", stabilityScore: 0.45, currentRegime: "global-revenue" },
  { targetMarketId: "AAPL", sourceMarketId: "CHINA_PROXY", dependencyType: "direct", weight: 0.5, tier: "context", stabilityScore: 0.42, currentRegime: "global-demand" },
  { targetMarketId: "TSLA", sourceMarketId: "QQQ", dependencyType: "direct", weight: 0.75, tier: "core", stabilityScore: 0.68, currentRegime: "high-beta-equity" },
  { targetMarketId: "TSLA", sourceMarketId: "RISK", dependencyType: "direct", weight: 0.7, tier: "context", stabilityScore: 0.62, currentRegime: "risk-on" },
  { targetMarketId: "TSLA", sourceMarketId: "US10Y", dependencyType: "inverse", weight: 0.55, tier: "driver", stabilityScore: 0.5, currentRegime: "duration-growth" },
];

export const plans = [
  { id: "trial", name: "Free Trial", price: "$0", agents: 2, markets: 2, features: ["7 days", "Delayed data", "Limited alerts"] },
  { id: "starter", name: "Starter", price: "$49/mo", agents: 3, markets: 3, features: ["Daily reports", "Limited intraday access"] },
  { id: "pro", name: "Pro", price: "$149/mo", agents: 5, markets: markets.length, features: ["Advanced alerts", "Report history", "Dependency analysis"] },
  { id: "elite", name: "Elite", price: "$399/mo", agents: 6, markets: markets.length, features: ["Crypto and equity matrices", "Faster refresh", "Backtesting", "Exports", "API/webhooks"] },
];

export const events = [
  { id: "nfp", time: "13:30 UTC", title: "US labor market revision", importance: "high", affected: ["DXY", "XAUUSD", "USDJPY"] },
  { id: "eia", time: "14:30 UTC", title: "EIA crude inventory report", importance: "medium", affected: ["USOIL", "USDCAD"] },
  { id: "ecb", time: "16:00 UTC", title: "ECB speaker window", importance: "medium", affected: ["EURUSD", "GBPUSD"] },
  { id: "crypto-liquidity", time: "20:00 UTC", title: "Stablecoin supply and ETF flow check", importance: "medium", affected: ["BTCUSD", "ETHUSD", "SOLUSD"] },
  { id: "yields-equity", time: "All session", title: "Real-yield and volatility regime monitor", importance: "medium", affected: ["QQQ", "NVDA", "BTCUSD"] },
];

export const alerts = [
  { id: "a1", market: "USDCAD", type: "consensus_change", severity: "info", message: "USD/CAD confidence rose above 75% after oil confirmation.", createdAt: timestamp },
  { id: "a2", market: "XAUUSD", type: "dependency_conflict", severity: "warning", message: "Gold bullish view is fighting DXY strength.", createdAt: timestamp },
  { id: "a3", market: "USDJPY", type: "event_risk", severity: "warning", message: "Intervention risk remains elevated above 157.", createdAt: timestamp },
  { id: "a4", market: "SOLUSD", type: "leverage_risk", severity: "warning", message: "SOL strength is high beta; funding and network confirmation should be checked before raising confidence.", createdAt: timestamp },
  { id: "a5", market: "NVDA", type: "macro_dependency", severity: "info", message: "NVDA remains confirmed by QQQ leadership but sensitive to real-yield reversals.", createdAt: timestamp },
];

export const reports = [
  { id: "daily-fx", title: "Daily FX Dependency Brief", cadence: "Daily", markets: ["DXY", "EURUSD", "GBPUSD", "USDJPY"], summary: "Dollar strength remains the dominant cross-market driver.", createdAt: timestamp },
  { id: "oil-cad", title: "WTI and USD/CAD Intraday Watch", cadence: "Intraday", markets: ["USOIL", "USDCAD"], summary: "Oil weakness confirms USD/CAD upside unless WTI reclaims yesterday's breakdown level.", createdAt: timestamp },
  { id: "gold-risk", title: "Gold Event-Risk Map", cadence: "Intraday", markets: ["XAUUSD", "DXY"], summary: "Gold retains upside momentum but confidence is capped by real-yield sensitivity.", createdAt: timestamp },
  { id: "crypto-beta", title: "Crypto Beta And Liquidity Map", cadence: "Intraday", markets: ["BTCUSD", "ETHUSD", "SOLUSD"], summary: "BTC beta, stablecoin liquidity, and relative rotation define the crypto setup.", createdAt: timestamp },
  { id: "growth-stocks", title: "Growth Equity Dependency Watch", cadence: "Intraday", markets: ["SPY", "QQQ", "NVDA", "AAPL", "TSLA"], summary: "Growth leadership is positive but remains exposed to VIX and real-yield reversals.", createdAt: timestamp },
];

export function buildAgentOutputs(market: Market, runTimestamp = timestamp): AgentOutput[] {
  const direction = market.bias === "bullish" ? 1 : market.bias === "bearish" ? -1 : 0;
  const supportBase = market.price * (1 - 0.006);
  const resistanceBase = market.price * (1 + 0.006);
  const confidenceBump = direction === 0 ? -0.05 : 0;

  return [
    {
      agent: "Technical agent",
      market: market.symbol,
      timeframe: "1H",
      timestamp: runTimestamp,
      bias: market.bias,
      confidence: clamp(market.confidence + confidenceBump),
      score: round(5 + direction * 1.7 + market.confidence),
      summary: `${market.label} technical structure is ${market.bias} inside a ${market.regime} regime.`,
      keyLevels: {
        support: [round(supportBase), round(supportBase * 0.997)],
        resistance: [round(resistanceBase), round(resistanceBase * 1.004)],
      },
      riskFlags: market.risk === "safe" ? [] : ["event_or_volatility_risk"],
      invalidation: market.bias === "bearish" ? `1H close above ${round(resistanceBase)}` : `1H close below ${round(supportBase)}`,
      features: {
        rsi: round(50 + direction * 12 + market.changePct * 3),
        atr: round(Math.abs(market.changePct) * market.price * 0.01),
        ema_trend: direction > 0 ? "up" : direction < 0 ? "down" : "flat",
      },
    },
    {
      agent: "News / sentiment agent",
      market: market.symbol,
      timeframe: "1H",
      timestamp: runTimestamp,
      bias: sentimentBias(market),
      confidence: clamp(market.confidence - 0.08),
      score: round(5 + market.changePct),
      summary: macroSummary(market),
      features: {
        event_risk_score: market.risk === "safe" ? 0.28 : 0.63,
        sentiment_score: round(direction * 0.42),
        confidence_adjustment: market.risk === "high-risk" ? -0.18 : market.risk === "caution" ? -0.07 : 0.04,
      },
    },
    {
      agent: "Regime / correlation agent",
      market: market.symbol,
      timeframe: "1H",
      timestamp: runTimestamp,
      bias: market.bias,
      confidence: clamp(market.confidence - 0.02),
      score: round(5.5 + market.confidence * 2),
      summary: `Current regime is classified as ${market.regime}; relationship stability is acceptable but monitored.`,
      features: {
        market_regime: market.regime,
        rolling_correlation: round(0.36 + market.confidence / 2),
        volatility_state: market.risk,
        stability_score: round(0.55 + market.confidence / 3),
      },
    },
    {
      agent: "Risk agent",
      market: market.symbol,
      timeframe: "1H",
      timestamp: runTimestamp,
      bias: "neutral",
      confidence: market.risk === "safe" ? 0.78 : 0.62,
      score: market.risk === "safe" ? 7.6 : market.risk === "caution" ? 5.8 : 3.2,
      summary: market.risk === "safe" ? "Risk checks are within normal operating thresholds." : "Position sizing should be reduced until event and volatility risk normalizes.",
      riskFlags: market.risk === "safe" ? [] : ["reduced_size", "monitor_event_window"],
      features: {
        risk_level: market.risk,
        avoid_trade: market.risk === "high-risk",
        liquidity_assumption: "normal",
        disagreement_penalty: round(1 - market.confidence),
      },
    },
  ];
}

export function buildCrossMarketOutput(market: Market, marketUniverse = markets): CrossMarketOutput {
  const related: CrossMarketOutput["relatedMarkets"] = dependencies
    .filter((dependency) => dependency.targetMarketId === market.symbol)
    .slice(0, 4)
    .map((dependency) => {
      const source = marketUniverse.find((item) => item.symbol === dependency.sourceMarketId);
      const sourceBias = source?.bias ?? driverBias(dependency.sourceMarketId);
      const effect = classifyDependency(market.bias, sourceBias, dependency.dependencyType, dependency.weight);
      return {
        market: dependency.sourceMarketId,
        relationship: dependency.dependencyType,
        currentEffect: effect,
        strength: dependency.weight,
      };
    });
  const confirmationScore = round(related.reduce((sum, item) => sum + (item.currentEffect.includes("confirming") ? item.strength : 0), 0) / Math.max(1, related.length));
  const conflictScore = round(related.reduce((sum, item) => sum + (item.currentEffect.includes("conflicting") ? item.strength : 0), 0) / Math.max(1, related.length));
  const adjustment = round((confirmationScore - conflictScore) * 0.16);

  return {
    targetMarket: market.symbol,
    timeframe: "1H",
    baseBias: market.bias,
    baseConfidence: market.confidence,
    relatedMarkets: related,
    confirmationScore,
    conflictScore,
    adjustment,
    finalConfidence: clamp(market.confidence + adjustment),
    summary: dependencySummary(market, related, adjustment),
  };
}

export function buildConsensus(market: Market, marketUniverse = markets, runTimestamp = timestamp): ConsensusOutput {
  const dependency = buildCrossMarketOutput(market, marketUniverse);
  return {
    market: market.symbol,
    timeframe: "1H",
    timestamp: runTimestamp,
    finalBias: market.bias,
    finalConfidence: dependency.finalConfidence,
    agreementScore: round(0.52 + dependency.confirmationScore * 0.55 - dependency.conflictScore * 0.25),
    summary: market.summary,
    bullishCase: `Confirmation improves if ${market.label} holds above near-term support while dependency conflicts fade.`,
    bearishCase: `The setup weakens if macro drivers reverse or price closes through the invalidation level.`,
    invalidation: market.bias === "bearish" ? "Sustained close above first resistance." : "Sustained close below first support.",
    whatChanged: "Dependency matrix now contributes an explicit confidence adjustment instead of treating the market in isolation.",
  };
}

export function buildCandles(market: Market, runTimestamp = timestamp) {
  const endTime = new Date(runTimestamp).getTime();
  return Array.from({ length: 30 }, (_, index) => {
    const drift = (index - 15) * market.changePct * 0.018;
    const wave = Math.sin(index / 2.8) * market.price * 0.0018;
    const close = market.price + drift + wave;
    const open = close - market.price * 0.001 * Math.cos(index);
    return {
      time: new Date(endTime - (29 - index) * minuteMs).toISOString(),
      open: round(open),
      high: round(Math.max(open, close) + market.price * 0.0016),
      low: round(Math.min(open, close) - market.price * 0.0016),
      close: round(close),
    };
  });
}

export function round(value: number) {
  return Number(value.toFixed(value > 50 ? 2 : 4));
}

function clamp(value: number) {
  return Math.max(0.05, Math.min(0.95, round(value)));
}

function sentimentBias(market: Market): Bias {
  if (market.symbol === "XAUUSD" || market.symbol === "USOIL") {
    return "neutral";
  }
  return market.bias;
}

function macroSummary(market: Market) {
  if (market.symbol === "USDCAD") {
    return "Crude oil weakness is the dominant macro driver supporting USD/CAD strength.";
  }
  if (market.symbol === "XAUUSD") {
    return "Gold sentiment is supported by geopolitical demand but restrained by DXY and real yields.";
  }
  if (market.symbol === "USOIL") {
    return "Supply risk is present, but growth and dollar conditions are weighing on crude.";
  }
  if (market.assetClass === "crypto") {
    return `${market.label} is scored through BTC beta, macro liquidity, stablecoin liquidity, relative rotation, and leverage risk.`;
  }
  if (market.assetClass === "equity") {
    return `${market.label} is scored through equity beta, volatility regime, real yields, sector leadership, and stock-specific momentum.`;
  }
  return `${market.label} macro tone is primarily driven by dollar strength, event risk, and rate expectations.`;
}

function driverBias(sourceMarketId: string): Bias {
  if (
    [
      "US2Y",
      "US10Y",
      "REALYIELDS",
      "USYIELDS",
      "USJP_SPREAD",
      "DXY",
      "STABLECOIN_SUPPLY",
      "ETF_FLOWS",
      "ETH_TVL",
      "ETHBTC",
      "SOLETH",
      "SOL_DEX_VOLUME",
      "SOL_STABLECOINS",
      "SEMIS",
      "SPY",
      "QQQ",
    ].includes(sourceMarketId)
  ) {
    return "bullish";
  }
  if (["RISK", "COMMODITY_BASKET", "CHINA_PROXY", "USOIL", "VIX", "NETWORK_RELIABILITY"].includes(sourceMarketId)) {
    return "bearish";
  }
  return "neutral";
}

function classifyDependency(
  targetBias: Bias,
  sourceBias: Bias,
  relationship: DependencyType,
  weight: number,
): DependencyEffect {
  if (targetBias === "neutral" || sourceBias === "neutral") {
    return "neutral" as const;
  }
  const sameDirection = targetBias === sourceBias;
  const confirms = relationship === "inverse" ? !sameDirection : sameDirection;
  if (confirms) {
    return weight >= 0.85 ? "strongly_confirming" : "confirming";
  }
  return weight >= 0.85 ? "strongly_conflicting" : "conflicting";
}

function dependencySummary(
  market: Market,
  related: CrossMarketOutput["relatedMarkets"],
  adjustment: number,
) {
  const confirmations = related.filter((item) => item.currentEffect.includes("confirming")).map((item) => item.market);
  const conflicts = related.filter((item) => item.currentEffect.includes("conflicting")).map((item) => item.market);
  if (adjustment > 0.04) {
    return `${confirmations.join(", ")} confirm the ${market.bias} ${market.label} view in the current regime.`;
  }
  if (adjustment < -0.04) {
    return `${conflicts.join(", ")} conflict with the ${market.bias} ${market.label} view, reducing confidence.`;
  }
  return `Cross-market inputs are mixed for ${market.label}; confidence remains near the base agent view.`;
}
