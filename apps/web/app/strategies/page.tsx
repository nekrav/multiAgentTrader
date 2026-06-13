import { TopNav } from "../top-nav";
import { TradingStrategyPlaybook, strategyPlaybookStats } from "../trading-strategy-playbook";

export default function StrategiesPage() {
  return (
    <main className="shell intelligenceShell" id="main-content">
      <TopNav />
      <section className="categoryHero strategyHero">
        <div className="categoryHeroTop">
          <h1>Trading Strategy Playbook</h1>
          <div className="heroStats">
            <div className="metricTile">
              <span>Indicators</span>
              <strong>{strategyPlaybookStats.indicatorFormulas}</strong>
            </div>
            <div className="metricTile">
              <span>Combinations</span>
              <strong>{strategyPlaybookStats.combinedStrategies}</strong>
            </div>
            <div className="metricTile">
              <span>Patterns</span>
              <strong>{strategyPlaybookStats.patternRules}</strong>
            </div>
            <div className="metricTile">
              <span>Rules</span>
              <strong>{strategyPlaybookStats.totalRules}</strong>
            </div>
          </div>
        </div>
        <p className="heroCopy">
          A formula-first reference for forex-style technical strategies: indicators, candlestick signals, reversal patterns,
          continuation structures, confluence combinations, and the trade plan attached to each setup.
        </p>
      </section>
      <TradingStrategyPlaybook />
    </main>
  );
}
