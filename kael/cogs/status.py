from __future__ import annotations

import discord
from discord import app_commands
from discord.ext import commands

from kael.emojis import KAEL_STATUS, KAEL_CLOCK
from kael.ui import information_card


class StatusCog(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    @app_commands.command(name="status", description="Mostra se o Kael está online.")
    async def status(self, interaction: discord.Interaction) -> None:
        if interaction.guild is not None:
            self.bot.database.ensure_guild(interaction.guild.id)  # type: ignore[attr-defined]

        latency = round(self.bot.latency * 1000)
        view = information_card(
            f"{KAEL_STATUS} Kael está online",
            "Pronto para cuidar da sua comunidade.\n\n"
            f"{KAEL_CLOCK} **Latência:** {latency} ms\n"
            "Kael • Community Hub",
        )
        await interaction.response.send_message(view=view, ephemeral=True)


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(StatusCog(bot))
