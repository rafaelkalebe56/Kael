from __future__ import annotations

import json
import unittest
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

from kael.cogs.community import CommunityCog, help_view, mention_view, profile_view, serverinfo_view


class Asset:
    def __init__(self, url: str) -> None:
        self.url = url

    def __bool__(self) -> bool:
        return True


class Role:
    def __init__(self, name: str) -> None:
        self.name = name


def serialized(view) -> str:
    return json.dumps(view.to_components(), ensure_ascii=False)


class CommunityViewTests(unittest.TestCase):
    def setUp(self) -> None:
        roles = [Role("@everyone"), Role("Membro"), Role("Moderador"), Role("Administrador")]
        self.guild = SimpleNamespace(
            id=123,
            name="Servidor de testes",
            description="Comunidade oficial de testes.",
            member_count=72,
            members=[],
            owner=SimpleNamespace(display_name="Rafa"),
            owner_id=42,
            channels=[object()] * 8,
            text_channels=[object()] * 5,
            voice_channels=[object()] * 3,
            roles=roles,
            emojis=[object()] * 6,
            premium_subscription_count=2,
            created_at=datetime(2024, 1, 10, tzinfo=UTC),
            banner=Asset("https://cdn.discordapp.com/banner.png"),
            icon=Asset("https://cdn.discordapp.com/icon.png"),
        )

    def test_help_lists_all_public_commands(self) -> None:
        payload = serialized(help_view())

        for command in ("/serverinfo", "/status", "@Kael", "/perfil"):
            self.assertIn(command, payload)

        profile_command = next(command for command in CommunityCog.__cog_app_commands__ if command.name == "perfil")
        self.assertEqual(profile_command.parameters[0].name, "membro")

    def test_mention_has_dashboard_and_interactive_help(self) -> None:
        payload = serialized(mention_view("Rafa"))

        self.assertIn("Olá, Rafa", payload)
        self.assertIn("Abrir painel", payload)
        self.assertIn("Mostrar ajuda", payload)
        self.assertNotIn("Eu só respondo quando", payload)

    def test_serverinfo_has_real_media_and_every_role(self) -> None:
        payload = serialized(serverinfo_view(self.guild))

        self.assertIn("https://cdn.discordapp.com/banner.png", payload)
        self.assertIn("https://cdn.discordapp.com/icon.png", payload)
        self.assertIn("72", payload)
        self.assertIn("Administrador", payload)
        self.assertIn("Moderador", payload)
        self.assertIn("Membro", payload)
        self.assertIn("@everyone", payload)
        self.assertIn("/servidores/123", payload)

    def test_profile_has_avatar_dates_and_all_member_roles(self) -> None:
        member = SimpleNamespace(
            id=42,
            display_name="Rafa",
            name="rafa",
            display_avatar=Asset("https://cdn.discordapp.com/avatar.png"),
            created_at=datetime(2020, 3, 2, tzinfo=UTC),
            joined_at=datetime(2025, 5, 4, tzinfo=UTC),
            roles=[Role("@everyone"), Role("Membro"), Role("Administrador")],
            top_role=Role("Administrador"),
        )

        payload = serialized(profile_view(member))

        self.assertIn("https://cdn.discordapp.com/avatar.png", payload)
        self.assertIn("Maior cargo", payload)
        self.assertIn("Administrador", payload)
        self.assertIn("Membro", payload)
        self.assertNotIn("@everyone", payload)


class MentionListenerTests(unittest.IsolatedAsyncioTestCase):
    async def test_replies_only_to_direct_bot_mention(self) -> None:
        bot_user = SimpleNamespace(id=999)
        bot = MagicMock()
        bot.user = bot_user
        cog = CommunityCog(bot)
        bucket = MagicMock()
        bucket.update_rate_limit.return_value = None
        cog.mention_cooldown = MagicMock()
        cog.mention_cooldown.get_bucket.return_value = bucket

        message = MagicMock()
        message.author.bot = False
        message.author.display_name = "Rafa"
        message.guild = SimpleNamespace(id=123)
        message.mentions = [bot_user]
        message.reply = AsyncMock()

        await cog.on_message(message)

        message.reply.assert_awaited_once()
        self.assertFalse(message.reply.await_args.kwargs["mention_author"])

        message.reply.reset_mock()
        message.mentions = []
        await cog.on_message(message)
        message.reply.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
