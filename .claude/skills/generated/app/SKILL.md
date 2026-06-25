---
name: app
description: "Skill for the App area of multiAgentTrader. 115 symbols across 18 files."
---

# App

115 symbols | 18 files | Cohesion: 88%

## When to Use

- Working with code in `apps/`
- Understanding how AgentResult, SignalCarousel, round work
- Modifying app-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/app/agents-dashboard.tsx` | AgentResult, MarketDataResult, PriceLineChart, CandlestickChart, VolatilityStrip (+31) |
| `apps/web/app/page.tsx` | BeginnerSnapshot, DecisionSupportRoadmap, TraderDecisionPanel, StackedMarkets, buildExposureRows (+16) |
| `apps/web/app/market-category-page.tsx` | CategoryMarketCard, StackList, Bar, formatPrice, formatPercent (+7) |
| `apps/web/app/live-home-dashboard.tsx` | TickerMove, recommendedMove, formatPercent, LiveHomeDashboard, refreshLiveData (+5) |
| `apps/web/app/top-nav.tsx` | readCookie, readThemeCookie, readDesignCookie, TopNav, saveCookie (+2) |
| `apps/web/app/cross-market/page.tsx` | DependencyStack, Bar, pct, CrossMarketPage |
| `apps/web/app/terminal-chart-panel-client.tsx` | TerminalChartPanel, formatPrice, formatPercent, formatSignedPercent |
| `apps/web/app/signal-carousel.tsx` | clamp, formatPercent, SignalCarousel |
| `apps/api/src/intelligence/intelligence.service.ts` | getIngestionHealth, getNewsIngestionStatus, getNewsFeedUpdatedAt |
| `apps/web/app/browser-clock.tsx` | getBrowserTime, BrowserClock, update |

## Entry Points

Start here when exploring this area:

- **`AgentResult`** (Function) — `apps/web/app/agents-dashboard.tsx:252`
- **`SignalCarousel`** (Function) — `apps/web/app/signal-carousel.tsx:44`
- **`round`** (Function) — `apps/api/src/intelligence/intelligence.data.ts:520`
- **`AdminPage`** (Function) — `apps/web/app/admin/page.tsx:26`
- **`TopNav`** (Function) — `apps/web/app/top-nav.tsx:83`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AgentResult` | Function | `apps/web/app/agents-dashboard.tsx` | 252 |
| `SignalCarousel` | Function | `apps/web/app/signal-carousel.tsx` | 44 |
| `round` | Function | `apps/api/src/intelligence/intelligence.data.ts` | 520 |
| `AdminPage` | Function | `apps/web/app/admin/page.tsx` | 26 |
| `TopNav` | Function | `apps/web/app/top-nav.tsx` | 83 |
| `getToken` | Function | `apps/web/app/lib/api.ts` | 12 |
| `clearToken` | Function | `apps/web/app/lib/api.ts` | 20 |
| `AgentsDashboard` | Function | `apps/web/app/agents-dashboard.tsx` | 72 |
| `runAgent` | Function | `apps/web/app/agents-dashboard.tsx` | 80 |
| `getTopTrades` | Function | `apps/web/app/market-category-page.tsx` | 230 |
| `getNewsForSymbols` | Function | `apps/web/app/market-category-page.tsx` | 250 |
| `matches` | Function | `apps/web/app/market-category-page.tsx` | 252 |
| `marketLabel` | Function | `apps/web/app/market-category-page.tsx` | 253 |
| `CrossMarketPage` | Function | `apps/web/app/cross-market/page.tsx` | 5 |
| `TerminalChartPanel` | Function | `apps/web/app/terminal-chart-panel-client.tsx` | 51 |
| `Home` | Function | `apps/web/app/page.tsx` | 187 |
| `getDashboard` | Function | `apps/web/app/market-category-page.tsx` | 69 |
| `PricingSourcesPage` | Function | `apps/web/app/pricing-sources/page.tsx` | 3 |
| `MarketCategoryPage` | Function | `apps/web/app/market-category-page.tsx` | 86 |
| `StocksPage` | Function | `apps/web/app/stocks/page.tsx` | 2 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `GetMarket → Round` | cross_community | 6 |
| `OnModuleInit → Round` | cross_community | 5 |
| `TradeSetupsClient → GetToken` | cross_community | 4 |
| `MarketDataResult → IsRecord` | intra_community | 4 |
| `MarketDataResult → NumberAt` | intra_community | 4 |
| `OnSubmit → GetToken` | cross_community | 4 |
| `StocksPage → EmptyDashboard` | cross_community | 4 |
| `StocksPage → Matches` | cross_community | 4 |
| `StocksPage → MarketLabel` | cross_community | 4 |
| `ForexPage → EmptyDashboard` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Intelligence | 1 calls |

## How to Explore

1. `gitnexus_context({name: "AgentResult"})` — see callers and callees
2. `gitnexus_query({query: "app"})` — find related execution flows
3. Read key files listed above for implementation details
