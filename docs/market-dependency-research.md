# Market Dependency Research

Purpose: define the highest-value dependencies to monitor for forex, gold, oil, DXY, and macro-driver analysis.

This should drive the app's dependency matrix, scoring, alerting, and market detail pages. Relationships are not permanent rules. They should be scored with rolling correlation, lead/lag checks, volatility regime, event flags, and source-of-shock classification.

## Priority Dependencies

### Universal Drivers

| Driver | Best Use | Direction | Stability | Notes |
| --- | --- | --- | --- | --- |
| DXY / broad USD | FX, gold, oil, risk regime | Usually inverse to EUR/USD, GBP/USD, AUD/USD, XAU/USD; direct to USD pairs | High for FX, medium for commodities | Treat USD as both a rate-differential and risk/liquidity factor. |
| US 2Y yield / Fed pricing | DXY, EUR/USD, GBP/USD | Higher US front-end yields usually support USD | High | Best proxy for monetary-policy expectation shocks. |
| US 10Y yield / US-JP spread | USD/JPY | Higher US long yields and wider spread usually support USD/JPY | High | Watch intervention/carry-unwind regimes separately. |
| 10Y real yield | XAU/USD | Inverse | High | One of the strongest deterministic gold inputs. |
| VIX / risk sentiment | DXY, USD/JPY, AUD/USD, XAU/USD, oil | Regime-dependent | Medium | Risk-off can support USD and gold together, pressure AUD and oil, and strengthen JPY during carry unwinds. |
| WTI crude oil | USD/CAD, CAD crosses, inflation impulse | Usually inverse to USD/CAD | Medium | Relationship has weakened and depends on whether the oil shock is demand, supply, or USD-driven. |

## Market Matrix

### DXY / USD Strength

Recommended drivers:

- US 2Y yield / Fed pricing: direct, weight 0.95
- US 10Y real yield: direct, weight 0.85
- Global risk / VIX / financial conditions: direct in risk-off, weight 0.80
- EUR/USD: inverse, weight 0.90
- Oil / commodities: regime-dependent, weight 0.45

Break conditions:

- US growth shock that lowers yields but still raises USD through safe-haven demand.
- Commodity/inflation shock where oil and USD rise together.

### EUR/USD

Recommended drivers:

- DXY: inverse, weight 0.95
- Euro-area minus US 2Y yield spread: direct, weight 0.90
- Fed/ECB expected policy spread: direct, weight 0.85
- European energy terms of trade: inverse to energy stress, weight 0.55
- Risk sentiment: regime-dependent, weight 0.45

Break conditions:

- EUR-specific political stress.
- Dollar safe-haven episodes overwhelming rate spread signals.

### GBP/USD

Recommended drivers:

- DXY: inverse, weight 0.90
- UK minus US 2Y yield spread: direct, weight 0.80
- EUR/USD: direct, weight 0.65
- UK risk premium / gilt stress: inverse, weight 0.60
- Risk sentiment: regime-dependent, weight 0.45

Break conditions:

- UK fiscal or gilt-market stress.
- Large divergence between ECB and BoE expectations.

### USD/JPY

Recommended drivers:

- US 10Y yield: direct, weight 0.95
- US-Japan 10Y yield spread: direct, weight 1.00
- US 2Y yield / Fed pricing: direct, weight 0.75
- DXY: direct, weight 0.70
- VIX / carry unwind: inverse in panic regimes, weight 0.80

Break conditions:

- Japanese intervention risk.
- Risk-off deleveraging where JPY strengthens even if US yields stay firm.

### USD/CAD

Recommended drivers:

- WTI crude oil: inverse, weight 0.75
- DXY: direct, weight 0.85
- US-Canada 2Y yield spread: direct, weight 0.75
- Global risk sentiment: direct in USD-risk-off regimes, weight 0.55

Break conditions:

- Oil supply shock that strengthens USD and oil at the same time.
- CAD/oil decoupling when Canadian rate spread or capital flows dominate.

### AUD/USD

Recommended drivers:

- DXY: inverse, weight 0.90
- China proxy / CNH / China equity/credit impulse: direct, weight 0.80
- Iron ore / RBA commodity index: direct, weight 0.80
- Risk sentiment / equities: direct, weight 0.75
- Australia-US 2Y yield spread: direct, weight 0.65

Break conditions:

- China shock that is offset by broad USD weakness.
- RBA repricing that dominates commodity/risk signals.

### XAU/USD

Recommended drivers:

- US 10Y real yield: inverse, weight 1.00
- DXY: inverse, weight 0.90
- VIX/geopolitical stress: direct in event regimes, weight 0.70
- Inflation expectations / breakevens: direct, weight 0.55
- Oil: weak direct inflation/geopolitical channel, weight 0.35

Break conditions:

- Safe-haven regime where gold and USD rise together.
- Liquidity crisis where gold is sold to raise cash.

### WTI Crude Oil

Recommended drivers:

- DXY: inverse in normal regimes, weight 0.65
- Global growth / risk sentiment / equities: direct, weight 0.80
- Inventory surprise: event-sensitive, weight 0.80
- Supply shock / geopolitical score: event-sensitive, weight 1.00
- China demand proxy: direct, weight 0.70

Break conditions:

- Supply shock where oil rises while risk assets weaken.
- USD-oil positive-correlation regime.

## Scoring Rules

1. Maintain a static prior matrix with direction, weight, and regime notes.
2. Calculate rolling correlations over 20, 60, and 120 periods.
3. Calculate lead/lag correlation for candidate leading drivers.
4. Reduce weights when current rolling correlation contradicts the static prior.
5. Add an event override layer for central-bank, inflation, jobs, inventory, intervention, geopolitical, and supply-shock events.
6. Surface conflicts instead of hiding them. A market can be directionally bullish and still have low-confidence dependency confirmation.

## Suggested App Data Feeds

- DXY or broad dollar index: Federal Reserve H.10 dollar indexes.
- US yields: FRED DGS2 and DGS10.
- US real yield: FRED DFII10.
- WTI: FRED DCOILWTICO, futures feed later.
- VIX: Cboe or FRED VIXCLS.
- Gold: XAU/USD or COMEX/LBMA feed.
- Rate spreads: US 2Y minus Germany/UK/Australia/Canada/Japan 2Y where available.
- China proxy: USD/CNH, CNH index, China equity index, iron ore.

## Sources

- BIS, "The dollar exchange rate as a global risk factor": https://www.bis.org/publ/work695.pdf
- BIS, "Commodity prices and the US Dollar": https://www.bis.org/publ/work1083.pdf
- Federal Reserve, H.10 dollar indexes: https://www.federalreserve.gov/releases/h10/summary/
- Federal Reserve, "Monetary Policy and Exchange Rates during the Global Tightening": https://www.federalreserve.gov/econres/notes/feds-notes/monetary-policy-and-exchange-rates-during-the-global-tightening-20240510.html
- Federal Reserve, "Sensitivity of the U.S. Dollar Exchange Rate to Changes in Monetary Policy Expectations": https://www.federalreserve.gov/econres/notes/ifdp-notes/the-sensitivity-of-the-us-dollar-exchange-rate-to-changes-in-monetary-policy-expectations-20170922.htm
- Chicago Fed, "What Drives Gold Prices?": https://www.chicagofed.org/publications/chicago-fed-letter/2021/464
- FRED 10Y real yield DFII10: https://fred.stlouisfed.org/series/DFII10
- FRED WTI DCOILWTICO: https://fred.stlouisfed.org/series/DCOILWTICO
- FRED/Cboe VIXCLS: https://fred.stlouisfed.org/series/VIXCLS
- Cboe VIX historical data: https://www.cboe.com/tradable_products/vix/vix_historical_data
- Bank of Canada, Canadian dollar systematic variation and oil: https://www.bankofcanada.ca/2017/02/staff-analytical-note-2017-1/
- ECB, "The link between oil prices and the US dollar": https://www.ecb.europa.eu/press/economic-bulletin/focus/2024/html/ecb.ebbox202407_02~5ce155d504.en.html
- RBA, "Determinants of the Australian Dollar Over Recent Years": https://www.rba.gov.au/publications/bulletin/2021/mar/pdf/determinants-of-the-australian-dollar-over-recent-years.pdf
- European Commission, "Euro-US Dollar Exchange Rate Dynamics": https://economy-finance.ec.europa.eu/system/files/2020-11/eb055_en.pdf
