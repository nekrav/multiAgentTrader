---
name: decision-support
description: "Skill for the Decision-support area of multiAgentTrader. 19 symbols across 1 files."
---

# Decision-support

19 symbols | 1 files | Cohesion: 91%

## When to Use

- Working with code in `apps/`
- Understanding how DecisionSupportPage work
- Modifying decision-support-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/app/decision-support/page.tsx` | DecisionSupportContent, buildExposureRows, buildTimingRiskRows, buildCorrelationClusters, buildCluster (+14) |

## Entry Points

Start here when exploring this area:

- **`DecisionSupportPage`** (Function) — `apps/web/app/decision-support/page.tsx:169`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `DecisionSupportPage` | Function | `apps/web/app/decision-support/page.tsx` | 169 |
| `DecisionSupportContent` | Function | `apps/web/app/decision-support/page.tsx` | 196 |
| `buildExposureRows` | Function | `apps/web/app/decision-support/page.tsx` | 606 |
| `buildTimingRiskRows` | Function | `apps/web/app/decision-support/page.tsx` | 637 |
| `buildCorrelationClusters` | Function | `apps/web/app/decision-support/page.tsx` | 677 |
| `buildCluster` | Function | `apps/web/app/decision-support/page.tsx` | 692 |
| `buildExecutionChecks` | Function | `apps/web/app/decision-support/page.tsx` | 707 |
| `getEstimatedSpread` | Function | `apps/web/app/decision-support/page.tsx` | 738 |
| `formatPercent` | Function | `apps/web/app/decision-support/page.tsx` | 804 |
| `buildTradeRecommendations` | Function | `apps/web/app/decision-support/page.tsx` | 539 |
| `buildOpportunityRows` | Function | `apps/web/app/decision-support/page.tsx` | 554 |
| `getStrategyMatches` | Function | `apps/web/app/decision-support/page.tsx` | 751 |
| `getVolatilityRegime` | Function | `apps/web/app/decision-support/page.tsx` | 771 |
| `getLiquidityQuality` | Function | `apps/web/app/decision-support/page.tsx` | 782 |
| `clamp01` | Function | `apps/web/app/decision-support/page.tsx` | 796 |
| `getDashboard` | Function | `apps/web/app/decision-support/page.tsx` | 156 |
| `buildTradeTickets` | Function | `apps/web/app/decision-support/page.tsx` | 578 |
| `getRiskDistance` | Function | `apps/web/app/decision-support/page.tsx` | 792 |
| `formatPrice` | Function | `apps/web/app/decision-support/page.tsx` | 800 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DecisionSupportPage → BuildTradeRecommendations` | cross_community | 3 |
| `DecisionSupportPage → GetVolatilityRegime` | cross_community | 3 |
| `DecisionSupportPage → GetLiquidityQuality` | cross_community | 3 |
| `DecisionSupportPage → GetStrategyMatches` | cross_community | 3 |
| `DecisionSupportPage → GetRiskDistance` | intra_community | 3 |
| `DecisionSupportPage → FormatPrice` | intra_community | 3 |
| `DecisionSupportContent → BuildCluster` | intra_community | 3 |
| `DecisionSupportContent → GetEstimatedSpread` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| App | 1 calls |

## How to Explore

1. `gitnexus_context({name: "DecisionSupportPage"})` — see callers and callees
2. `gitnexus_query({query: "decision-support"})` — find related execution flows
3. Read key files listed above for implementation details
