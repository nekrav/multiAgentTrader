import { MarketCategoryPage } from "../market-category-page";

export default async function StocksPage() {
  return MarketCategoryPage({
    title: "Stocks",
    eyebrow: "Equity beta, rates, volatility, sector leadership",
    description:
      "Stock analysis is scored through index beta, VIX, real yields, sector leadership, global-dollar effects, and stock-specific momentum.",
    include: (market) => market.assetClass === "equity",
  });
}
