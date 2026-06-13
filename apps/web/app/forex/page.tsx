import { MarketCategoryPage } from "../market-category-page";
import { TradingStrategyPlaybook } from "../trading-strategy-playbook";

export default async function ForexPage() {
  return MarketCategoryPage({
    title: "Forex / Macro",
    eyebrow: "Currencies, gold, oil, dollar drivers",
    description:
      "FX and macro analysis is scored against DXY, rate spreads, real yields, oil, volatility, risk sentiment, and event-sensitive shocks.",
    include: (market) => ["forex", "metal", "energy", "index"].includes(market.assetClass),
    children: <TradingStrategyPlaybook compact />,
  });
}
