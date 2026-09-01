from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any


DEFAULT_WELCOME_SETTINGS: dict[str, Any] = {
    "enabled": False,
    "delivery": "channel",
    "channelId": None,
    "format": "components_v2",
    "title": "Bem-vindo ao servidor!",
    "message": "Olá, {membro}! Que bom ter você no {servidor}.\nAgora somos {membros} membros.",
    "authorName": "Kael",
    "authorUrl": "https://kael.up.railway.app",
    "authorIcon": "",
    "thumbnail": "{membro.avatar}",
    "bannerUrl": "",
    "accentColor": "#4055FF",
    "footer": "Agora somos {membros} membros.",
    "buttons": [],
    "ignoreBots": True,
    "delaySeconds": 1,
    "autoDeleteSeconds": None,
    "deduplicate": True,
    "fallbackServerIcon": True,
}


class Database:
    """Pequena camada de persistência; cada servidor possui sua própria configuração."""

    def __init__(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(path)
        self.connection.row_factory = sqlite3.Row

    def initialize(self) -> None:
        self.connection.execute(
            """
            CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                welcome_enabled INTEGER NOT NULL DEFAULT 0,
                welcome_channel_id TEXT,
                welcome_config TEXT
            )
            """
        )
        columns = {
            row["name"]
            for row in self.connection.execute("PRAGMA table_info(guild_settings)").fetchall()
        }
        if "welcome_config" not in columns:
            self.connection.execute("ALTER TABLE guild_settings ADD COLUMN welcome_config TEXT")
        self.connection.commit()

    def ensure_guild(self, guild_id: int) -> None:
        self.connection.execute(
            "INSERT OR IGNORE INTO guild_settings (guild_id) VALUES (?)", (str(guild_id),)
        )
        self.connection.commit()

    def get_welcome_settings(self, guild_id: int) -> dict[str, Any]:
        self.ensure_guild(guild_id)
        row = self.connection.execute(
            "SELECT welcome_enabled, welcome_channel_id, welcome_config FROM guild_settings WHERE guild_id = ?",
            (str(guild_id),),
        ).fetchone()

        settings = dict(DEFAULT_WELCOME_SETTINGS)
        if row is None:
            return settings

        raw_config = row["welcome_config"]
        if raw_config:
            try:
                decoded = json.loads(raw_config)
                if isinstance(decoded, dict):
                    settings.update(decoded)
            except (TypeError, ValueError):
                pass

        settings["enabled"] = bool(row["welcome_enabled"])
        settings["channelId"] = row["welcome_channel_id"]
        settings["buttons"] = list(settings.get("buttons") or [])
        return settings

    def save_welcome_settings(self, guild_id: int, settings: dict[str, Any]) -> None:
        self.ensure_guild(guild_id)
        self.connection.execute(
            """
            UPDATE guild_settings
            SET welcome_enabled = ?, welcome_channel_id = ?, welcome_config = ?, updated_at = CURRENT_TIMESTAMP
            WHERE guild_id = ?
            """,
            (
                1 if settings.get("enabled") else 0,
                settings.get("channelId"),
                json.dumps(settings, ensure_ascii=False, separators=(",", ":")),
                str(guild_id),
            ),
        )
        self.connection.commit()

    def close(self) -> None:
        self.connection.close()
