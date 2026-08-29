from __future__ import annotations

import sqlite3
from pathlib import Path


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
                welcome_channel_id TEXT
            )
            """
        )
        self.connection.commit()

    def ensure_guild(self, guild_id: int) -> None:
        self.connection.execute(
            "INSERT OR IGNORE INTO guild_settings (guild_id) VALUES (?)", (str(guild_id),)
        )
        self.connection.commit()

    def close(self) -> None:
        self.connection.close()

