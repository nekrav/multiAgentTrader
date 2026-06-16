import { TopNav } from "../top-nav";
import { getDashboard } from "../market-category-page";
import { getPriceReference } from "../lib/pricing-references";

export default async function PricingSourcesPage() {
  const dashboard = await getDashboard();
  const markets = [...dashboard.markets].sort((a, b) => {
    if (a.assetClass === b.assetClass) {
      return a.symbol.localeCompare(b.symbol);
    }
    return a.assetClass.localeCompare(b.assetClass);
  });

  const rows = markets.map((market) => ({
    market,
    reference: getPriceReference(market.symbol, market.label),
  }));

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
            <span role="columnheader">Price source</span>
            <span role="columnheader">Reference</span>
          </div>

          {rows.map(({ market, reference }) => (
            <div
              className={`pricingSourcesRow ${reference.dataMode === "live" ? "pricingSourceLive" : "pricingSourceFallback"}`}
              role="row"
              key={market.symbol}
            >
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
                <strong>{reference.provider}</strong>
                <small>
                  <span className="sourceDot" aria-hidden="true" />
                  {reference.dataMode === "live" ? "Live feed" : "Synthetic / fallback"}
                </small>
              </span>
              <span role="cell" className="pricingSourcesLink">
                <a
                  href={reference.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="secondaryButton"
                  title={`Open ${reference.websiteLabel}`}
                >
                  Open {reference.websiteLabel}
                </a>
              </span>
            </div>
          ))}
        </div>

        <p className="quiet">
          FX symbols and BTC/ETH/SOL are pulled from the live market-data pipeline. Remaining pages resolve to the configured
          reference pages for manual verification.
        </p>
      </section>
    </main>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
