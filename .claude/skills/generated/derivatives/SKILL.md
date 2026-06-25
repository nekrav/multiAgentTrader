---
name: derivatives
description: "Skill for the Derivatives area of multiAgentTrader. 22 symbols across 2 files."
---

# Derivatives

22 symbols | 2 files | Cohesion: 88%

## When to Use

- Working with code in `apps/`
- Understanding how DerivativesPage, getFutureAgents, getFutureConsensus work
- Modifying derivatives-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/app/derivatives/page.tsx` | apiGet, getDerivativesData, DerivativesPage, CurveCard, curveLabel (+10) |
| `apps/api/src/derivatives/derivatives.service.ts` | timeframeOrDefault, getFutureAgents, getFutureConsensus, getOptionAgents, getOptionConsensus (+2) |

## Entry Points

Start here when exploring this area:

- **`DerivativesPage`** (Function) — `apps/web/app/derivatives/page.tsx:139`
- **`getFutureAgents`** (Method) — `apps/api/src/derivatives/derivatives.service.ts:39`
- **`getFutureConsensus`** (Method) — `apps/api/src/derivatives/derivatives.service.ts:43`
- **`getOptionAgents`** (Method) — `apps/api/src/derivatives/derivatives.service.ts:79`
- **`getOptionConsensus`** (Method) — `apps/api/src/derivatives/derivatives.service.ts:83`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `DerivativesPage` | Function | `apps/web/app/derivatives/page.tsx` | 139 |
| `getFutureAgents` | Method | `apps/api/src/derivatives/derivatives.service.ts` | 39 |
| `getFutureConsensus` | Method | `apps/api/src/derivatives/derivatives.service.ts` | 43 |
| `getOptionAgents` | Method | `apps/api/src/derivatives/derivatives.service.ts` | 79 |
| `getOptionConsensus` | Method | `apps/api/src/derivatives/derivatives.service.ts` | 83 |
| `latestAgentOutputs` | Method | `apps/api/src/derivatives/derivatives.service.ts` | 95 |
| `latestAgentOutput` | Method | `apps/api/src/derivatives/derivatives.service.ts` | 104 |
| `apiGet` | Function | `apps/web/app/derivatives/page.tsx` | 99 |
| `getDerivativesData` | Function | `apps/web/app/derivatives/page.tsx` | 112 |
| `CurveCard` | Function | `apps/web/app/derivatives/page.tsx` | 244 |
| `curveLabel` | Function | `apps/web/app/derivatives/page.tsx` | 345 |
| `spreadDetail` | Function | `apps/web/app/derivatives/page.tsx` | 355 |
| `maxCurvePrice` | Function | `apps/web/app/derivatives/page.tsx` | 360 |
| `labelBias` | Function | `apps/web/app/derivatives/page.tsx` | 377 |
| `timeframeOrDefault` | Function | `apps/api/src/derivatives/derivatives.service.ts` | 4 |
| `VolSurfaceCard` | Function | `apps/web/app/derivatives/page.tsx` | 268 |
| `OptionMiniCard` | Function | `apps/web/app/derivatives/page.tsx` | 287 |
| `AgentTable` | Function | `apps/web/app/derivatives/page.tsx` | 297 |
| `StrategyCard` | Function | `apps/web/app/derivatives/page.tsx` | 323 |
| `getNumber` | Function | `apps/web/app/derivatives/page.tsx` | 364 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DerivativesPage → GetNumber` | cross_community | 4 |
| `CurveCard → GetNumber` | cross_community | 4 |
| `DerivativesPage → ApiGet` | intra_community | 3 |
| `AgentTable → GetNumber` | intra_community | 3 |
| `VolSurfaceCard → GetNumber` | intra_community | 3 |
| `OptionMiniCard → GetNumber` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "DerivativesPage"})` — see callers and callees
2. `gitnexus_query({query: "derivatives"})` — find related execution flows
3. Read key files listed above for implementation details
