from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import feedparser
import requests

COINGECKO = "https://api.coingecko.com/api/v3/simple/price"

DEFAULT_FEEDS = [
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "https://decrypt.co/feed",
]


def fetch_quotes(ids: list[str] | None = None) -> dict[str, dict[str, float]]:
    asset_ids = ids or ["bitcoin", "ethereum", "solana"]
    response = requests.get(
        COINGECKO,
        params={
            "ids": ",".join(asset_ids),
            "vs_currencies": "usd",
            "include_24hr_change": "true",
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def fetch_headlines(feeds: list[str] | None = None, limit: int = 8) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    seen: set[str] = set()
    for url in feeds or DEFAULT_FEEDS:
        parsed = feedparser.parse(url)
        for entry in parsed.entries:
            title = (entry.get("title") or "").strip()
            link = (entry.get("link") or "").strip()
            if not title or title in seen:
                continue
            seen.add(title)
            items.append(
                {
                    "title": title,
                    "url": link,
                    "source": parsed.feed.get("title") or url,
                    "published": entry.get("published") or "",
                }
            )
            if len(items) >= limit:
                return items
    return items


def build_brief(config: dict[str, Any] | None = None) -> dict[str, Any]:
    research_cfg = (config or {}).get("research") or {}
    quotes = fetch_quotes(research_cfg.get("quote_ids"))
    headlines = fetch_headlines(research_cfg.get("feeds"))
    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "quotes": quotes,
        "headlines": headlines,
    }


def format_usd(value: float) -> str:
    if value >= 1000:
        return f"{value:,.0f}"
    return f"{value:,.2f}"


def change_phrase(change: float) -> str:
    if change > 0.15:
        return f"上漲 {change:.1f}%"
    if change < -0.15:
        return f"下跌 {abs(change):.1f}%"
    return "大致持平"
