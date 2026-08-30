from __future__ import annotations

import re
from datetime import date
from typing import Any

from crypto_studio import DISCLAIMER
from crypto_studio.research import change_phrase, format_usd


ASSET_NAMES = {
    "bitcoin": "比特幣",
    "ethereum": "以太坊",
    "solana": "索拉納",
}


def _quote_line(asset_id: str, payload: dict[str, float]) -> str:
    name = ASSET_NAMES.get(asset_id, asset_id)
    usd = payload.get("usd") or 0
    change = payload.get("usd_24h_change") or 0
    return f"{name}約 {format_usd(usd)} 美元，近二十四小時{change_phrase(change)}。"


def compose_episode(brief: dict[str, Any], channel_name: str = "時局筆記") -> dict[str, Any]:
    """Turn a research brief into a reviewable episode. No buy/sell calls."""
    today = date.today().isoformat()
    quotes = brief.get("quotes") or {}
    headlines = brief.get("headlines") or []
    top = headlines[:3]

    quote_lines = [_quote_line(asset_id, data) for asset_id, data in quotes.items()]
    price_block = " ".join(quote_lines) if quote_lines else "價格資料暫時無法取得。"

    fact_scenes = []
    for index, item in enumerate(top, start=1):
        title = item.get("title") or ""
        fact_scenes.append(
            {
                "heading": f"事實 {index}",
                "body": (
                    f"{title}。"
                    "這是正在發生的新聞，不是保證會漲或會跌的理由。"
                    "請以原始報導為準，數字與法案進度都可能在幾小時內改變。"
                ),
            }
        )
    if not fact_scenes:
        fact_scenes = [
            {
                "heading": "資料不足",
                "body": "今天沒有抓到可靠頭條。與其硬編時局，不如停更，避免把猜測講成事實。",
            }
        ]

    scenes = [
        {
            "heading": "今天只講時局",
            "body": (
                f"這裡是{channel_name}。今天是 {today}。{price_block}"
                "接下來三則只核對事實與日曆，不喊單、不給目標價、也不做獲利承諾。"
            ),
        },
        *fact_scenes,
        {
            "heading": "這代表什麼",
            "body": (
                "監管與機構管道會改變誰能進場、用什麼工具進場，"
                "但不會取消利率、流動性與槓桿風險。"
                "把「法案主推」直接換成「未來一定大好」，是把政治日程誤當成投資結論。"
            ),
        },
        {
            "heading": "這不代表什麼",
            "body": (
                "這不代表現在應該加碼或清倉。"
                "也不代表所有代幣都會受益：合規資金通常先留在大型資產、穩定幣與受監管產品。"
            ),
        },
        {
            "heading": "免責聲明",
            "body": DISCLAIMER + "若你還沒有虧得起的閒置資金，就不該把生活費放進加密市場。",
        },
    ]

    headline_titles = [item.get("title", "") for item in top]
    yt_title = _youtube_title(headline_titles, today)
    description = _youtube_description(channel_name, today, top)

    social_lines = [f"【{channel_name} {today}】"]
    social_lines.extend(quote_lines)
    for item in top:
        social_lines.append(f"· {item.get('title')}")
    social_lines.append("以上為時局整理，非投資建議。來源見連結。")

    return {
        "id": f"ep-{today}",
        "date": today,
        "title": yt_title,
        "youtube": {
            "title": yt_title,
            "description": description,
            "tags": ["加密貨幣", "比特幣", "時局", "CLARITY", "非投資建議"],
            "privacy": "private",
            "categoryId": "25",
            "made_for_kids": False,
            "contains_synthetic_media": True,
        },
        "scenes": scenes,
        "sources": [{"title": h.get("title", ""), "url": h.get("url", "")} for h in top],
        "social": {
            "x": "\n".join(social_lines[:8]),
            "telegram": "\n".join(social_lines),
        },
        "quotes": quotes,
        "disclaimer": DISCLAIMER,
    }


def _youtube_title(headlines: list[str], today: str) -> str:
    if headlines:
        snippet = re.sub(r"\s+", " ", headlines[0])[:40]
        title = f"{snippet}｜{today} 加密時局"
    else:
        title = f"{today} 加密時局筆記"
    return title[:100]


def _youtube_description(channel_name: str, today: str, headlines: list[dict[str, str]]) -> str:
    lines = [
        f"{channel_name}｜{today}",
        "",
        DISCLAIMER,
        "",
        "本影片含 AI／程式輔助製作，畫面與旁白為時局整理，不是即時報價，也不是進場訊號。",
        "",
        "來源：",
    ]
    for item in headlines:
        title = item.get("title") or "來源"
        url = item.get("url") or ""
        lines.append(f"- {title} {url}".strip())
    lines.extend(
        [
            "",
            "請自行核對原始文件與官方日曆。上傳預設為私人，經人工檢查後才應公開。",
        ]
    )
    return "\n".join(lines)
