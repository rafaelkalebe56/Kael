from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parent.parent


def resolve_data_directory() -> Path:
    """Retorna o diretório persistente do Kael.

    Na Railway, o Volume fornece ``RAILWAY_VOLUME_MOUNT_PATH`` e está montado
    em ``/data``. Em desenvolvimento local, mantemos os dados fora do Git em
    ``./data``. ``KAEL_DATA_DIR`` permite substituir o local de forma explícita
    sem alterar código.
    """

    configured_path = (
        os.getenv("KAEL_DATA_DIR", "").strip()
        or os.getenv("RAILWAY_VOLUME_MOUNT_PATH", "").strip()
    )
    return Path(configured_path) if configured_path else PROJECT_ROOT / "data"


@dataclass(frozen=True, slots=True)
class Settings:
    discord_token: str
    dev_guild_id: int | None
    database_path: Path

    @classmethod
    def from_environment(cls) -> "Settings":
        load_dotenv(PROJECT_ROOT / ".env")
        token = os.getenv("DISCORD_TOKEN", "").strip()
        if not token:
            raise RuntimeError("DISCORD_TOKEN não foi configurado no arquivo .env.")

        raw_guild_id = os.getenv("KAEL_DEV_GUILD_ID", "").strip()
        if raw_guild_id and not raw_guild_id.isdigit():
            raise RuntimeError("KAEL_DEV_GUILD_ID precisa ser um ID numérico do Discord.")

        return cls(
            discord_token=token,
            dev_guild_id=int(raw_guild_id) if raw_guild_id else None,
            database_path=resolve_data_directory() / "kael.sqlite3",
        )
