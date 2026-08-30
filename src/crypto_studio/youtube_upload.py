from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
]
REDIRECT_URI = "http://localhost:8080/"
PENDING_NAME = "oauth_pending.json"


class UploadError(RuntimeError):
    pass


def _flow(client_secrets: Path) -> InstalledAppFlow:
    flow = InstalledAppFlow.from_client_secrets_file(str(client_secrets), SCOPES)
    flow.redirect_uri = REDIRECT_URI
    return flow


def start_authorization(client_secrets: Path, pending_path: Path) -> str:
    if not client_secrets.exists():
        raise UploadError(f"missing client secrets: {client_secrets}")
    flow = _flow(client_secrets)
    auth_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true",
    )
    pending_path.write_text(
        json.dumps(
            {
                "state": state,
                "code_verifier": flow.code_verifier,
                "redirect_uri": flow.redirect_uri,
                "client_secrets": str(client_secrets.resolve()),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    return auth_url


def finish_authorization(redirect_url: str, pending_path: Path, token_path: Path) -> Credentials:
    if not pending_path.exists():
        raise UploadError("沒有進行中的授權。請先執行 crypto-studio auth")
    normalized = _normalize_redirect(redirect_url)
    if "code=" not in normalized:
        raise UploadError("請貼上回 http://localhost:8080/?code=... 的完整網址。頁面打不開也沒關係，把網址列整段複製回來。")
    pending = json.loads(pending_path.read_text(encoding="utf-8"))
    flow = _flow(Path(pending["client_secrets"]))
    flow.redirect_uri = pending["redirect_uri"]
    flow.code_verifier = pending["code_verifier"]
    flow.fetch_token(authorization_response=normalized)
    token_path.write_text(flow.credentials.to_json(), encoding="utf-8")
    pending_path.unlink(missing_ok=True)
    return flow.credentials


def _normalize_redirect(redirect_url: str) -> str:
    text = redirect_url.strip().strip('"').strip("'")
    if text.startswith("http://localhost") or text.startswith("https://localhost"):
        return text
    if text.startswith("http://127.0.0.1") or text.startswith("https://127.0.0.1"):
        return text
    if text.startswith("?"):
        return REDIRECT_URI.rstrip("/") + "/" + text
    if text.startswith("code="):
        return REDIRECT_URI + "?" + text
    return text


def load_credentials(client_secrets: Path, token_path: Path) -> Credentials:
    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
    if creds and creds.valid:
        return creds
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        token_path.write_text(creds.to_json(), encoding="utf-8")
        return creds
    raise UploadError(
        "尚未授權，或授權已失效。請先執行 crypto-studio auth，不要在上傳時順便彈出 Google 登入。"
    )


def fetch_authorized_channel(youtube) -> dict[str, Any]:
    response = youtube.channels().list(part="id,snippet", mine=True).execute()
    items = response.get("items") or []
    if not items:
        raise UploadError(
            "這個 Google 登入沒有 YouTube 頻道。授權視窗請改選品牌帳戶，不要選個人 Gmail。"
        )
    snippet = items[0].get("snippet") or {}
    return {
        "id": items[0].get("id"),
        "title": snippet.get("title"),
        "customUrl": snippet.get("customUrl"),
    }


def connect_youtube(client_secrets: Path, token_path: Path):
    creds = load_credentials(client_secrets, token_path)
    youtube = build("youtube", "v3", credentials=creds)
    channel = fetch_authorized_channel(youtube)
    return youtube, channel


def upload_video(
    video_path: Path,
    episode: dict[str, Any],
    client_secrets: Path,
    token_path: Path,
    privacy: str | None = None,
    allow_public: bool = False,
    i_approve_upload: bool = False,
) -> dict[str, Any]:
    if not i_approve_upload:
        raise UploadError(
            "每一支影片都要你明確同意才會上傳。請加上 --i-approve-upload，或在對話裡說可以上傳這一集。"
        )
    if not video_path.exists():
        raise UploadError(f"video not found: {video_path}")
    youtube_meta = episode.get("youtube") or {}
    status = privacy or youtube_meta.get("privacy") or "private"
    if status == "public" and not allow_public:
        raise UploadError(
            "Refusing public upload. Review the draft, then pass --allow-public if you still want it live."
        )
    if status not in {"private", "unlisted", "public"}:
        raise UploadError(f"invalid privacy: {status}")

    youtube, channel = connect_youtube(client_secrets, token_path)
    body = {
        "snippet": {
            "title": youtube_meta.get("title") or episode.get("title") or "時局筆記",
            "description": youtube_meta.get("description") or "",
            "tags": youtube_meta.get("tags") or [],
            "categoryId": str(youtube_meta.get("categoryId") or "25"),
            "defaultLanguage": "zh-Hant",
            "defaultAudioLanguage": "zh-TW",
        },
        "status": {
            "privacyStatus": status,
            "selfDeclaredMadeForKids": False,
        },
    }
    media = MediaFileUpload(str(video_path), chunksize=-1, resumable=True, mimetype="video/mp4")
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
    response = None
    while response is None:
        _, response = request.next_chunk()
    response["authorizedChannel"] = channel
    return response
