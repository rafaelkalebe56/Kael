from __future__ import annotations

import hmac
import logging
import math
from typing import TYPE_CHECKING

import discord
from aiohttp import web

from kael import __version__
from kael.welcome import WelcomeValidationError, send_welcome, validate_welcome_settings

if TYPE_CHECKING:
    from kael.bot import KaelBot


class DashboardApi:
    """Pequena API privada usada exclusivamente pelo PainelKael."""

    def __init__(self, bot: "KaelBot", api_key: str, port: int) -> None:
        self.bot = bot
        self.api_key = api_key
        self.port = port
        self._runner: web.AppRunner | None = None

    async def start(self) -> None:
        app = web.Application(client_max_size=64 * 1024)
        app.router.add_get("/internal/status", self.status)
        app.router.add_get("/internal/guilds", self.guilds)
        app.router.add_get("/internal/guilds/{guild_id}/welcome", self.get_welcome)
        app.router.add_put("/internal/guilds/{guild_id}/welcome", self.put_welcome)
        app.router.add_post("/internal/guilds/{guild_id}/welcome/test", self.test_welcome)
        self._runner = web.AppRunner(app, access_log=None)
        await self._runner.setup()
        await web.TCPSite(self._runner, host="0.0.0.0", port=self.port).start()
        logging.getLogger(__name__).info("API privada do painel iniciada na porta %s", self.port)

    async def stop(self) -> None:
        if self._runner is not None:
            await self._runner.cleanup()
            self._runner = None

    def is_authorized(self, request: web.Request) -> bool:
        received = request.headers.get("Authorization", "")
        expected = f"Bearer {self.api_key}"
        return hmac.compare_digest(received, expected)

    async def status(self, request: web.Request) -> web.Response:
        if not self.is_authorized(request):
            return web.json_response({"error": "unauthorized"}, status=401)

        ready = self.bot.is_ready()
        guild_count = len(self.bot.guilds) if ready else 0
        member_count = (
            sum(guild.member_count if guild.member_count is not None else len(guild.members) for guild in self.bot.guilds)
            if ready
            else 0
        )
        latency = self.bot.latency
        return web.json_response(
            {
                "ready": ready,
                "version": __version__,
                "guildCount": guild_count,
                "memberCount": member_count,
                "latencyMs": round(latency * 1000) if ready and math.isfinite(latency) else None,
            }
        )

    async def guilds(self, request: web.Request) -> web.Response:
        if not self.is_authorized(request):
            return web.json_response({"error": "unauthorized"}, status=401)

        guilds = []
        for guild in self.bot.guilds:
            guilds.append(
                {
                    "id": str(guild.id),
                    "name": guild.name,
                    "icon": str(guild.icon.url) if guild.icon else None,
                    "banner": str(guild.banner.url) if guild.banner else None,
                    "memberCount": guild.member_count if guild.member_count is not None else len(guild.members),
                }
            )

        logging.getLogger(__name__).info("PainelKael consultou %s servidores do Kael", len(guilds))
        return web.json_response({"guilds": sorted(guilds, key=lambda guild: guild["name"].lower())})

    def _guild(self, request: web.Request):
        try:
            guild_id = int(request.match_info["guild_id"])
        except (KeyError, ValueError):
            return None
        return self.bot.get_guild(guild_id)

    @staticmethod
    def _channels(guild):
        return [
            {"id": str(channel.id), "name": channel.name}
            for channel in guild.text_channels
            if channel.permissions_for(guild.me).send_messages
        ]

    async def get_welcome(self, request: web.Request) -> web.Response:
        if not self.is_authorized(request):
            return web.json_response({"error": "unauthorized"}, status=401)
        guild = self._guild(request)
        if guild is None:
            return web.json_response({"error": "guild_not_found"}, status=404)
        return web.json_response(
            {
                "config": self.bot.database.get_welcome_settings(guild.id),
                "channels": self._channels(guild),
            }
        )

    async def put_welcome(self, request: web.Request) -> web.Response:
        if not self.is_authorized(request):
            return web.json_response({"error": "unauthorized"}, status=401)
        guild = self._guild(request)
        if guild is None:
            return web.json_response({"error": "guild_not_found"}, status=404)
        try:
            payload = await request.json()
            channels = self._channels(guild)
            config = validate_welcome_settings(payload, {channel["id"] for channel in channels})
        except (WelcomeValidationError, ValueError, TypeError) as error:
            return web.json_response({"error": "invalid_config", "message": str(error)}, status=400)
        self.bot.database.save_welcome_settings(guild.id, config)
        return web.json_response({"config": config})

    async def test_welcome(self, request: web.Request) -> web.Response:
        if not self.is_authorized(request):
            return web.json_response({"error": "unauthorized"}, status=401)
        guild = self._guild(request)
        if guild is None:
            return web.json_response({"error": "guild_not_found"}, status=404)
        try:
            payload = await request.json()
            channels = self._channels(guild)
            config = validate_welcome_settings(payload.get("config"), {channel["id"] for channel in channels})
            target = payload.get("target")
            if target not in {"channel", "self"}:
                raise WelcomeValidationError("Destino de teste inválido.")
            user_id = int(payload.get("userId"))
            member = guild.get_member(user_id)
            user = member or await self.bot.fetch_user(user_id)
            await send_welcome(
                self.bot,
                guild,
                user,
                config,
                target_override="channel" if target == "channel" else "self",
                dm_user=user,
            )
        except WelcomeValidationError as error:
            return web.json_response({"error": "invalid_config", "message": str(error)}, status=400)
        except (discord.Forbidden, discord.HTTPException, ValueError, TypeError):
            logging.getLogger(__name__).exception("Falha ao enviar teste de boas-vindas em %s", guild.id)
            return web.json_response(
                {"error": "test_failed", "message": "O Discord não aceitou o envio. Confira o canal e as permissões."},
                status=502,
            )
        return web.json_response({"ok": True})
