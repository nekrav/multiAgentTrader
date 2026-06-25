---
name: intelligence
description: "Skill for the Intelligence area of multiAgentTrader. 38 symbols across 2 files."
---

# Intelligence

38 symbols | 2 files | Cohesion: 68%

## When to Use

- Working with code in `apps/`
- Understanding how buildCrossMarketOutput, buildConsensus, driverBias work
- Modifying intelligence-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/api/src/intelligence/intelligence.service.ts` | getDashboard, getNewsBundle, loadExternalNews, normalizeNewsEvents, normalizeNewsAlerts (+23) |
| `apps/api/src/intelligence/intelligence.data.ts` | buildCrossMarketOutput, buildConsensus, driverBias, classifyDependency, dependencySummary (+5) |

## Entry Points

Start here when exploring this area:

- **`buildCrossMarketOutput`** (Function) — `apps/api/src/intelligence/intelligence.data.ts:453`
- **`buildConsensus`** (Function) — `apps/api/src/intelligence/intelligence.data.ts:486`
- **`driverBias`** (Function) — `apps/api/src/intelligence/intelligence.data.ts:554`
- **`classifyDependency`** (Function) — `apps/api/src/intelligence/intelligence.data.ts:583`
- **`dependencySummary`** (Function) — `apps/api/src/intelligence/intelligence.data.ts:600`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `buildCrossMarketOutput` | Function | `apps/api/src/intelligence/intelligence.data.ts` | 453 |
| `buildConsensus` | Function | `apps/api/src/intelligence/intelligence.data.ts` | 486 |
| `driverBias` | Function | `apps/api/src/intelligence/intelligence.data.ts` | 554 |
| `classifyDependency` | Function | `apps/api/src/intelligence/intelligence.data.ts` | 583 |
| `dependencySummary` | Function | `apps/api/src/intelligence/intelligence.data.ts` | 600 |
| `buildAgentOutputs` | Function | `apps/api/src/intelligence/intelligence.data.ts` | 374 |
| `clamp` | Function | `apps/api/src/intelligence/intelligence.data.ts` | 524 |
| `sentimentBias` | Function | `apps/api/src/intelligence/intelligence.data.ts` | 528 |
| `macroSummary` | Function | `apps/api/src/intelligence/intelligence.data.ts` | 535 |
| `buildCandles` | Function | `apps/api/src/intelligence/intelligence.data.ts` | 503 |
| `getDashboard` | Method | `apps/api/src/intelligence/intelligence.service.ts` | 119 |
| `getNewsBundle` | Method | `apps/api/src/intelligence/intelligence.service.ts` | 291 |
| `loadExternalNews` | Method | `apps/api/src/intelligence/intelligence.service.ts` | 329 |
| `normalizeNewsEvents` | Method | `apps/api/src/intelligence/intelligence.service.ts` | 356 |
| `normalizeNewsAlerts` | Method | `apps/api/src/intelligence/intelligence.service.ts` | 369 |
| `normalizeNewsImportance` | Method | `apps/api/src/intelligence/intelligence.service.ts` | 381 |
| `normalizeStringArray` | Method | `apps/api/src/intelligence/intelligence.service.ts` | 388 |
| `normalizeNewsTime` | Method | `apps/api/src/intelligence/intelligence.service.ts` | 395 |
| `getConsensus` | Method | `apps/api/src/intelligence/intelligence.service.ts` | 188 |
| `buildAnalysisSnapshot` | Method | `apps/api/src/intelligence/intelligence.service.ts` | 511 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `OnModuleInit → GetFreshLivePrice` | cross_community | 6 |
| `OnModuleInit → RoundMarketPrice` | cross_community | 6 |
| `OnModuleInit → RoundChange` | cross_community | 6 |
| `GetMarket → GetFreshLivePrice` | cross_community | 6 |
| `GetMarket → RoundMarketPrice` | cross_community | 6 |
| `GetMarket → RoundChange` | cross_community | 6 |
| `GetMarket → Clamp` | cross_community | 6 |
| `GetMarket → Round` | cross_community | 6 |
| `GetMarket → DriverBias` | cross_community | 6 |
| `GetMarket → ClassifyDependency` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| App | 8 calls |

## How to Explore

1. `gitnexus_context({name: "buildCrossMarketOutput"})` — see callers and callees
2. `gitnexus_query({query: "intelligence"})` — find related execution flows
3. Read key files listed above for implementation details
