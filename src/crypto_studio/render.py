from __future__ import annotations

import asyncio
import subprocess
import tempfile
from pathlib import Path
from typing import Any

import edge_tts
from PIL import Image, ImageDraw, ImageFont

from crypto_studio import FOOTER

BG = (8, 14, 28)
CARD = (16, 28, 52)
ACCENT = (232, 184, 92)
TEXT = (236, 240, 248)
MUTED = (156, 170, 196)


def wrap_cjk(text: str, font: ImageFont.FreeTypeFont, max_width: int, draw: ImageDraw.ImageDraw) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        line = ""
        for char in paragraph:
            candidate = line + char
            if draw.textlength(candidate, font=font) <= max_width:
                line = candidate
            else:
                if line:
                    lines.append(line)
                line = char
        lines.append(line)
    return lines or [""]


def _size(aspect: str) -> tuple[int, int]:
    return (1080, 1920) if aspect == "9:16" else (1920, 1080)


def load_mascot(path: Path) -> Image.Image:
    """Knock out near-black studio backdrop so the host sits on the navy frame."""
    sprite = Image.open(path).convert("RGBA")
    pixels = []
    for red, green, blue, alpha in sprite.getdata():
        if red < 28 and green < 28 and blue < 28:
            pixels.append((red, green, blue, 0))
        else:
            pixels.append((red, green, blue, alpha))
    sprite.putdata(pixels)
    return sprite


def _place_mascot(base: Image.Image, mascot: Image.Image, aspect: str) -> int:
    width, height = base.size
    target_h = int(height * (0.62 if aspect == "9:16" else 0.82))
    ratio = mascot.width / mascot.height
    target_w = int(target_h * ratio)
    fitted = mascot.resize((target_w, target_h), Image.Resampling.LANCZOS)
    x = width - target_w - (12 if aspect == "16:9" else 24)
    y = height - 72 - target_h + 20
    base.paste(fitted, (x, y), fitted)
    return target_w


def render_frame(
    heading: str,
    body: str,
    font_path: str,
    aspect: str = "16:9",
    channel_name: str = "時局筆記",
    host_name: str = "",
    mascot: Image.Image | None = None,
) -> Image.Image:
    width, height = _size(aspect)
    image = Image.new("RGB", (width, height), BG)
    mascot_width = _place_mascot(image, mascot, aspect) if mascot is not None else 0
    draw = ImageDraw.Draw(image)
    heading_size = 64 if aspect == "16:9" else 56
    body_size = 42 if aspect == "16:9" else 38
    heading_font = ImageFont.truetype(font_path, heading_size)
    body_font = ImageFont.truetype(font_path, body_size)
    small_font = ImageFont.truetype(font_path, 28)

    margin = 96 if aspect == "16:9" else 72
    text_max = width - margin - (mascot_width + 36 if mascot_width else margin)
    brand = f"{channel_name}  ·  {host_name}" if host_name else channel_name
    footer = (
        f"{channel_name} · {host_name}主持 · 非投資建議 · AI 輔助製作"
        if host_name
        else FOOTER
    )
    draw.rectangle([0, 0, 18, height], fill=ACCENT)
    draw.text((margin, 56), brand, font=small_font, fill=ACCENT)

    y = 130 if aspect == "16:9" else 160
    for line in wrap_cjk(heading, heading_font, text_max, draw)[:3]:
        draw.text((margin, y), line, font=heading_font, fill=TEXT)
        y += heading_size + 12

    y += 24
    draw.line([(margin, y), (margin + 220, y)], fill=ACCENT, width=4)
    y += 36

    max_body_bottom = height - 120
    for line in wrap_cjk(body, body_font, text_max, draw):
        if y + body_size > max_body_bottom:
            break
        draw.text((margin, y), line, font=body_font, fill=MUTED)
        y += body_size + 14

    draw.rectangle([0, height - 72, width, height], fill=CARD)
    draw.text((margin, height - 52), footer, font=small_font, fill=MUTED)
    return image


async def _synthesize(text: str, voice: str, dest: Path) -> None:
    communicate = edge_tts.Communicate(text, voice=voice)
    await communicate.save(str(dest))


def _audio_seconds(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def _run_ffmpeg(args: list[str]) -> None:
    subprocess.run(args, check=True, capture_output=True)


def render_episode(
    episode: dict[str, Any],
    output_dir: Path,
    font_path: str,
    voice: str = "zh-TW-HsiaoChenNeural",
    aspect: str = "16:9",
    channel_name: str = "時局筆記",
    host_name: str = "",
    mascot_path: Path | None = None,
) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    episode_id = episode.get("id") or "episode"
    final_path = output_dir / f"{episode_id}.mp4"
    scenes = episode.get("scenes") or []
    if not scenes:
        raise ValueError("episode has no scenes")

    mascot = load_mascot(mascot_path) if mascot_path and mascot_path.exists() else None

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        clip_list: list[Path] = []
        for index, scene in enumerate(scenes):
            heading = scene.get("heading") or ""
            body = scene.get("body") or ""
            frame = render_frame(
                heading,
                body,
                font_path,
                aspect=aspect,
                channel_name=channel_name,
                host_name=host_name,
                mascot=mascot,
            )
            png_path = tmp_path / f"scene-{index:02d}.png"
            mp3_path = tmp_path / f"scene-{index:02d}.mp3"
            clip_path = tmp_path / f"scene-{index:02d}.mp4"
            frame.save(png_path)
            asyncio.run(_synthesize(f"{heading}。{body}", voice, mp3_path))
            duration = _audio_seconds(mp3_path) + 0.35
            _run_ffmpeg(
                [
                    "ffmpeg",
                    "-y",
                    "-loop",
                    "1",
                    "-i",
                    str(png_path),
                    "-i",
                    str(mp3_path),
                    "-c:v",
                    "libx264",
                    "-tune",
                    "stillimage",
                    "-pix_fmt",
                    "yuv420p",
                    "-c:a",
                    "aac",
                    "-shortest",
                    "-t",
                    f"{duration:.2f}",
                    str(clip_path),
                ]
            )
            clip_list.append(clip_path)

        concat_file = tmp_path / "concat.txt"
        concat_file.write_text(
            "".join(f"file '{clip}'\n" for clip in clip_list),
            encoding="utf-8",
        )
        _run_ffmpeg(
            [
                "ffmpeg",
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat_file),
                "-c",
                "copy",
                str(final_path),
            ]
        )

    first = scenes[0]
    render_frame(
        first.get("heading") or "",
        first.get("body") or "",
        font_path,
        aspect=aspect,
        channel_name=channel_name,
        host_name=host_name,
        mascot=mascot,
    ).save(output_dir / f"{episode_id}-preview.png")
    return final_path
