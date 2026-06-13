import { MarketCategoryPage } from "../market-category-page";

export default async function CryptoPage() {
  return MarketCategoryPage({
    title: "Crypto",
    eyebrow: "BTC beta, liquidity, on-chain confirmation",
    description:
      "Crypto analysis is scored through BTC beta, macro liquidity, stablecoin supply, ETF/fund flows, relative rotation, network confirmation, and leverage risk.",
    include: (market) => market.assetClass === "crypto",
  });
}
