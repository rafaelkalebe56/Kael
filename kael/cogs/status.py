from __future__ import annotations

import discord
from discord import app_commands
from discord.ext import commands


class StatusCog(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    @app_commands.command(name="status", description="Mostra se o Kael está online.")
    async def status(self, interaction: discord.Interaction) -> None:
        if interaction.guild is not None:
            self.bot.database.ensure_guild(interaction.guild.id)  # type: ignore[attr-defined]

        latency = round(self.bot.latency * 1000)
        embed = discord.Embed(
            title="Kael está online",
            description="Pronto para cuidar da sua comunidade.",
            color=discord.Color.purple(),
        )
        embed.add_field(name="Latência", value=f"{latency} ms")
        embed.set_footer(text="Kael • Community Hub")
        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(StatusCog(bot))
