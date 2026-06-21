import { TopNav } from "../top-nav";
import { getDashboard } from "../market-category-page";

export default async function PricingSourcesPage() {
  const dashboard = await getDashboard();
  const markets = [...dashboard.markets].sort((a, b) => {
    if (a.assetClass === b.assetClass) {
      return a.symbol.localeCompare(b.symbol);
    }
    return a.assetClass.localeCompare(b.assetClass);
  });

  return (
    <main className="shell intelligenceShell">
      <TopNav />
      <a className="backLink" href="/">
        Back to dashboard
      </a>
      <section className="marketDetailHero">
        <div>
          <p className="eyebrow">Data Transparency</p>
          <h1>Pricing references</h1>
          <p className="heroCopy">
            Every listed market price comes from the dashboard feed. Use this page to verify which external feed is currently
            backing each price.
          </p>
        </div>
      </section>

      <section className="pricingSourcesPanel">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Live vs fallback</p>
            <h2>Current market sources</h2>
          </div>
          <span className="quiet">Updated {dashboard.updatedAt || "just now"}</span>
        </div>

        <div className="pricingSourcesTable" role="table" aria-label="Pricing reference list">
          <div className="pricingSourcesRow pricingSourcesHeader" role="row">
            <span role="columnheader">Market</span>
            <span role="columnheader">Price</span>
            <span role="columnheader">Change</span>
            <span role="columnheader">Price status</span>
          </div>

          {markets.map((market) => (
            <div className="pricingSourcesRow pricingSourceLive" role="row" key={market.symbol}>
              <span role="cell" className="pricingSourcesMarket">
                <a href={`/markets/${market.symbol}`}>{market.label}</a>
                <small>{market.assetClass}</small>
              </span>
              <span role="cell" className="pricingSourcesPrice">
                {market.price > 50 ? market.price.toFixed(2) : market.price.toFixed(4)}
              </span>
              <span role="cell" className={market.changePct >= 0 ? "positive" : "negative"}>
                {formatPercent(market.changePct / 100)}
              </span>
              <span role="cell" className="pricingSourcesSourceCol">
                <strong>Dashboard feed</strong>
                <small>
                  <span className="sourceDot" aria-hidden="true" />
                  Internal price feed
                </small>
              </span>
            </div>
          ))}
        </div>

        <p className="quiet">
          Market prices are displayed from the app dashboard feed without external source links.
        </p>
      </section>
    </main>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
