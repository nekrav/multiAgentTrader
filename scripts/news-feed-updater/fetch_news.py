#!/usr/bin/env python3
"""Fetch public market/cross-asset headlines into a JSON file.

No LLM calls. Uses RSS feeds only and writes a deterministic payload consumed
by the API container.
"""
from __future__ import annotations

import hashlib
import html
import json
import os
import re
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Dict, List
from urllib.error import URLError
from urllib.request import Request, urlopen


MARKET_KEYWORDS: Dict[str, List[str]] = {
    "EURUSD": ["eur", "ecb", "euro", "forex", "eurodollar", "euro-dollar", "european", "eurozone", "europe"],
    "GBPUSD": ["gbp", "sterling", "pound", "boe"],
    "USDJPY": ["jpy", "yen", "boj", "tokyo"],
    "USDCAD": ["cad", "bank of canada", "canada", "oil", "canadian"],
    "XAUUSD": ["gold", "xau", "bullion"],
    "USOIL": ["oil", "wti", "crude", "energy", "opec", "petrol", "gasoline"],
    "SPY": ["spx", "s&p", "stock", "equity", "market", "nasdaq", "dow", "index"],
    "QQQ": ["tech", "semiconductor", "ai", "artificial intelligence", "nasdaq", "innovation"],
    "NVDA": ["nvidia", "nvda", "chips", "semis", "gpu"],
    "AAPL": ["apple", "aapl", "iphone", "tim cook"],
    "TSLA": ["tesla", "tsla", "elon"],
    "BTCUSD": ["bitcoin", "btc", "crypto", "cryptocurrency", "etf", "spot btc"],
    "ETHUSD": ["ethereum", "eth", "ether"],
    "SOLUSD": ["solana", "sol", "solusd"],
}


IMPORTANCE_KEYWORDS = {
    "rate": "high",
    "fomc": "high",
    "fed": "high",
    "inflation": "high",
    "nfp": "high",
    "geopolitical": "high",
    "war": "high",
    "conflict": "high",
    "earnings": "medium",
}


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def strip_html(value: str) -> str:
    no_tags = re.sub(r"<[^>]*>", " ", value)
    return html.unescape(normalize_text(no_tags))


def infer_importance(text: str) -> str:
    lowered = text.lower()
    for keyword, level in IMPORTANCE_KEYWORDS.items():
        if keyword in lowered:
            return level
    return "low"


def map_symbols(text: str) -> List[str]:
    lowered = text.lower()
    matches: List[str] = []
    for symbol, keywords in MARKET_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            matches.append(symbol)
    return matches[:5]


def to_iso8601(value: str | None) -> str:
    if not value:
        return datetime.now(timezone.utc).isoformat()
    try:
        parsed = parsedate_to_datetime(value)
        return parsed.isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()


def stable_id(text: str) -> str:
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return digest[:16]


def parse_rss(url: str, max_items: int) -> List[Dict[str, str]]:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 (AiTradersFeedFetcher/1.0)"})
    with urlopen(req, timeout=12) as response:
        payload = response.read().decode("utf-8", errors="ignore")

    root = ET.fromstring(payload)
    channel = root.find("channel")
    if channel is None:
        channel = root
    items = channel.findall("item")

    feed_items: List[Dict[str, str]] = []
    for item in items[: max_items * 2]:
        title = normalize_text(html.unescape((item.findtext("title") or "").replace("\n", " ")))
        if not title:
            continue

        summary = strip_html((item.findtext("description") or "").replace("\n", " ").replace("\r", " "))
        if len(summary) > 280:
            summary = summary[:277] + "..."

        combined = f"{title} {summary}".lower()
        affected = map_symbols(combined)
        if not affected:
            continue

        event_importance = infer_importance(combined)
        published = to_iso8601(item.findtext("pubDate"))

        feed_items.append(
            {
                "id": stable_id(title),
                "time": published,
                "title": title,
                "summary": summary,
                "importance": event_importance,
                "affected": affected,
            }
        )

    return feed_items[:max_items]


def build_payload(max_events: int) -> Dict[str, object]:
    feed_urls = [
        url.strip()
        for url in (
            os.getenv(
                "NEWS_FEEDS",
                "https://news.google.com/rss/search?q=forex&hl=en-US&gl=US&ceid=US:en,"
                "https://news.google.com/rss/search?q=crypto&hl=en-US&gl=US&ceid=US:en",
            )
            .split(",")
        )
        if url.strip()
    ]

    events: List[Dict[str, str]] = []
    alerts: List[Dict[str, str]] = []

    per_feed = max(1, max_events // max(1, len(feed_urls)))
    for url in feed_urls:
        try:
            parsed_items = parse_rss(url, per_feed)
            events.extend(parsed_items)
        except URLError:
            continue
        except ET.ParseError:
            continue
        except Exception:
            continue

    unique: Dict[str, Dict[str, str]] = {}
    for item in events:
        unique[item["id"]] = item

    deduped_events = list(unique.values())
    deduped_events.sort(key=lambda item: item.get("time", ""), reverse=True)

    for event in deduped_events[:max_events]:
        if event["importance"] == "high" and event.get("affected"):
            alerts.append(
                {
                    "id": f"alert-{event['id']}",
                    "market": event["affected"][0],
                    "severity": "warning",
                    "message": f"Breaking headline: {event['title']}",
                    "createdAt": event["time"],
                }
            )

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "script-rss",
        "events": deduped_events[:max_events],
        "alerts": alerts[:8],
    }


def main() -> None:
    interval = int(os.getenv("UPDATE_INTERVAL_SECONDS", "300"))
    output_path = os.getenv("OUTPUT_PATH", "/data/news/latest-news.json")
    max_events = int(os.getenv("MAX_EVENTS", "14"))

    while True:
        payload = build_payload(max_events)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        tmp_path = f"{output_path}.tmp"
        with open(tmp_path, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False)

        os.replace(tmp_path, output_path)
        time.sleep(max(30, interval))


if __name__ == "__main__":
    main()
