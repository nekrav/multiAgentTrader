import type { CSSProperties, ReactNode } from "react";
import { HeroIntelMenu } from "../hero-intel-menu";
import { getDashboard, getNewsForSymbols, getTopTrades, type DashboardMarket } from "../market-category-page";
import { TopNav } from "../top-nav";

export default async function CrossMarketPage() {
  const dashboard = await getDashboard();
  const markets = dashboard.markets;
  const strongestConfirmation = [...markets]
    .sort((a, b) => b.dependency.confirmationScore - a.dependency.confirmationScore)
    .slice(0, 5);
  const strongestConflicts = [...markets].sort((a, b) => b.dependency.conflictScore - a.dependency.conflictScore).slice(0, 5);
  const symbols = markets.map((market) => market.symbol);
  const { topNews, latestNews } = getNewsForSymbols(dashboard, symbols);
  const topTrades = getTopTrades(markets);

  return (
    <main className="shell intelligenceShell">
      <TopNav />
      <section className="categoryHero">
        <div className="categoryHeroTop">
          <h1>Cross-Market Analysis</h1>
          <div className="heroStats">
            <Metric label="Markets" value={String(markets.length)} />
            <Metric label="Confirming" value={strongestConfirmation[0]?.label ?? "n/a"} />
            <Metric label="Most Conflict" value={strongestConflicts[0]?.label ?? "n/a"} />
          </div>
        </div>
        <HeroIntelMenu topNews={topNews} latestNews={latestNews} topTrades={topTrades} />
      </section>

      <section className="dashboardColumns">
        <Panel title="Strongest Confirmation">
          <DependencyStack markets={strongestConfirmation} value="confirmation" />
        </Panel>
        <Panel title="Strongest Conflicts">
          <DependencyStack markets={strongestConflicts} value="conflict" />
        </Panel>
      </section>

      <section className="crossMarketGrid">
        {markets.map((market) => (
          <article className={`crossMarketCard bias-${market.consensus.finalBias}`} key={market.symbol}>
            <div className="marketTop">
              <div>
                <span>{market.assetClass}</span>
                <h3>{market.label}</h3>
              </div>
              <a href={`/markets/${market.symbol}`}>Open</a>
            </div>
            <p>{market.dependency.summary}</p>
            <div className="miniBars">
              <Bar label="Confirmation" value={market.dependency.confirmationScore} />
              <Bar label="Conflict" value={market.dependency.conflictScore} danger />
              <Bar label="Adjustment" value={Math.abs(market.dependency.adjustment) * 4} danger={market.dependency.adjustment < 0} />
            </div>
            <div className="dependencyPills">
              {(market.dependency.relatedMarkets ?? []).map((dependency) => (
                <span className={`effectPill effect-${dependency.currentEffect}`} key={`${market.symbol}-${dependency.market}`}>
                  {dependency.market}: {dependency.currentEffect.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panelBlock">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function DependencyStack({ markets, value }: { markets: DashboardMarket[]; value: "confirmation" | "conflict" }) {
  return (
    <div className="stackList">
      {markets.map((market) => (
        <a href={`/markets/${market.symbol}`} className="stackItem" key={market.symbol}>
          <span>{market.label}</span>
          <strong>{pct(value === "confirmation" ? market.dependency.confirmationScore : market.dependency.conflictScore)}</strong>
        </a>
      ))}
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

function Bar({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="barLine">
      <div>
        <span>{label}</span>
        <strong>{pct(value)}</strong>
      </div>
      <i style={{ "--bar-width": `${Math.max(4, Math.min(100, value * 100))}%` } as CSSProperties} className={danger ? "dangerBar" : ""} />
    </div>
  );
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}
