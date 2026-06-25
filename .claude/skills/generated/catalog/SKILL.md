---
name: catalog
description: "Skill for the Catalog area of multiAgentTrader. 6 symbols across 1 files."
---

# Catalog

6 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `apps/`
- Understanding how listPublicCatalog, requireRunnableTask, updateCatalogItem work
- Modifying catalog-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/api/src/catalog/catalog.service.ts` | toCatalogPrice, listPublicCatalog, requireRunnableTask, updateCatalogItem, ajvMessage (+1) |

## Entry Points

Start here when exploring this area:

- **`listPublicCatalog`** (Method) — `apps/api/src/catalog/catalog.service.ts:46`
- **`requireRunnableTask`** (Method) — `apps/api/src/catalog/catalog.service.ts:72`
- **`updateCatalogItem`** (Method) — `apps/api/src/catalog/catalog.service.ts:100`
- **`validatePayload`** (Method) — `apps/api/src/catalog/catalog.service.ts:88`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `listPublicCatalog` | Method | `apps/api/src/catalog/catalog.service.ts` | 46 |
| `requireRunnableTask` | Method | `apps/api/src/catalog/catalog.service.ts` | 72 |
| `updateCatalogItem` | Method | `apps/api/src/catalog/catalog.service.ts` | 100 |
| `validatePayload` | Method | `apps/api/src/catalog/catalog.service.ts` | 88 |
| `toCatalogPrice` | Function | `apps/api/src/catalog/catalog.service.ts` | 19 |
| `ajvMessage` | Function | `apps/api/src/catalog/catalog.service.ts` | 33 |

## How to Explore

1. `gitnexus_context({name: "listPublicCatalog"})` — see callers and callees
2. `gitnexus_query({query: "catalog"})` — find related execution flows
3. Read key files listed above for implementation details
