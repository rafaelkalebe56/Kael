from __future__ import annotations

import logging

import discord
from discord.ext import commands

from kael.config import Settings
from kael.database import Database


class KaelBot(commands.Bot):
    def __init__(self, settings: Settings) -> None:
        intents = discord.Intents.default()
        intents.members = True
        intents.message_content = True
        super().__init__(command_prefix="!", intents=intents)
        self.settings = settings
        self.database = Database(settings.database_path)

    async def setup_hook(self) -> None:
        self.database.initialize()
        await self.load_extension("kael.cogs.status")

        if self.settings.dev_guild_id:
            guild = discord.Object(id=self.settings.dev_guild_id)
            self.tree.copy_global_to(guild=guild)
            await self.tree.sync(guild=guild)
        else:
            await self.tree.sync()

    async def on_ready(self) -> None:
        logging.getLogger(__name__).info("Kael conectado como %s", self.user)

    async def on_guild_join(self, guild: discord.Guild) -> None:
        self.database.ensure_guild(guild.id)

    async def close(self) -> None:
        self.database.close()
        await super().close()

