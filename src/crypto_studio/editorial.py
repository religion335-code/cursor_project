from __future__ import annotations

from pathlib import Path
from typing import Any


FORBIDDEN = ("保證獲利", "穩賺", "必漲", "跟單", "內線", "現在不買就來不及")


def validate_episode(episode: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    scenes = episode.get("scenes") or []
    if len(scenes) < 3:
        errors.append("need at least 3 scenes")
    blob = " ".join(
        [episode.get("title") or "", (episode.get("youtube") or {}).get("description") or ""]
        + [f"{s.get('heading', '')} {s.get('body', '')}" for s in scenes]
        + [((episode.get("social") or {}).get("x") or "")]
        + [((episode.get("social") or {}).get("telegram") or "")]
    )
    for phrase in FORBIDDEN:
        if phrase in blob:
            errors.append(f"forbidden phrase: {phrase}")
    if "非投資建議" not in blob and "不構成投資" not in blob:
        errors.append("missing investment disclaimer")
    privacy = (episode.get("youtube") or {}).get("privacy") or "private"
    if privacy == "public":
        errors.append("default privacy must not be public")
    return errors


def write_social_drafts(episode: dict[str, Any], dest_dir: Path) -> None:
    dest_dir.mkdir(parents=True, exist_ok=True)
    social = episode.get("social") or {}
    episode_id = episode.get("id") or "episode"
    (dest_dir / f"{episode_id}-x.txt").write_text(social.get("x") or "", encoding="utf-8")
    (dest_dir / f"{episode_id}-telegram.txt").write_text(social.get("telegram") or "", encoding="utf-8")
    sources = episode.get("sources") or []
    lines = [f"{item.get('title')} {item.get('url')}".strip() for item in sources]
    (dest_dir / f"{episode_id}-sources.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
