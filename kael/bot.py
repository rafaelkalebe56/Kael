from __future__ import annotations

import logging
import time

import discord
from discord.ext import commands

from kael.config import Settings
from kael.database import Database
from kael.dashboard_api import DashboardApi
from kael.welcome import send_configured_welcome


class KaelBot(commands.Bot):
    def __init__(self, settings: Settings) -> None:
        intents = discord.Intents.default()
        intents.members = True
        intents.message_content = True
        super().__init__(command_prefix="!", intents=intents)
        self.settings = settings
        self.database = Database(settings.database_path)
        self._recent_welcome_events: dict[tuple[int, int], float] = {}
        self.dashboard_api = (
            DashboardApi(self, settings.dashboard_api_key, settings.dashboard_api_port)
            if settings.dashboard_api_key
            else None
        )

    async def setup_hook(self) -> None:
        self.database.initialize()
        if self.dashboard_api is not None:
            await self.dashboard_api.start()
        await self.load_extension("kael.cogs.community")
        await self.load_extension("kael.cogs.status")

        if self.settings.dev_guild_id:
            guild = discord.Object(id=self.settings.dev_guild_id)
            self.tree.copy_global_to(guild=guild)
            await self.tree.sync(guild=guild)
        else:
            await self.tree.sync()

    async def on_ready(self) -> None:
        for guild in self.guilds:
            self.database.ensure_guild(guild.id)
        logging.getLogger(__name__).info("Kael conectado como %s", self.user)

    async def on_guild_join(self, guild: discord.Guild) -> None:
        self.database.ensure_guild(guild.id)

    async def on_member_join(self, member: discord.Member) -> None:
        settings = self.database.get_welcome_settings(member.guild.id)
        event_key = (member.guild.id, member.id)
        now = time.monotonic()
        if settings.get("deduplicate") and now - self._recent_welcome_events.get(event_key, 0) < 300:
            return
        self._recent_welcome_events[event_key] = now
        if len(self._recent_welcome_events) > 10_000:
            cutoff = now - 600
            self._recent_welcome_events = {
                key: timestamp for key, timestamp in self._recent_welcome_events.items() if timestamp >= cutoff
            }
        try:
            await send_configured_welcome(self, member, settings)
        except (discord.HTTPException, discord.Forbidden, ValueError):
            logging.getLogger(__name__).exception(
                "Não foi possível enviar as boas-vindas no servidor %s", member.guild.id
            )

    async def close(self) -> None:
        if self.dashboard_api is not None:
            await self.dashboard_api.stop()
        self.database.close()
        await super().close()
