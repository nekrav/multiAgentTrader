---
name: credits
description: "Skill for the Credits area of multiAgentTrader. 10 symbols across 2 files."
---

# Credits

10 symbols | 2 files | Cohesion: 73%

## When to Use

- Working with code in `apps/`
- Understanding how InsufficientCreditsError, CreditsService, reserve work
- Modifying credits-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/api/src/credits/credits.service.ts` | InsufficientCreditsError, toBigInt, reserve, postEntry, grant (+4) |
| `apps/api/src/credits/credits.service.unit.spec.ts` | serviceWithClient |

## Entry Points

Start here when exploring this area:

- **`InsufficientCreditsError`** (Class) — `apps/api/src/credits/credits.service.ts:7`
- **`CreditsService`** (Class) — `apps/api/src/credits/credits.service.ts:52`
- **`reserve`** (Method) — `apps/api/src/credits/credits.service.ts:86`
- **`postEntry`** (Method) — `apps/api/src/credits/credits.service.ts:128`
- **`grant`** (Method) — `apps/api/src/credits/credits.service.ts:80`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `InsufficientCreditsError` | Class | `apps/api/src/credits/credits.service.ts` | 7 |
| `CreditsService` | Class | `apps/api/src/credits/credits.service.ts` | 52 |
| `reserve` | Method | `apps/api/src/credits/credits.service.ts` | 86 |
| `postEntry` | Method | `apps/api/src/credits/credits.service.ts` | 128 |
| `grant` | Method | `apps/api/src/credits/credits.service.ts` | 80 |
| `settle` | Method | `apps/api/src/credits/credits.service.ts` | 97 |
| `refund` | Method | `apps/api/src/credits/credits.service.ts` | 115 |
| `withTransaction` | Method | `apps/api/src/credits/credits.service.ts` | 164 |
| `toBigInt` | Function | `apps/api/src/credits/credits.service.ts` | 34 |
| `serviceWithClient` | Function | `apps/api/src/credits/credits.service.unit.spec.ts` | 4 |

## How to Explore

1. `gitnexus_context({name: "InsufficientCreditsError"})` — see callers and callees
2. `gitnexus_query({query: "credits"})` — find related execution flows
3. Read key files listed above for implementation details
