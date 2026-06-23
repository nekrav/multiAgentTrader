---
name: users
description: "Skill for the Users area of multiAgentTrader. 4 symbols across 1 files."
---

# Users

4 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `apps/`
- Understanding how createUser, findByEmail, findById work
- Modifying users-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/api/src/users/users.service.ts` | toUser, createUser, findByEmail, findById |

## Entry Points

Start here when exploring this area:

- **`createUser`** (Method) — `apps/api/src/users/users.service.ts:22`
- **`findByEmail`** (Method) — `apps/api/src/users/users.service.ts:37`
- **`findById`** (Method) — `apps/api/src/users/users.service.ts:49`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `createUser` | Method | `apps/api/src/users/users.service.ts` | 22 |
| `findByEmail` | Method | `apps/api/src/users/users.service.ts` | 37 |
| `findById` | Method | `apps/api/src/users/users.service.ts` | 49 |
| `toUser` | Function | `apps/api/src/users/users.service.ts` | 9 |

## How to Explore

1. `gitnexus_context({name: "createUser"})` — see callers and callees
2. `gitnexus_query({query: "users"})` — find related execution flows
3. Read key files listed above for implementation details
