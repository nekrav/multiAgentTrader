---
name: setups
description: "Skill for the Setups area of multiAgentTrader. 14 symbols across 4 files."
---

# Setups

14 symbols | 4 files | Cohesion: 90%

## When to Use

- Working with code in `apps/`
- Understanding how setToken, apiFetch, TradeSetupsClient work
- Modifying setups-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/app/setups/trade-setups-client.tsx` | TradeSetupsClient, load, createSetup, startChain, saveStep (+4) |
| `apps/web/app/lib/api.ts` | ApiError, setToken, apiFetch |
| `apps/web/app/run/run-console.tsx` | saveLatestRun |
| `apps/web/app/login/login-form.tsx` | submit |

## Entry Points

Start here when exploring this area:

- **`setToken`** (Function) — `apps/web/app/lib/api.ts:16`
- **`apiFetch`** (Function) — `apps/web/app/lib/api.ts:24`
- **`TradeSetupsClient`** (Function) — `apps/web/app/setups/trade-setups-client.tsx:79`
- **`load`** (Function) — `apps/web/app/setups/trade-setups-client.tsx:105`
- **`createSetup`** (Function) — `apps/web/app/setups/trade-setups-client.tsx:119`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ApiError` | Class | `apps/web/app/lib/api.ts` | 2 |
| `setToken` | Function | `apps/web/app/lib/api.ts` | 16 |
| `apiFetch` | Function | `apps/web/app/lib/api.ts` | 24 |
| `TradeSetupsClient` | Function | `apps/web/app/setups/trade-setups-client.tsx` | 79 |
| `load` | Function | `apps/web/app/setups/trade-setups-client.tsx` | 105 |
| `createSetup` | Function | `apps/web/app/setups/trade-setups-client.tsx` | 119 |
| `startChain` | Function | `apps/web/app/setups/trade-setups-client.tsx` | 141 |
| `saveStep` | Function | `apps/web/app/setups/trade-setups-client.tsx` | 176 |
| `saveLatestRun` | Function | `apps/web/app/run/run-console.tsx` | 455 |
| `submit` | Function | `apps/web/app/login/login-form.tsx` | 21 |
| `setupStrategies` | Function | `apps/web/app/setups/trade-setups-client.tsx` | 383 |
| `isForex` | Function | `apps/web/app/setups/trade-setups-client.tsx` | 397 |
| `setupBacktestEnabled` | Function | `apps/web/app/setups/trade-setups-client.tsx` | 401 |
| `setupBacktestDays` | Function | `apps/web/app/setups/trade-setups-client.tsx` | 405 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `TradeSetupsClient → GetToken` | cross_community | 4 |
| `TradeSetupsClient → ApiError` | intra_community | 4 |
| `OnSubmit → GetToken` | cross_community | 4 |
| `OnSubmit → ApiError` | cross_community | 4 |
| `RunQuickPreset → GetToken` | cross_community | 4 |
| `RunQuickPreset → ApiError` | cross_community | 4 |
| `TradeSetupsClient → IsForex` | intra_community | 3 |
| `StartChain → GetToken` | cross_community | 3 |
| `StartChain → ApiError` | intra_community | 3 |
| `StartChain → IsForex` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| App | 1 calls |

## How to Explore

1. `gitnexus_context({name: "setToken"})` — see callers and callees
2. `gitnexus_query({query: "setups"})` — find related execution flows
3. Read key files listed above for implementation details
