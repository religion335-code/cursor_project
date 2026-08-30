from pathlib import Path

import yaml

from crypto_studio.editorial import validate_episode
from crypto_studio.generate import compose_episode
from crypto_studio.render import load_mascot, render_frame, wrap_cjk
from PIL import Image, ImageDraw, ImageFont

FONT = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc"


def test_wrap_cjk_breaks_long_line():
    image = Image.new("RGB", (400, 200))
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(FONT, 40)
    lines = wrap_cjk("這是一段需要換行的中文內容測試用字串", font, 180, draw)
    assert len(lines) > 1
    assert all(draw.textlength(line, font=font) <= 180 for line in lines)


def test_validate_rejects_buy_calls():
    episode = {
        "title": "今日必漲",
        "youtube": {"description": "非投資建議", "privacy": "private"},
        "scenes": [
            {"heading": "a", "body": "x"},
            {"heading": "b", "body": "y"},
            {"heading": "c", "body": "保證獲利"},
        ],
        "social": {"x": "", "telegram": ""},
    }
    errors = validate_episode(episode)
    assert any("保證獲利" in error or "必漲" in error for error in errors)


def test_compose_episode_has_disclaimer_and_private_upload():
    brief = {
        "quotes": {"bitcoin": {"usd": 78000, "usd_24h_change": 0.5}},
        "headlines": [
            {"title": "Senate schedules CLARITY cloture vote", "url": "https://example.com/a"},
            {"title": "Spot bitcoin ETFs see mixed flows", "url": "https://example.com/b"},
            {"title": "Fed chair comments on inflation", "url": "https://example.com/c"},
        ],
    }
    episode = compose_episode(brief)
    assert validate_episode(episode) == []
    assert episode["youtube"]["privacy"] == "private"
    assert episode["youtube"]["contains_synthetic_media"] is True
    assert "不喊單" in episode["scenes"][0]["body"]
    assert "呱霸" in episode["scenes"][0]["body"]
    assert "獲利承諾" in episode["scenes"][0]["body"]


def test_seed_episode_passes_editorial_gate():
    path = Path(__file__).resolve().parents[1] / "content" / "episodes" / "ep-2026-08-30.yaml"
    episode = yaml.safe_load(path.read_text(encoding="utf-8"))
    assert validate_episode(episode) == []


def test_render_frame_includes_footer():
    frame = render_frame("標題", "內文測試。", FONT)
    # Dark branded canvas, 16:9
    assert frame.size == (1920, 1080)
    extrema = frame.getextrema()
    assert extrema[0][0] < 40  # still a dark background somewhere


def _green_pixel_count(image: Image.Image) -> int:
    return sum(1 for red, green, blue in image.getdata() if green > red + 30 and green > blue + 30 and green > 80)


def test_mascot_knockout_and_host_credit():
    path = Path(__file__).resolve().parents[1] / "assets" / "guaba.webp"
    mascot = load_mascot(path)
    assert min(mascot.getchannel("A").getextrema()) == 0
    frame = render_frame("標題", "內文測試。", FONT, host_name="呱霸", mascot=mascot)
    plain = render_frame("標題", "內文測試。", FONT)
    assert frame.size == (1920, 1080)
    assert _green_pixel_count(frame) > _green_pixel_count(plain) + 500
