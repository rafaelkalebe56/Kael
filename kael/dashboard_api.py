from __future__ import annotations

import hmac
import logging
from typing import TYPE_CHECKING

from aiohttp import web

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
        app = web.Application()
        app.router.add_get("/internal/guilds", self.guilds)
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
