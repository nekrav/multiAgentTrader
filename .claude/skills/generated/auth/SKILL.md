---
name: auth
description: "Skill for the Auth area of multiAgentTrader. 8 symbols across 2 files."
---

# Auth

8 symbols | 2 files | Cohesion: 100%

## When to Use

- Working with code in `apps/`
- Understanding how AuthService, register, login work
- Modifying auth-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/api/src/auth/auth.service.ts` | normalizeEmail, adminEmails, register, login, authResponse (+2) |
| `apps/api/src/auth/auth.service.spec.ts` | createService |

## Entry Points

Start here when exploring this area:

- **`AuthService`** (Class) — `apps/api/src/auth/auth.service.ts:23`
- **`register`** (Method) — `apps/api/src/auth/auth.service.ts:30`
- **`login`** (Method) — `apps/api/src/auth/auth.service.ts:51`
- **`authResponse`** (Method) — `apps/api/src/auth/auth.service.ts:65`
- **`requireValidPassword`** (Method) — `apps/api/src/auth/auth.service.ts:73`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AuthService` | Class | `apps/api/src/auth/auth.service.ts` | 23 |
| `register` | Method | `apps/api/src/auth/auth.service.ts` | 30 |
| `login` | Method | `apps/api/src/auth/auth.service.ts` | 51 |
| `authResponse` | Method | `apps/api/src/auth/auth.service.ts` | 65 |
| `requireValidPassword` | Method | `apps/api/src/auth/auth.service.ts` | 73 |
| `normalizeEmail` | Function | `apps/api/src/auth/auth.service.ts` | 7 |
| `adminEmails` | Function | `apps/api/src/auth/auth.service.ts` | 13 |
| `createService` | Function | `apps/api/src/auth/auth.service.spec.ts` | 21 |

## How to Explore

1. `gitnexus_context({name: "AuthService"})` — see callers and callees
2. `gitnexus_query({query: "auth"})` — find related execution flows
3. Read key files listed above for implementation details
