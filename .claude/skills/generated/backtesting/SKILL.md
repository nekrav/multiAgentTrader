---
name: backtesting
description: "Skill for the Backtesting area of multiAgentTrader. 18 symbols across 1 files."
---

# Backtesting

18 symbols | 1 files | Cohesion: 91%

## When to Use

- Working with code in `apps/`
- Understanding how BacktestingConsole, updatePayload, onTextArrayChange work
- Modifying backtesting-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/app/backtesting/backtesting-console.tsx` | parseResult, parseTradeList, toMoney, toTimeLabel, BacktestingConsole (+13) |

## Entry Points

Start here when exploring this area:

- **`BacktestingConsole`** (Function) — `apps/web/app/backtesting/backtesting-console.tsx:318`
- **`updatePayload`** (Function) — `apps/web/app/backtesting/backtesting-console.tsx:398`
- **`onTextArrayChange`** (Function) — `apps/web/app/backtesting/backtesting-console.tsx:533`
- **`onNumberChange`** (Function) — `apps/web/app/backtesting/backtesting-console.tsx:537`
- **`inputToPayload`** (Function) — `apps/web/app/backtesting/backtesting-console.tsx:422`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `BacktestingConsole` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 318 |
| `updatePayload` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 398 |
| `onTextArrayChange` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 533 |
| `onNumberChange` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 537 |
| `inputToPayload` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 422 |
| `runBacktest` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 473 |
| `onSubmit` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 503 |
| `runQuickPreset` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 512 |
| `parseResult` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 108 |
| `parseTradeList` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 122 |
| `toMoney` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 176 |
| `toTimeLabel` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 187 |
| `parseCommaList` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 101 |
| `toFixedPercent` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 169 |
| `strategyColor` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 192 |
| `TradeChart` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 198 |
| `xScale` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 231 |
| `yScale` | Function | `apps/web/app/backtesting/backtesting-console.tsx` | 232 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `OnSubmit → GetToken` | cross_community | 4 |
| `OnSubmit → ApiError` | cross_community | 4 |
| `RunQuickPreset → GetToken` | cross_community | 4 |
| `RunQuickPreset → ApiError` | cross_community | 4 |
| `OnSubmit → ParseCommaList` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Setups | 1 calls |

## How to Explore

1. `gitnexus_context({name: "BacktestingConsole"})` — see callers and callees
2. `gitnexus_query({query: "backtesting"})` — find related execution flows
3. Read key files listed above for implementation details
