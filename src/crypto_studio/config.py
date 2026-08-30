from __future__ import annotations

from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG = ROOT / "config.yaml"
EXAMPLE_CONFIG = ROOT / "config.example.yaml"


def load_config(path: Path | None = None) -> dict:
    config_path = path or (DEFAULT_CONFIG if DEFAULT_CONFIG.exists() else EXAMPLE_CONFIG)
    with config_path.open(encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    return data
