type StrategyFormula = {
  name: string;
  family: string;
  signal: "bullish" | "bearish" | "neutral";
  setup: string;
  formula: string;
  execution: string;
};

type PatternPlan = {
  name: string;
  family: "Reversal" | "Continuation" | "Candlestick";
  bias: "bullish" | "bearish" | "neutral";
  points: string;
  rails?: Array<{ x1: number; y1: number; x2: number; y2: number; kind: "support" | "resistance" | "neckline" }>;
  formula: string;
  entry: string;
  stop: string;
  target: string;
};

type CombinedStrategy = {
  name: string;
  regime: string;
  bias: "bullish" | "bearish" | "neutral";
  visual: "trend" | "squeeze" | "meanReversion" | "patternBreakout" | "reversal" | "levelReaction";
  explainer: string;
  steps: string[];
  pair: string;
  timeframe: string;
  trade: string;
  result: StrategyResult;
  components: string[];
  formula: string;
  entry: string;
  risk: string;
  avoid: string;
};

type StrategyResult = {
  status: "Long candidate" | "Short candidate" | "Breakout watch" | "Two-way level trade";
  direction: "Buy" | "Sell" | "Buy or Sell";
  condition: string;
  entryZone: string;
  stop: string;
  targets: string[];
  confidence: string;
  summary: string;
};

const indicatorFormulas: StrategyFormula[] = [
  {
    name: "EMA Trend Cross",
    family: "Trend",
    signal: "bullish",
    setup: "Fast EMA crosses above slow EMA while price closes above both averages.",
    formula: "EMA_fast(t) > EMA_slow(t) AND EMA_fast(t-1) <= EMA_slow(t-1)",
    execution: "Enter on confirmed close. Stop below recent swing low. Target 1.5R-2R or trail under EMA_slow.",
  },
  {
    name: "RSI Mean Reversion",
    family: "Momentum",
    signal: "bullish",
    setup: "Oversold RSI recovers from an extreme at support.",
    formula: "RSI_14(t-1) < 30 AND RSI_14(t) >= 30 AND close(t) > support",
    execution: "Enter recovery close. Stop below support. Target mid-range or prior resistance.",
  },
  {
    name: "MACD Momentum Shift",
    family: "Momentum",
    signal: "bullish",
    setup: "MACD line crosses signal line with histogram flipping positive.",
    formula: "MACD = EMA_12(close) - EMA_26(close); signal = EMA_9(MACD); MACD(t) > signal(t)",
    execution: "Enter after crossover with trend filter. Stop below last higher low. Exit when histogram weakens.",
  },
  {
    name: "Bollinger Squeeze Breakout",
    family: "Volatility",
    signal: "neutral",
    setup: "Bands contract, then price breaks outside the range with direction confirmation.",
    formula: "bandwidth = (upper_20,2 - lower_20,2) / SMA_20; bandwidth < p20 AND close breaks range",
    execution: "Trade breakout direction. Stop inside the range. Target measured range height.",
  },
  {
    name: "ADX Trend Gate",
    family: "Trend strength",
    signal: "neutral",
    setup: "Only allow trend trades when directional strength is high enough.",
    formula: "ADX_14 > 25 AND (+DI > -DI for longs OR -DI > +DI for shorts)",
    execution: "Use as a filter for EMA/MACD setups. Avoid trend entries when ADX is falling below 20.",
  },
  {
    name: "Stochastic Reversal",
    family: "Momentum",
    signal: "bearish",
    setup: "Overbought oscillator rolls over near resistance.",
    formula: "%K_14(t-1) > 80 AND %K_14(t) < %D_3(t) AND close(t) < resistance",
    execution: "Enter on bearish close. Stop above resistance. Target range midpoint or support.",
  },
];

const combinedStrategies: CombinedStrategy[] = [
  {
    name: "Trend-Momentum Continuation",
    regime: "Directional trend",
    bias: "bullish",
    visual: "trend",
    explainer:
      "This setup waits for trend direction, momentum, and trend strength to agree before buying a pullback. The visual shows price respecting rising moving averages, then resuming upward after MACD and ADX confirm.",
    steps: [
      "EMA_50 stays above EMA_200, so the market bias is long.",
      "Price pulls back toward EMA_20 instead of breaking the trend structure.",
      "MACD flips back above signal while ADX stays above 25, confirming momentum and strength.",
      "The result is a continuation buy, with the stop under the pullback low.",
    ],
    pair: "EUR/USD",
    timeframe: "4H",
    trade: "Buy EUR/USD when price pulls back above EMA_20 while EMA_50 remains above EMA_200.",
    result: {
      status: "Long candidate",
      direction: "Buy",
      condition: "Trend and momentum agree: EMA_50 > EMA_200, MACD is above signal, and ADX confirms a tradable trend.",
      entryZone: "Buy the confirmed pullback close above EMA_20.",
      stop: "Below the pullback swing low or 1 ATR under entry.",
      targets: ["Target 1: 1.5R", "Target 2: 2R", "Runner: trail below EMA_50"],
      confidence: "High when ADX is rising and the pullback holds above EMA_50.",
      summary: "Result: look for a continuation long, not a reversal. The strategy says the pair is still in trend-following mode.",
    },
    components: ["EMA trend filter", "MACD momentum", "ADX trend gate"],
    formula:
      "close > EMA_50 AND EMA_50 > EMA_200 AND MACD > signal AND histogram rising AND ADX_14 > 25",
    entry: "Buy the first pullback close back above EMA_20 after the full stack turns true.",
    risk: "Stop below the pullback swing low; first target 2R, then trail under EMA_50.",
    avoid: "Skip when ADX is below 20 or price is stretched more than 2 ATR above EMA_20.",
  },
  {
    name: "Squeeze Breakout Confirmation",
    regime: "Low-volatility compression",
    bias: "neutral",
    visual: "squeeze",
    explainer:
      "This setup starts with a quiet, compressed range. The strategy does not predict the direction; it waits for price to break out and uses momentum confirmation to choose buy or sell.",
    steps: [
      "Bollinger bandwidth contracts, showing volatility compression.",
      "Price moves sideways inside a defined range.",
      "A candle closes outside the range and outside the squeezed bands.",
      "MACD confirms the breakout direction, turning the result into a buy or sell candidate.",
    ],
    pair: "GBP/USD",
    timeframe: "1H",
    trade: "Buy GBP/USD on an upside range break; sell GBP/USD on a downside range break.",
    result: {
      status: "Breakout watch",
      direction: "Buy or Sell",
      condition: "Volatility is compressed, then price closes outside the range with MACD confirming the breakout direction.",
      entryZone: "Buy above range high, or sell below range low after candle close.",
      stop: "Back inside the compression range beyond the breakout candle midpoint.",
      targets: ["Target 1: range height", "Target 2: 1.5x range height", "Exit: close back inside Bollinger Bands"],
      confidence: "Medium until breakout closes; improves when the breakout candle expands ATR.",
      summary: "Result: wait for direction. The strategy does not choose buy or sell until the range breaks.",
    },
    components: ["Bollinger bandwidth", "Range breakout", "MACD confirmation"],
    formula:
      "bandwidth_20 < percentile(bandwidth_20, 20) AND close > rangeHigh AND MACD > signal",
    entry: "Trade the breakout direction only after the candle closes outside the compression range.",
    risk: "Stop back inside the range; target rangeHeight or exit if price closes back inside bands.",
    avoid: "Avoid breakouts into nearby support/resistance or during low-liquidity session edges.",
  },
  {
    name: "Mean-Reversion Exhaustion",
    regime: "Range or failed trend",
    bias: "bullish",
    visual: "meanReversion",
    explainer:
      "This setup looks for price stretched too far below fair value, then waits for evidence that sellers are losing control. The visual shows a lower-band pierce, support rejection, and snapback toward the middle band.",
    steps: [
      "Price tags or pierces the lower Bollinger Band near support.",
      "RSI is below 30, confirming oversold pressure.",
      "Price rejects the low and closes back above support.",
      "The result is a bounce trade toward SMA_20 or the range midpoint.",
    ],
    pair: "AUD/USD",
    timeframe: "1H",
    trade: "Buy AUD/USD after an oversold lower-band rejection at support.",
    result: {
      status: "Long candidate",
      direction: "Buy",
      condition: "Price rejects the lower Bollinger Band at support and RSI recovers back above 30.",
      entryZone: "Buy the first close back above support after RSI recovery.",
      stop: "Below the rejection low.",
      targets: ["Target 1: SMA_20", "Target 2: range midpoint", "Target 3: opposite range resistance"],
      confidence: "Medium; strongest when ADX is flat or falling below 25.",
      summary: "Result: look for a range bounce. The setup is invalid if the market is trending hard lower.",
    },
    components: ["RSI recovery", "Lower Bollinger Band", "Support retest"],
    formula:
      "close(t-1) <= lowerBand_20,2 AND RSI_14(t-1) < 30 AND RSI_14(t) > 30 AND close > support",
    entry: "Buy the recovery close after price rejects the lower band near defined support.",
    risk: "Stop below the rejection low; target SMA_20 first, then opposite range edge.",
    avoid: "Do not fade strong trends when ADX is rising above 25 against the trade.",
  },
  {
    name: "Pattern Breakout With Trend Filter",
    regime: "Continuation after consolidation",
    bias: "bullish",
    visual: "patternBreakout",
    explainer:
      "This setup turns a chart pattern into a trade only when trend alignment and volatility expansion agree. The visual shows price coiling under resistance, then breaking higher with a measured-move target.",
    steps: [
      "Price forms a bull flag or ascending triangle during an existing uptrend.",
      "EMA_20 remains above EMA_50, keeping the trend filter positive.",
      "Price closes above the pattern boundary while ATR expands.",
      "The result is a breakout buy, targeting the pattern height or flagpole extension.",
    ],
    pair: "USD/JPY",
    timeframe: "4H",
    trade: "Buy USD/JPY when the bull flag or ascending triangle closes above its breakout boundary.",
    result: {
      status: "Long candidate",
      direction: "Buy",
      condition: "Continuation pattern breaks upward while EMA_20 > EMA_50 and ATR expands.",
      entryZone: "Buy breakout close or first retest of the broken pattern boundary.",
      stop: "Below the breakout boundary or below the last higher low.",
      targets: ["Target 1: measured pattern height", "Target 2: flagpole extension", "Runner: trail under higher lows"],
      confidence: "High when breakout candle closes near its high without a long upper wick.",
      summary: "Result: take the continuation breakout only after the pattern confirms. No early entry inside the structure.",
    },
    components: ["Ascending triangle or bull flag", "EMA alignment", "Volume/ATR expansion"],
    formula:
      "(ascendingTriangle OR bullFlag) AND close > patternBreakout AND EMA_20 > EMA_50 AND ATR_14 rising",
    entry: "Buy the breakout close or the first supported retest of the broken pattern boundary.",
    risk: "Stop below the pattern boundary or last higher low; target measured pattern height.",
    avoid: "Skip if breakout candle closes with a long upper wick or fails to expand range.",
  },
  {
    name: "Reversal Confluence",
    regime: "Late trend / exhaustion",
    bias: "bearish",
    visual: "reversal",
    explainer:
      "This setup looks for a mature uptrend failing. The visual shows a head-and-shoulders structure where price breaks the neckline while RSI divergence warns that momentum is no longer confirming new highs.",
    steps: [
      "Price forms a left shoulder, higher head, and weaker right shoulder.",
      "RSI fails to confirm the final high, creating bearish divergence.",
      "Price breaks below the neckline or fails a neckline retest.",
      "The result is a reversal sell, with the stop above the right shoulder.",
    ],
    pair: "EUR/JPY",
    timeframe: "4H",
    trade: "Sell EUR/JPY after the head-and-shoulders neckline breaks with bearish RSI divergence.",
    result: {
      status: "Short candidate",
      direction: "Sell",
      condition: "Head-and-shoulders neckline breaks while RSI divergence shows weakening momentum.",
      entryZone: "Sell neckline break, or sell failed retest of the neckline.",
      stop: "Above the right shoulder.",
      targets: ["Target 1: neckline - pattern height", "Target 2: prior demand zone", "Runner: trail by lower highs"],
      confidence: "Medium-high when the right shoulder stays below the head and the retest fails.",
      summary: "Result: look for a reversal short. The setup fails if price reclaims the neckline and right shoulder.",
    },
    components: ["Head and shoulders", "RSI divergence", "Neckline break"],
    formula:
      "headAndShoulders AND close < neckline AND RSI_high2 < RSI_high1 AND price_high2 >= price_high1",
    entry: "Sell the neckline break, or wait for a failed retest when volatility is elevated.",
    risk: "Stop above the right shoulder; target neckline - patternHeight, then trail by lower highs.",
    avoid: "Avoid if the right shoulder breaks above the head or the neckline is not clearly tested.",
  },
  {
    name: "Candlestick-At-Level Confirmation",
    regime: "Key support/resistance test",
    bias: "neutral",
    visual: "levelReaction",
    explainer:
      "This setup only gives weight to candles that form at important levels. The visual shows price testing support or resistance, printing a reversal candle, then confirming with oscillator direction.",
    steps: [
      "Price reaches a known support or resistance level.",
      "A hammer, engulfing candle, or rejection candle forms at that level.",
      "Stochastic turns in the same direction as the candle signal.",
      "The result is a level-reaction trade; candles in the middle of the range are ignored.",
    ],
    pair: "USD/CAD",
    timeframe: "1H",
    trade: "Buy USD/CAD after a bullish candle at support, or sell after a bearish candle at resistance.",
    result: {
      status: "Two-way level trade",
      direction: "Buy or Sell",
      condition: "A reversal candle forms at a defined support or resistance level and stochastic turns in the same direction.",
      entryZone: "Buy above bullish candle high at support, or sell below bearish candle low at resistance.",
      stop: "Beyond the candle extreme.",
      targets: ["Target 1: next intraday level", "Target 2: 1.5R", "Target 3: 2R if momentum follows through"],
      confidence: "Medium; improves when the candle forms exactly at a tested level.",
      summary: "Result: trade the level reaction. Candles in the middle of the range are ignored.",
    },
    components: ["Engulfing or hammer", "Support/resistance", "Stochastic turn"],
    formula:
      "(bullishEngulfing OR hammer) AND distance(close, support) < 0.25 * ATR_14 AND %K crosses above %D",
    entry: "Enter only after the candle pattern forms at the level and the next close confirms direction.",
    risk: "Stop beyond the candle extreme; target the next level or at least 1.5R.",
    avoid: "Ignore mid-range candles with no nearby level because the pattern has weak context.",
  },
];

const patternPlans: PatternPlan[] = [
  {
    name: "Head and Shoulders",
    family: "Reversal",
    bias: "bearish",
    points: "12,70 30,38 46,67 62,18 78,67 94,40 112,72",
    rails: [{ x1: 18, y1: 68, x2: 108, y2: 68, kind: "neckline" }],
    formula: "leftHigh < headHigh AND rightHigh < headHigh AND close < neckline",
    entry: "Sell neckline break or failed retest.",
    stop: "Above right shoulder.",
    target: "neckline - (headHigh - neckline)",
  },
  {
    name: "Inverse Head and Shoulders",
    family: "Reversal",
    bias: "bullish",
    points: "12,35 30,66 46,38 62,86 78,38 94,66 112,34",
    rails: [{ x1: 18, y1: 38, x2: 108, y2: 38, kind: "neckline" }],
    formula: "leftLow > headLow AND rightLow > headLow AND close > neckline",
    entry: "Buy neckline break or supported retest.",
    stop: "Below right shoulder.",
    target: "neckline + (neckline - headLow)",
  },
  {
    name: "Double Top",
    family: "Reversal",
    bias: "bearish",
    points: "12,74 32,28 54,67 76,29 96,68 114,78",
    rails: [
      { x1: 26, y1: 30, x2: 84, y2: 30, kind: "resistance" },
      { x1: 42, y1: 66, x2: 104, y2: 66, kind: "support" },
    ],
    formula: "abs(top1 - top2) / top1 <= tolerance AND close < neckline",
    entry: "Sell break below valley support.",
    stop: "Above second top.",
    target: "neckline - (avgTop - neckline)",
  },
  {
    name: "Double Bottom",
    family: "Reversal",
    bias: "bullish",
    points: "12,28 32,72 54,35 76,72 96,36 114,24",
    rails: [
      { x1: 26, y1: 72, x2: 84, y2: 72, kind: "support" },
      { x1: 42, y1: 36, x2: 104, y2: 36, kind: "resistance" },
    ],
    formula: "abs(low1 - low2) / low1 <= tolerance AND close > neckline",
    entry: "Buy break above midpoint resistance.",
    stop: "Below second bottom.",
    target: "neckline + (neckline - avgBottom)",
  },
  {
    name: "Ascending Triangle",
    family: "Continuation",
    bias: "bullish",
    points: "10,72 28,35 46,68 64,35 82,58 100,35 116,30",
    rails: [
      { x1: 24, y1: 35, x2: 112, y2: 35, kind: "resistance" },
      { x1: 10, y1: 76, x2: 112, y2: 36, kind: "support" },
    ],
    formula: "equalHighs(resistance) AND higherLows >= 2 AND close > resistance",
    entry: "Buy close above flat resistance.",
    stop: "Below rising support.",
    target: "breakout + triangleHeight",
  },
  {
    name: "Descending Triangle",
    family: "Continuation",
    bias: "bearish",
    points: "10,28 28,68 46,34 64,68 82,44 100,68 116,74",
    rails: [
      { x1: 20, y1: 68, x2: 112, y2: 68, kind: "support" },
      { x1: 10, y1: 28, x2: 112, y2: 68, kind: "resistance" },
    ],
    formula: "equalLows(support) AND lowerHighs >= 2 AND close < support",
    entry: "Sell close below flat support.",
    stop: "Above falling resistance.",
    target: "breakout - triangleHeight",
  },
  {
    name: "Bull Flag",
    family: "Continuation",
    bias: "bullish",
    points: "10,82 30,28 48,44 62,38 78,52 94,46 114,22",
    rails: [
      { x1: 43, y1: 34, x2: 96, y2: 42, kind: "resistance" },
      { x1: 48, y1: 58, x2: 100, y2: 66, kind: "support" },
    ],
    formula: "impulseReturn > threshold AND pullbackChannel slopes against impulse AND close > flagHigh",
    entry: "Buy breakout above flag channel.",
    stop: "Below flag low.",
    target: "breakout + flagpoleHeight",
  },
  {
    name: "Falling Wedge",
    family: "Reversal",
    bias: "bullish",
    points: "12,28 30,62 48,40 66,68 84,52 104,62 116,34",
    rails: [
      { x1: 10, y1: 24, x2: 112, y2: 56, kind: "resistance" },
      { x1: 28, y1: 74, x2: 112, y2: 64, kind: "support" },
    ],
    formula: "lowerHighs AND lowerLows AND channelWidth narrows AND close > upperTrendline",
    entry: "Buy upper trendline breakout.",
    stop: "Below final wedge low.",
    target: "breakout + widestWedgeHeight",
  },
  {
    name: "Bullish Engulfing",
    family: "Candlestick",
    bias: "bullish",
    points: "20,66 38,70 56,64 74,32 96,26 112,18",
    formula: "C1 < O1 AND C > O AND O <= C1 AND C >= O1",
    entry: "Buy above engulfing candle high.",
    stop: "Below engulfing candle low.",
    target: "Next resistance or 1.5R.",
  },
  {
    name: "Hammer at Support",
    family: "Candlestick",
    bias: "bullish",
    points: "12,42 30,68 48,74 66,68 84,54 104,38",
    rails: [{ x1: 10, y1: 72, x2: 112, y2: 72, kind: "support" }],
    formula: "lowerWick >= 2 * body AND upperWick <= body AND close near high AND trendWasDown",
    entry: "Buy confirmation close above hammer high.",
    stop: "Below hammer low.",
    target: "Prior swing high or 2R.",
  },
];

const sources = [
  { label: "FOREX.com chart patterns", href: "https://www.forex.com/en-us/learn-forex-trading/11-chart-patterns-you-should-know/" },
  { label: "Investopedia forex patterns", href: "https://www.investopedia.com/articles/forex/11/most-used-forex-patterns.asp" },
  { label: "Investopedia RSI", href: "https://www.investopedia.com/articles/active-trading/042114/overbought-or-oversold-use-relative-strength-index-find-out.asp" },
  { label: "Investopedia MACD", href: "https://www.investopedia.com/terms/m/macd.asp" },
  { label: "Investopedia Bollinger Bands", href: "https://www.investopedia.com/terms/b/bollingerbands.asp" },
  { label: "Investopedia MA + MACD combo", href: "https://www.investopedia.com/articles/forex/08/macd-combo.asp" },
  { label: "Investopedia ADX", href: "https://www.investopedia.com/articles/trading/07/adx-trend-indicator.asp" },
  { label: "OANDA moving averages", href: "https://www.oanda.com/us-en/trade-tap-blog/trading-knowledge/identify-trends-with-moving-averages/" },
  { label: "StockCharts Bollinger squeeze", href: "https://chartschool.stockcharts.com/table-of-contents/trading-strategies-and-models/trading-strategies/bollinger-band-squeeze" },
  { label: "OANDA head and shoulders", href: "https://www.oanda.com/us-en/trade-tap-blog/analysis/technical/chart-patterns-how-to-trade-head-and-shoulders-pattern/" },
  { label: "TD Bollinger + MACD", href: "https://www.td.com/ca/en/investing/direct-investing/articles/bollinger-bands-and-macds" },
  { label: "StockCharts candlestick dictionary", href: "https://chartschool.stockcharts.com/table-of-contents/chart-analysis/candlestick-charts/candlestick-pattern-dictionary" },
];

export function TradingStrategyPlaybook({ compact = false }: { compact?: boolean }) {
  const visiblePatterns = compact ? patternPlans.slice(0, 6) : patternPlans;
  const visibleFormulas = compact ? indicatorFormulas.slice(0, 4) : indicatorFormulas;
  const visibleCombinations = compact ? combinedStrategies.slice(0, 3) : combinedStrategies;

  return (
    <section className="strategyPlaybook" id="strategy-playbook">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Strategy formulas</p>
          <h2>Forex Pattern & Indicator Playbook</h2>
        </div>
        <span className="quiet">Entries, stops, targets, and boolean rules</span>
      </div>

      <div className="formulaGrid">
        {visibleFormulas.map((strategy) => (
          <article className={`formulaCard signal-${strategy.signal}`} key={strategy.name}>
            <div className="formulaTop">
              <span>{strategy.family}</span>
              <b>{strategy.signal}</b>
            </div>
            <h3>{strategy.name}</h3>
            <p>{strategy.setup}</p>
            <code>{strategy.formula}</code>
            <small>{strategy.execution}</small>
          </article>
        ))}
      </div>

      <div className="sectionHeader strategySubHeader">
        <div>
          <p className="eyebrow">Combined strategies</p>
          <h2>Confluence Setups</h2>
        </div>
        <span className="quiet">Regime + trigger + confirmation + risk rule</span>
      </div>

      <div className="comboGrid">
        {visibleCombinations.map((strategy) => (
          <article className={`comboCard signal-${strategy.bias}`} key={strategy.name}>
            <div className="formulaTop">
              <span>{strategy.regime}</span>
              <b>{strategy.bias}</b>
            </div>
            <h3>{strategy.name}</h3>
            <StrategyVisual strategy={strategy} />
            <p className="comboExplainer">{strategy.explainer}</p>
            <ol className="comboSteps">
              {strategy.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="comboTradePlan">
              <div>
                <span>Pair</span>
                <strong>{strategy.pair}</strong>
              </div>
              <div>
                <span>Timeframe</span>
                <strong>{strategy.timeframe}</strong>
              </div>
              <div className="comboTradeAction">
                <span>Trade</span>
                <strong>{strategy.trade}</strong>
              </div>
            </div>
            <div className="comboComponents" aria-label={`${strategy.name} components`}>
              {strategy.components.map((component) => (
                <span key={component}>{component}</span>
              ))}
            </div>
            <code>{strategy.formula}</code>
            <dl>
              <div>
                <dt>Entry</dt>
                <dd>{strategy.entry}</dd>
              </div>
              <div>
                <dt>Risk</dt>
                <dd>{strategy.risk}</dd>
              </div>
              <div>
                <dt>Avoid</dt>
                <dd>{strategy.avoid}</dd>
              </div>
            </dl>
            <details className="resultDrawer">
              <summary>Open strategy result</summary>
              <StrategyResultTicket strategy={strategy} compact />
            </details>
          </article>
        ))}
      </div>

      <div className="sectionHeader strategySubHeader">
        <div>
          <p className="eyebrow">Strategy results</p>
          <h2>Example Trade Outputs</h2>
        </div>
        <span className="quiet">Pair, direction, entry, stop, targets, and confidence</span>
      </div>

      <div className="strategyResultGrid">
        {visibleCombinations.map((strategy) => (
          <StrategyResultTicket strategy={strategy} key={`${strategy.name}-result`} />
        ))}
      </div>

      <div className="patternGrid">
        {visiblePatterns.map((pattern) => (
          <article className={`patternCard signal-${pattern.bias}`} key={pattern.name}>
            <div className="patternSketchWrap">
              <PatternSketch pattern={pattern} />
            </div>
            <div className="patternBody">
              <div className="formulaTop">
                <span>{pattern.family}</span>
                <b>{pattern.bias}</b>
              </div>
              <h3>{pattern.name}</h3>
              <code>{pattern.formula}</code>
              <dl>
                <div>
                  <dt>Entry</dt>
                  <dd>{pattern.entry}</dd>
                </div>
                <div>
                  <dt>Stop</dt>
                  <dd>{pattern.stop}</dd>
                </div>
                <div>
                  <dt>Target</dt>
                  <dd>{pattern.target}</dd>
                </div>
              </dl>
            </div>
          </article>
        ))}
      </div>

      {!compact ? (
        <div className="sourceStrip" aria-label="Research sources">
          {sources.map((source) => (
            <a href={source.href} key={source.href}>
              {source.label}
            </a>
          ))}
        </div>
      ) : (
        <a className="apiLink strategyMoreLink" href="/strategies">
          Open full playbook
        </a>
      )}
    </section>
  );
}

function StrategyVisual({ strategy }: { strategy: CombinedStrategy }) {
  const id = strategy.name.replaceAll(/\W/g, "-");
  return (
    <svg className={`strategyVisual strategyVisual-${strategy.visual}`} viewBox="0 0 320 170" role="img" aria-label={`${strategy.name} visual setup`}>
      <defs>
        <marker id={`strategy-arrow-${id}`} markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
          <path d="M0,0 L7,3.5 L0,7 Z" />
        </marker>
      </defs>
      <path className="strategyGrid" d="M24 34H296M24 74H296M24 114H296M24 154H296" />
      {strategy.visual === "trend" ? (
        <>
          <path className="strategyAverage slow" d="M28 128 C84 116 138 94 190 76 S262 55 294 42" />
          <path className="strategyAverage fast" d="M28 112 C82 102 126 72 170 70 S222 78 292 38" />
          <polyline className="strategyPrice up" points="28,132 60,112 92,118 122,86 154,94 184,72 214,82 246,56 292,38" />
          <line className="strategyTrigger up" markerEnd={`url(#strategy-arrow-${id})`} x1="218" y1="82" x2="248" y2="58" />
          <text x="34" y="25">Trend filter</text>
          <text x="210" y="32">Buy pullback</text>
          <rect className="indicatorBar good" x="42" y="142" width="42" height="10" />
          <rect className="indicatorBar good" x="92" y="136" width="42" height="16" />
          <rect className="indicatorBar good" x="142" y="130" width="42" height="22" />
          <rect className="indicatorBar good" x="192" y="123" width="42" height="29" />
        </>
      ) : null}
      {strategy.visual === "squeeze" ? (
        <>
          <path className="strategyBand" d="M28 54 C72 64 118 68 164 70 S238 60 292 40" />
          <path className="strategyBand" d="M28 126 C72 114 118 108 164 104 S238 92 292 58" />
          <polyline className="strategyPrice neutral" points="28,92 58,86 88,96 118,88 148,94 178,90 210,84 238,68 292,42" />
          <rect className="squeezeBox" x="84" y="70" width="112" height="36" />
          <line className="strategyTrigger neutral" markerEnd={`url(#strategy-arrow-${id})`} x1="218" y1="69" x2="282" y2="44" />
          <text x="92" y="62">Squeeze</text>
          <text x="224" y="35">Breakout</text>
        </>
      ) : null}
      {strategy.visual === "meanReversion" ? (
        <>
          <path className="strategyBand" d="M28 42 C92 54 154 48 292 60" />
          <path className="strategyAverage slow" d="M28 84 C92 92 154 86 292 92" />
          <path className="strategyBand" d="M28 128 C92 136 154 128 292 134" />
          <polyline className="strategyPrice up" points="28,70 64,88 96,108 128,136 156,122 190,104 226,94 292,78" />
          <line className="supportLine" x1="42" y1="132" x2="178" y2="132" />
          <line className="strategyTrigger up" markerEnd={`url(#strategy-arrow-${id})`} x1="154" y1="122" x2="206" y2="102" />
          <text x="44" y="150">Support reject</text>
          <text x="200" y="82">Snapback</text>
        </>
      ) : null}
      {strategy.visual === "patternBreakout" ? (
        <>
          <polyline className="strategyPrice up" points="28,132 58,82 88,100 120,76 150,94 184,76 216,86 254,54 292,32" />
          <line className="resistanceLine" x1="92" y1="76" x2="226" y2="76" />
          <line className="supportLine" x1="92" y1="118" x2="226" y2="76" />
          <line className="strategyTrigger up" markerEnd={`url(#strategy-arrow-${id})`} x1="226" y1="76" x2="268" y2="48" />
          <text x="96" y="66">Coil</text>
          <text x="230" y="38">Breakout</text>
          <path className="targetMeasure" d="M246 76V38M238 76H254M238 38H254" />
        </>
      ) : null}
      {strategy.visual === "reversal" ? (
        <>
          <polyline className="strategyPrice down" points="28,118 58,66 88,110 124,36 160,112 198,70 234,118 292,142" />
          <line className="necklineLine" x1="72" y1="112" x2="246" y2="118" />
          <polyline className="rsiLine" points="34,150 80,138 126,146 170,136 220,148 286,152" />
          <line className="strategyTrigger down" markerEnd={`url(#strategy-arrow-${id})`} x1="232" y1="118" x2="278" y2="138" />
          <text x="84" y="28">Head</text>
          <text x="198" y="63">RSI divergence</text>
          <text x="228" y="133">Sell break</text>
        </>
      ) : null}
      {strategy.visual === "levelReaction" ? (
        <>
          <polyline className="strategyPrice neutral" points="28,72 62,92 98,112 136,126 174,116 210,94 250,78 292,88" />
          <line className="supportLine" x1="42" y1="126" x2="292" y2="126" />
          <rect className="candleBody up" x="154" y="102" width="16" height="24" />
          <line className="candleWick up" x1="162" y1="86" x2="162" y2="140" />
          <line className="strategyTrigger up" markerEnd={`url(#strategy-arrow-${id})`} x1="176" y1="116" x2="224" y2="94" />
          <text x="54" y="145">Key level</text>
          <text x="154" y="80">Rejection candle</text>
          <text x="222" y="82">Confirm</text>
        </>
      ) : null}
    </svg>
  );
}

function PatternSketch({ pattern }: { pattern: PatternPlan }) {
  const colorClass = pattern.bias === "bearish" ? "sketchBearish" : pattern.bias === "bullish" ? "sketchBullish" : "sketchNeutral";
  return (
    <svg className={`patternSketch ${colorClass}`} viewBox="0 0 124 96" role="img" aria-label={`${pattern.name} pattern sketch`}>
      <defs>
        <marker id={`arrow-${pattern.name.replaceAll(/\W/g, "-")}`} markerHeight="6" markerWidth="6" orient="auto" refX="5" refY="3">
          <path d="M0,0 L6,3 L0,6 Z" />
        </marker>
      </defs>
      <path className="sketchGrid" d="M8 24H116M8 48H116M8 72H116" />
      {pattern.rails?.map((rail, index) => (
        <line className={`sketchRail ${rail.kind}`} key={`${rail.kind}-${index}`} x1={rail.x1} y1={rail.y1} x2={rail.x2} y2={rail.y2} />
      ))}
      <polyline className="sketchPrice" points={pattern.points} />
      <line
        className="sketchProjection"
        markerEnd={`url(#arrow-${pattern.name.replaceAll(/\W/g, "-")})`}
        x1="100"
        y1={pattern.bias === "bearish" ? "58" : "40"}
        x2="116"
        y2={pattern.bias === "bearish" ? "82" : "16"}
      />
    </svg>
  );
}

function StrategyResultTicket({ strategy, compact = false }: { strategy: CombinedStrategy; compact?: boolean }) {
  const { result } = strategy;
  return (
    <article className={`strategyResultTicket signal-${strategy.bias} ${compact ? "compactResultTicket" : ""}`}>
      <div className="resultTicketTop">
        <div>
          <span>{result.status}</span>
          <h3>{strategy.pair}</h3>
        </div>
        <b>{strategy.timeframe}</b>
      </div>
      <div className="resultActionRow">
        <span>{result.direction}</span>
        <strong>{strategy.name}</strong>
      </div>
      <p>{result.summary}</p>
      <dl>
        <div>
          <dt>Condition</dt>
          <dd>{result.condition}</dd>
        </div>
        <div>
          <dt>Entry</dt>
          <dd>{result.entryZone}</dd>
        </div>
        <div>
          <dt>Stop</dt>
          <dd>{result.stop}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{result.confidence}</dd>
        </div>
      </dl>
      <div className="resultTargets" aria-label={`${strategy.name} targets`}>
        {result.targets.map((target) => (
          <span key={target}>{target}</span>
        ))}
      </div>
    </article>
  );
}

export const strategyFormulaCount = indicatorFormulas.length + combinedStrategies.length + patternPlans.length;

export const strategyPlaybookStats = {
  indicatorFormulas: indicatorFormulas.length,
  combinedStrategies: combinedStrategies.length,
  patternRules: patternPlans.length,
  totalRules: indicatorFormulas.length + combinedStrategies.length + patternPlans.length,
} satisfies Record<string, number>;
