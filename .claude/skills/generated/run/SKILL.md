---
name: run
description: "Skill for the Run area of multiAgentTrader. 28 symbols across 1 files."
---

# Run

28 symbols | 1 files | Cohesion: 83%

## When to Use

- Working with code in `apps/`
- Understanding how RunConsole, submit, applyExample work
- Modifying run-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/app/run/run-console.tsx` | RunConsole, submit, ParameterForm, ParameterSchemaNote, examplesFor (+23) |

## Entry Points

Start here when exploring this area:

- **`RunConsole`** (Function) — `apps/web/app/run/run-console.tsx:370`
- **`submit`** (Function) — `apps/web/app/run/run-console.tsx:420`
- **`applyExample`** (Function) — `apps/web/app/run/run-console.tsx:446`
- **`setPayloadFromControls`** (Function) — `apps/web/app/run/run-console.tsx:450`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `RunConsole` | Function | `apps/web/app/run/run-console.tsx` | 370 |
| `submit` | Function | `apps/web/app/run/run-console.tsx` | 420 |
| `applyExample` | Function | `apps/web/app/run/run-console.tsx` | 446 |
| `setPayloadFromControls` | Function | `apps/web/app/run/run-console.tsx` | 450 |
| `ParameterForm` | Function | `apps/web/app/run/run-console.tsx` | 918 |
| `ParameterSchemaNote` | Function | `apps/web/app/run/run-console.tsx` | 1051 |
| `examplesFor` | Function | `apps/web/app/run/run-console.tsx` | 1062 |
| `isSimpleSchema` | Function | `apps/web/app/run/run-console.tsx` | 1092 |
| `buildDefaults` | Function | `apps/web/app/run/run-console.tsx` | 1096 |
| `coerce` | Function | `apps/web/app/run/run-console.tsx` | 1108 |
| `StrategyProposalBuilder` | Function | `apps/web/app/run/run-console.tsx` | 714 |
| `updateMarket` | Function | `apps/web/app/run/run-console.tsx` | 719 |
| `updateRisk` | Function | `apps/web/app/run/run-console.tsx` | 720 |
| `updatePortfolio` | Function | `apps/web/app/run/run-console.tsx` | 721 |
| `EventStudyBuilder` | Function | `apps/web/app/run/run-console.tsx` | 839 |
| `updateEvent` | Function | `apps/web/app/run/run-console.tsx` | 843 |
| `asRecord` | Function | `apps/web/app/run/run-console.tsx` | 1073 |
| `MarketSnapshotBuilder` | Function | `apps/web/app/run/run-console.tsx` | 631 |
| `StrategySweepBuilder` | Function | `apps/web/app/run/run-console.tsx` | 778 |
| `asStringArray` | Function | `apps/web/app/run/run-console.tsx` | 1077 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `RunConsole → GetToken` | cross_community | 3 |
| `RunConsole → ApiError` | cross_community | 3 |
| `RunConsole → IsSimpleSchema` | intra_community | 3 |
| `RiskEvaluationBuilder → UpdateSnapshot` | intra_community | 3 |
| `Submit → GetToken` | cross_community | 3 |
| `Submit → ApiError` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Setups | 2 calls |

## How to Explore

1. `gitnexus_context({name: "RunConsole"})` — see callers and callees
2. `gitnexus_query({query: "run"})` — find related execution flows
3. Read key files listed above for implementation details
