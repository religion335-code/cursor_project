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
    output = render_episode(
        episode,
        Path(args.out_dir) if args.out_dir else ROOT / "output",
        font_path=channel.get("font") or "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
        voice=channel.get("voice") or "zh-TW-HsiaoChenNeural",
        aspect=args.aspect or channel.get("aspect") or "16:9",
        channel_name=channel.get("name") or "時局筆記",
        host_name=channel.get("host_name") or "呱霸",
        mascot_path=mascot_path,
    )
    print(output)
    return 0


def cmd_upload(args: argparse.Namespace) -> int:
    from crypto_studio.youtube_upload import UploadError, upload_video

    episode = _load_episode(Path(args.episode))
    if args.privacy == "public" and not args.allow_public:
        print(
            "Refusing public upload. Watch the cut, then pass --privacy public --allow-public if you still want it live.",
            file=sys.stderr,
        )
        return 2
    secrets = Path(args.client_secrets)
    token = Path(args.token)
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
        )
    except UploadError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    print(json.dumps({"id": response.get("id"), "status": response.get("status")}, ensure_ascii=False, indent=2))
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
    upload.set_defaults(func=cmd_upload)

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
