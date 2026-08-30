from __future__ import annotations

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


class UploadError(RuntimeError):
    pass


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
    flow = InstalledAppFlow.from_client_secrets_file(str(client_secrets), SCOPES)
    creds = flow.run_local_server(port=0)
    token_path.write_text(creds.to_json(), encoding="utf-8")
    return creds


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
) -> dict[str, Any]:
    if not video_path.exists():
        raise UploadError(f"video not found: {video_path}")
    youtube_meta = episode.get("youtube") or {}
    status = privacy or youtube_meta.get("privacy") or "private"
    if status == "public" and not allow_public:
        raise UploadError(
            "Refusing public upload. Review the draft, then pass --allow-public if you still want it public."
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
