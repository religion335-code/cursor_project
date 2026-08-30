from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import yaml

from crypto_studio.config import ROOT, load_config
from crypto_studio.editorial import validate_episode, write_social_drafts
from crypto_studio.generate import compose_episode
from crypto_studio.render import render_episode
from crypto_studio.research import build_brief


def _write_yaml(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        yaml.safe_dump(data, allow_unicode=True, sort_keys=False),
        encoding="utf-8",
    )


def _resolve(path_str: str) -> Path:
    path = Path(path_str)
    return path if path.is_absolute() else ROOT / path


def _load_episode(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def cmd_research(args: argparse.Namespace) -> int:
    config = load_config()
    brief = build_brief(config)
    dest = Path(args.out) if args.out else ROOT / "output" / "brief.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(brief, ensure_ascii=False, indent=2), encoding="utf-8")
    print(dest)
    return 0


def cmd_draft(args: argparse.Namespace) -> int:
    config = load_config()
    brief_path = Path(args.brief) if args.brief else ROOT / "output" / "brief.json"
    if brief_path.exists() and not args.refresh:
        brief = json.loads(brief_path.read_text(encoding="utf-8"))
    else:
        brief = build_brief(config)
        brief_path.parent.mkdir(parents=True, exist_ok=True)
        brief_path.write_text(json.dumps(brief, ensure_ascii=False, indent=2), encoding="utf-8")
    channel_name = ((config.get("channel") or {}).get("name")) or "時局筆記"
    host_name = ((config.get("channel") or {}).get("host_name")) or "呱霸"
    episode = compose_episode(brief, channel_name=channel_name, host_name=host_name)
    errors = validate_episode(episode)
    if errors:
        print("editorial checks failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 2
    dest = Path(args.out) if args.out else ROOT / "content" / "episodes" / f"{episode['id']}.yaml"
    _write_yaml(dest, episode)
    write_social_drafts(episode, ROOT / "content" / "social")
    print(dest)
    return 0


def cmd_render(args: argparse.Namespace) -> int:
    config = load_config()
    channel = config.get("channel") or {}
    episode = _load_episode(Path(args.episode))
    errors = validate_episode(episode)
    if errors:
        print("editorial checks failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 2
    mascot = channel.get("mascot")
    mascot_path = Path(mascot) if mascot else ROOT / "assets" / "guaba.webp"
    if not mascot_path.is_absolute():
        mascot_path = ROOT / mascot_path
    host_voice_path = _resolve(channel.get("host_voice") or "assets/guaba-voice.mp4")
    if not host_voice_path.exists():
        print(
            "找不到呱霸聲音檔 assets/guaba-voice.mp4。"
            "請把本機 voice.mp4 上傳到專案，開場才會用他自己的聲音。",
            file=sys.stderr,
        )
    output = render_episode(
        episode,
        Path(args.out_dir) if args.out_dir else ROOT / "output",
        font_path=channel.get("font") or "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
        voice=channel.get("voice") or "zh-TW-HsiaoChenNeural",
        aspect=args.aspect or channel.get("aspect") or "16:9",
        channel_name=channel.get("name") or "時局筆記",
        host_name=channel.get("host_name") or "呱霸",
        mascot_path=mascot_path,
        host_voice_path=host_voice_path,
    )
    print(output)
    return 0


def cmd_upload(args: argparse.Namespace) -> int:
    from crypto_studio.youtube_upload import UploadError, upload_video

    if not args.i_approve_upload:
        print(
            "每一支影片都要你明確同意才會上傳。確認要傳這一支之後，請加上 --i-approve-upload。",
            file=sys.stderr,
        )
        return 2
    episode = _load_episode(Path(args.episode))
    if args.privacy == "public" and not args.allow_public:
        print(
            "Refusing public upload. Watch the cut, then pass --privacy public --allow-public if you still want it live.",
            file=sys.stderr,
        )
        return 2
    secrets = _resolve(args.client_secrets)
    token = _resolve(args.token)
    if not secrets.exists():
        print(
            "Missing YouTube OAuth client secrets. Create a Google Cloud desktop OAuth client, "
            "enable YouTube Data API v3, and save the JSON as client_secret.json.",
            file=sys.stderr,
        )
        return 2
    try:
        response = upload_video(
            Path(args.video),
            episode,
            secrets,
            token,
            privacy=args.privacy,
            allow_public=args.allow_public,
            i_approve_upload=True,
        )
    except UploadError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    payload = {
        "id": response.get("id"),
        "status": response.get("status"),
        "channel": response.get("authorizedChannel"),
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


def cmd_auth(args: argparse.Namespace) -> int:
    from crypto_studio.youtube_upload import (
        PENDING_NAME,
        UploadError,
        connect_youtube,
        finish_authorization,
        start_authorization,
    )

    secrets = _resolve(args.client_secrets)
    token = _resolve(args.token)
    pending = ROOT / PENDING_NAME
    if not secrets.exists():
        print("找不到 client_secret.json。請放在專案根目錄（和 README.md 同一層）。", file=sys.stderr)
        return 2
    try:
        if args.redirect_url:
            finish_authorization(args.redirect_url, pending, token)
            _, channel = connect_youtube(secrets, token)
            print(json.dumps({"ok": True, "channel": channel}, ensure_ascii=False, indent=2))
            return 0
        url = start_authorization(secrets, pending)
    except UploadError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    print(url)
    print(
        "\n請在瀏覽器打開上面的網址，選品牌頻道（不要選 Gmail）。"
        "授權後瀏覽器會跳到打不開的 localhost 頁面：把網址列整段複製回來交給我，或執行：\n"
        'crypto-studio auth --redirect-url "貼上的網址"',
        file=sys.stderr,
    )
    return 0


def cmd_channel(args: argparse.Namespace) -> int:
    from crypto_studio.youtube_upload import UploadError, connect_youtube

    secrets = _resolve(args.client_secrets)
    token = _resolve(args.token)
    if not secrets.exists():
        print(
            "Missing client_secret.json. Enable YouTube Data API v3, create a Desktop OAuth client, "
            "and save it here. When the browser asks which account, pick the brand channel — not Gmail.",
            file=sys.stderr,
        )
        return 2
    try:
        _, channel = connect_youtube(secrets, token)
    except UploadError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    print(json.dumps(channel, ensure_ascii=False, indent=2))
    return 0


INTRO_EPISODES = [
    "content/episodes/ep-01-btc.yaml",
    "content/episodes/ep-02-eth.yaml",
    "content/episodes/ep-03-sol.yaml",
]


def cmd_series(args: argparse.Namespace) -> int:
    for relative in INTRO_EPISODES:
        render_args = argparse.Namespace(
            episode=str(ROOT / relative),
            out_dir=args.out_dir,
            aspect=args.aspect,
        )
        print(relative)
        if cmd_render(render_args) != 0:
            return 2
    return 0


def cmd_pack(args: argparse.Namespace) -> int:
    draft_args = argparse.Namespace(brief=None, refresh=True, out=None)
    if cmd_draft(draft_args) != 0:
        return 2
    episodes = sorted((ROOT / "content" / "episodes").glob("ep-*.yaml"))
    if not episodes:
        print("no episode yaml produced", file=sys.stderr)
        return 2
    render_args = argparse.Namespace(episode=str(episodes[-1]), out_dir=None, aspect=args.aspect)
    return cmd_render(render_args)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="crypto-studio",
        description="Generate reviewable crypto briefing videos. Uploads stay private unless you override.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    research = sub.add_parser("research", help="Fetch prices and headlines")
    research.add_argument("--out")
    research.set_defaults(func=cmd_research)

    draft = sub.add_parser("draft", help="Compose a Traditional Chinese episode YAML")
    draft.add_argument("--brief")
    draft.add_argument("--out")
    draft.add_argument("--refresh", action="store_true")
    draft.set_defaults(func=cmd_draft)

    render = sub.add_parser("render", help="Render a YAML episode to mp4")
    render.add_argument("episode")
    render.add_argument("--out-dir")
    render.add_argument("--aspect", choices=["16:9", "9:16"])
    render.set_defaults(func=cmd_render)

    upload = sub.add_parser("upload", help="Upload a reviewed mp4 as a PRIVATE YouTube draft")
    upload.add_argument("video")
    upload.add_argument("episode")
    upload.add_argument("--client-secrets", default="client_secret.json")
    upload.add_argument("--token", default="token.json")
    upload.add_argument("--privacy", default="private", choices=["private", "unlisted", "public"])
    upload.add_argument("--allow-public", action="store_true")
    upload.add_argument(
        "--i-approve-upload",
        action="store_true",
        help="Required. Every upload needs explicit approval; this command never runs silently.",
    )
    upload.set_defaults(func=cmd_upload)

    auth = sub.add_parser("auth", help="Start or finish Google OAuth for the brand channel (does not upload)")
    auth.add_argument("--client-secrets", default="client_secret.json")
    auth.add_argument("--token", default="token.json")
    auth.add_argument("--redirect-url", help="Paste the localhost URL after you approve access")
    auth.set_defaults(func=cmd_auth)

    channel = sub.add_parser("channel", help="Show which YouTube channel the OAuth token can upload to")
    channel.add_argument("--client-secrets", default="client_secret.json")
    channel.add_argument("--token", default="token.json")
    channel.set_defaults(func=cmd_channel)

    series = sub.add_parser("series", help="Render 呱霸入門 01 BTC, 02 ETH, 03 SOL")
    series.add_argument("--out-dir")
    series.add_argument("--aspect", choices=["16:9", "9:16"])
    series.set_defaults(func=cmd_series)

    pack = sub.add_parser("pack", help="Research + draft + render in one step")
    pack.add_argument("--aspect", choices=["16:9", "9:16"])
    pack.set_defaults(func=cmd_pack)
    return parser


def main(argv: list[str] | None = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)
    raise SystemExit(args.func(args))


if __name__ == "__main__":
    main()
