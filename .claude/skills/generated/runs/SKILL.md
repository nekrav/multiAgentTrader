---
name: runs
description: "Skill for the Runs area of multiAgentTrader. 30 symbols across 2 files."
---

# Runs

30 symbols | 2 files | Cohesion: 96%

## When to Use

- Working with code in `apps/`
- Understanding how onModuleInit, process, reconcileStaleRuns work
- Modifying runs-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/api/src/runs/runs.processor.ts` | timeoutMs, onModuleInit, process, reconcileStaleRuns, failAndRefund (+10) |
| `apps/api/src/runs/runs.service.ts` | toRun, toSavedAnalysis, listRuns, getRun, saveAnalysis (+10) |

## Entry Points

Start here when exploring this area:

- **`onModuleInit`** (Method) — `apps/api/src/runs/runs.processor.ts:30`
- **`process`** (Method) — `apps/api/src/runs/runs.processor.ts:40`
- **`reconcileStaleRuns`** (Method) — `apps/api/src/runs/runs.processor.ts:78`
- **`failAndRefund`** (Method) — `apps/api/src/runs/runs.processor.ts:97`
- **`processChain`** (Method) — `apps/api/src/runs/runs.processor.ts:106`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `onModuleInit` | Method | `apps/api/src/runs/runs.processor.ts` | 30 |
| `process` | Method | `apps/api/src/runs/runs.processor.ts` | 40 |
| `reconcileStaleRuns` | Method | `apps/api/src/runs/runs.processor.ts` | 78 |
| `failAndRefund` | Method | `apps/api/src/runs/runs.processor.ts` | 97 |
| `processChain` | Method | `apps/api/src/runs/runs.processor.ts` | 106 |
| `failChain` | Method | `apps/api/src/runs/runs.processor.ts` | 151 |
| `loadRun` | Method | `apps/api/src/runs/runs.processor.ts` | 173 |
| `loadChain` | Method | `apps/api/src/runs/runs.processor.ts` | 181 |
| `loadChainSteps` | Method | `apps/api/src/runs/runs.processor.ts` | 198 |
| `buildChainPayload` | Method | `apps/api/src/runs/runs.processor.ts` | 213 |
| `toLoadedRun` | Method | `apps/api/src/runs/runs.processor.ts` | 272 |
| `withTimeout` | Method | `apps/api/src/runs/runs.processor.ts` | 284 |
| `listRuns` | Method | `apps/api/src/runs/runs.service.ts` | 162 |
| `getRun` | Method | `apps/api/src/runs/runs.service.ts` | 180 |
| `saveAnalysis` | Method | `apps/api/src/runs/runs.service.ts` | 197 |
| `getSavedAnalysis` | Method | `apps/api/src/runs/runs.service.ts` | 236 |
| `listAdminRuns` | Method | `apps/api/src/runs/runs.service.ts` | 407 |
| `createTradeSetup` | Method | `apps/api/src/runs/runs.service.ts` | 263 |
| `updateTradeSetup` | Method | `apps/api/src/runs/runs.service.ts` | 285 |
| `createAgentChain` | Method | `apps/api/src/runs/runs.service.ts` | 318 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Process → ToLoadedRun` | intra_community | 4 |
| `Process → NormalizeAsset` | intra_community | 4 |
| `Process → AffectedAssetsFor` | intra_community | 4 |
| `Process → LoadChain` | intra_community | 3 |
| `Process → LoadChainSteps` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "onModuleInit"})` — see callers and callees
2. `gitnexus_query({query: "runs"})` — find related execution flows
3. Read key files listed above for implementation details
