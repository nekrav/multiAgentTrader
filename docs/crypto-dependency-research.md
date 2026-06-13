# Crypto Dependency Research

Purpose: define dependency pairs and drivers for BTC, ETH, SOL, and major crypto beta. Use this alongside `market-dependency-research.md`.

Crypto should not be modeled as one permanent correlation. The useful framework is:

1. Macro liquidity and risk regime.
2. Crypto market beta led by BTC.
3. Asset-specific network and flow drivers.
4. Leverage/funding/liquidation conditions.
5. Stablecoin liquidity and on-chain capital rotation.

## Universal Crypto Drivers

| Driver | Best Use | Direction | Stability | Notes |
| --- | --- | --- | --- | --- |
| BTC/USD | ETH, SOL, alt market beta | Direct | High | BTC remains the main crypto beta and risk-temperature anchor. |
| Nasdaq 100 / high-beta tech | BTC, ETH, SOL | Direct in risk-on regimes | Medium | BTC correlation with equities has increased since 2020, but can weaken when crypto-specific flows dominate. |
| DXY / broad USD | BTC, ETH, SOL | Usually inverse | Medium | Strong USD tightens global funding and usually pressures risk assets. |
| US real yields | BTC, ETH, SOL | Usually inverse | Medium | Crypto is mostly non-yielding/high-duration risk; rising real yields raise the hurdle rate. |
| Global liquidity / M2 / central-bank liquidity | BTC, ETH, SOL | Direct | Medium-high | Best for cycle/regime context, not intraday timing. |
| Stablecoin supply and exchange balances | Crypto market liquidity | Direct | High | Stablecoin growth and deployable exchange liquidity support risk appetite and leverage. |
| Perp funding / futures basis / open interest | Short-term crypto risk | Regime-dependent | High | Rising price + rising OI + aggressive funding can signal momentum but also liquidation risk. |
| BTC dominance | Alt rotation | Inverse for ETH/SOL relative trades when dominance falls | Medium | Useful for detecting whether capital is concentrated in BTC or rotating into higher-beta assets. |

## Asset Matrix

### BTC/USD

Recommended drivers:

- DXY: inverse, weight 0.75
- US 10Y real yield: inverse, weight 0.70
- Nasdaq 100 / high-beta tech: direct, weight 0.65
- Global liquidity / M2 impulse: direct, weight 0.80
- ETF/fund flows and spot demand: direct, weight 0.85
- Stablecoin supply / exchange dry powder: direct, weight 0.70
- Perp funding and open interest: regime-dependent, weight 0.65

Break conditions:

- Crypto-specific selling, ETF outflows, exchange/custody events, or forced deleveraging can overwhelm macro.
- In some regimes BTC can underperform both gold and tech despite dollar weakness.

### ETH/USD

Recommended drivers:

- BTC/USD: direct, weight 0.80
- ETH/BTC: relative-strength filter, weight 0.90
- Ethereum TVL and stablecoin settlement: direct, weight 0.75
- L2 activity and fee capture: regime-dependent, weight 0.60
- Staking yield vs Treasury yield: direct when staking spread improves, weight 0.55
- DEX volume / DeFi revenue: direct, weight 0.70
- ETF/fund flows: direct, weight 0.75

Break conditions:

- ETH can lag BTC when the market wants store-of-value beta rather than smart-contract beta.
- L2 scaling can increase ecosystem usage while reducing direct L1 fee burn.
- Regulatory or staking-risk headlines can break normal beta relationships.

### SOL/USD

Recommended drivers:

- BTC/USD: direct, weight 0.75
- SOL/ETH: relative smart-contract rotation, weight 0.85
- Solana DEX volume and app revenue: direct, weight 0.85
- Active addresses / transaction count / fee generation: direct, weight 0.75
- Stablecoin supply on Solana: direct, weight 0.70
- Memecoin / retail speculation activity: direct but fragile, weight 0.65
- Network reliability / outage risk: inverse, weight 0.80

Break conditions:

- SOL can outperform on app revenue and retail speculation even if ETH is weak.
- It can underperform sharply when memecoin activity collapses or reliability concerns rise.
- SOL is higher beta; broad crypto drawdowns can dominate strong network metrics.

### ETH/BTC

Recommended drivers:

- DeFi/stablecoin activity relative to Bitcoin ETF/store-of-value demand: direct, weight 0.80
- ETH fee burn / revenue / staking demand: direct, weight 0.75
- BTC dominance: inverse, weight 0.85
- Risk appetite: direct for ETH outperformance, weight 0.65

Use:

- Best pair for deciding whether the market is in store-of-value BTC mode or smart-contract risk mode.

### SOL/ETH

Recommended drivers:

- Solana DEX volume relative to Ethereum + L2 volume: direct, weight 0.80
- App revenue share: direct, weight 0.80
- Stablecoin growth on Solana vs Ethereum/L2s: direct, weight 0.70
- Retail/memecoin activity: direct but high-risk, weight 0.65
- Network reliability: inverse, weight 0.75

Use:

- Best pair for smart-contract platform rotation.

### Total Crypto Market Cap / BTC Dominance

Recommended drivers:

- BTC dominance rising: risk concentration, weaker alt breadth.
- BTC dominance falling while total market cap rises: alt expansion / higher-beta rotation.
- Stablecoin dominance rising while market cap falls: defensive crypto positioning.
- Stablecoin supply rising while dominance falls: deployable liquidity entering risk assets.

## Crypto-Native Metrics To Add

### Market Structure

- Spot volume.
- Perpetual futures open interest.
- Funding rate.
- Annualized futures basis.
- Liquidation clusters.
- Exchange netflows.
- ETF/fund flows where available.

### On-Chain / Network

- Active addresses.
- Transaction count.
- Fees and app revenue.
- Stablecoin supply by chain.
- TVL by chain and protocol.
- DEX volume.
- Bridge inflows/outflows.
- Staking ratio and staking yield.

### Relative Rotation

- BTC dominance.
- ETH/BTC.
- SOL/ETH.
- SOL/BTC.
- Total crypto market cap ex-BTC.
- Total crypto market cap ex-BTC/ETH.

## Scoring Rules

1. Treat BTC as the primary crypto beta anchor.
2. For ETH and SOL, start with BTC beta, then add relative-strength and network-activity adjustments.
3. Use rolling 20/60/120-period correlations against BTC, Nasdaq, DXY, real yields, and stablecoin supply.
4. Add an on-chain confirmation score:
   - stablecoin supply growth,
   - TVL growth,
   - DEX volume,
   - active addresses,
   - fees/revenue.
5. Add leverage risk:
   - high funding + rising OI + stretched price = momentum but higher liquidation risk.
   - negative funding + stable/rising spot price = possible short-squeeze setup.
6. Separate trend confidence from trade safety. A bullish crypto view can still be high-risk if leverage is crowded.

## Recommended Initial App Matrix

| Target | Dependency | Type | Weight |
| --- | --- | --- | --- |
| BTC | DXY | inverse | 0.75 |
| BTC | US real yields | inverse | 0.70 |
| BTC | Nasdaq 100 | direct | 0.65 |
| BTC | global liquidity / M2 | direct | 0.80 |
| BTC | stablecoin supply | direct | 0.70 |
| BTC | ETF/fund flows | direct | 0.85 |
| ETH | BTC | direct | 0.80 |
| ETH | ETH/BTC | direct | 0.90 |
| ETH | Ethereum TVL | direct | 0.75 |
| ETH | stablecoin settlement on Ethereum/L2 | direct | 0.75 |
| ETH | staking yield spread | direct | 0.55 |
| SOL | BTC | direct | 0.75 |
| SOL | SOL/ETH | direct | 0.85 |
| SOL | Solana DEX volume | direct | 0.85 |
| SOL | Solana app revenue | direct | 0.80 |
| SOL | Solana stablecoin supply | direct | 0.70 |
| SOL | network outage/reliability risk | inverse | 0.80 |

## Sources

- CME Group, Bitcoin/equity correlation: https://www.cmegroup.com/insights/economic-research/2025/why-is-bitcoin-moving-in-tandem-with-equities.html
- CME Group, BTC/ETH/SOL market maturity: https://www.cmegroup.com/insights/economic-research/2025/as-crypto-market-matures-whats-next-for-bitcoin-ether-and-solana.html
- New York Fed, Bitcoin macro disconnect: https://libertystreeteconomics.newyorkfed.org/2023/02/is-there-a-bitcoin-macro-disconnect/
- BIS, cross-border crypto and stablecoin flows: https://www.bis.org/publ/work1265.pdf
- BIS, next-generation monetary and financial system / stablecoins: https://www.bis.org/publ/arpdf/ar2025e3.htm
- S&P Global, crypto and macro factors: https://www.spglobal.com/content/dam/spglobal/corporate/en/images/general/special-editorial/are-crypto-markets-correlated-with-macroeconomic-factors.pdf
- S&P Global, Bitcoin volatility trends: https://www.spglobal.com/en/research-insights/special-reports/bitcoin-volatility-trends-deep-dive
- Schwab, Bitcoin price drivers: https://www.schwab.com/learn/story/what-can-drive-bitcoins-price
- MSCI, crypto factor risk model: https://www.msci.com/research-and-insights/blog-post/could-factors-have-explained-cryptocurrency-risk
- Coin Metrics docs for market/on-chain metrics: https://gitbook-docs.coinmetrics.io/resources/faqs
- DeFiLlama chain rankings: https://defillama.com/chains
- Galaxy, Solana Q1 2026 update: https://www.galaxy.com/insights/research/solana-q1-2026-dex-rwa-stablecoins-market-share
- Galaxy, Solana Q4 2025 update: https://www.galaxy.com/insights/research/solana-q4-2025-etfs-perps-prediction-markets-internet-capital-markets
- Ethereum tokenomics/on-chain value research: https://www.frontiersin.org/journals/blockchain/articles/10.3389/fbloc.2026.1817622/full
