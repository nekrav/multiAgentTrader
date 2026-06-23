---
name: news-feed-updater
description: "Skill for the News-feed-updater area of multiAgentTrader. 9 symbols across 1 files."
---

# News-feed-updater

9 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `scripts/`
- Understanding how normalize_text, strip_html, infer_importance work
- Modifying news-feed-updater-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `scripts/news-feed-updater/fetch_news.py` | normalize_text, strip_html, infer_importance, map_symbols, to_iso8601 (+4) |

## Entry Points

Start here when exploring this area:

- **`normalize_text`** (Function) — `scripts/news-feed-updater/fetch_news.py:53`
- **`strip_html`** (Function) — `scripts/news-feed-updater/fetch_news.py:57`
- **`infer_importance`** (Function) — `scripts/news-feed-updater/fetch_news.py:62`
- **`map_symbols`** (Function) — `scripts/news-feed-updater/fetch_news.py:70`
- **`to_iso8601`** (Function) — `scripts/news-feed-updater/fetch_news.py:79`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `normalize_text` | Function | `scripts/news-feed-updater/fetch_news.py` | 53 |
| `strip_html` | Function | `scripts/news-feed-updater/fetch_news.py` | 57 |
| `infer_importance` | Function | `scripts/news-feed-updater/fetch_news.py` | 62 |
| `map_symbols` | Function | `scripts/news-feed-updater/fetch_news.py` | 70 |
| `to_iso8601` | Function | `scripts/news-feed-updater/fetch_news.py` | 79 |
| `stable_id` | Function | `scripts/news-feed-updater/fetch_news.py` | 89 |
| `parse_rss` | Function | `scripts/news-feed-updater/fetch_news.py` | 94 |
| `build_payload` | Function | `scripts/news-feed-updater/fetch_news.py` | 137 |
| `main` | Function | `scripts/news-feed-updater/fetch_news.py` | 193 |

## How to Explore

1. `gitnexus_context({name: "normalize_text"})` — see callers and callees
2. `gitnexus_query({query: "news-feed-updater"})` — find related execution flows
3. Read key files listed above for implementation details
