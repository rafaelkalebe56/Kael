from __future__ import annotations

import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace

from kael.database import DEFAULT_WELCOME_SETTINGS, Database
from kael.welcome import (
    WelcomeValidationError,
    build_welcome_embed,
    render_welcome_text,
    validate_welcome_settings,
)


class Asset:
    def __init__(self, url: str) -> None:
        self.url = url


class Member:
    mention = "<@42>"
    display_name = "Rafa"
    name = "rafa"
    display_avatar = Asset("https://cdn.discordapp.com/avatar.png")


class Guild:
    name = "Servidor de teste"
    member_count = 5
    members: list[object] = []
    icon = Asset("https://cdn.discordapp.com/server-icon.png")
    banner = Asset("https://cdn.discordapp.com/server-banner.png")
    me = SimpleNamespace(display_avatar=Asset("https://cdn.discordapp.com/kael.png"))


def valid_payload() -> dict[str, object]:
    payload = dict(DEFAULT_WELCOME_SETTINGS)
    payload.update({"enabled": True, "channelId": "10"})
    return payload


class WelcomeValidationTests(unittest.TestCase):
    def test_normalizes_limits_and_embed_format(self) -> None:
        payload = valid_payload()
        payload.update(
            {
                "format": "components_v2",
                "title": "A" * 300,
                "delaySeconds": 999,
                "autoDeleteSeconds": 1,
            }
        )

        settings = validate_welcome_settings(payload, {"10"})

        self.assertEqual(settings["format"], "embed")
        self.assertEqual(len(settings["title"]), 256)
        self.assertEqual(settings["delaySeconds"], 30)
        self.assertEqual(settings["autoDeleteSeconds"], 5)

    def test_rejects_incomplete_or_unsafe_urls(self) -> None:
        invalid_urls = (
            "https://",
            "ftp://example.com/file.png",
            "javascript:alert(1)",
            "data:text/plain,kael",
            "https://user:password@example.com",
            "https://example.com/with space",
            "https://example.com:99999",
        )

        for url in invalid_urls:
            with self.subTest(url=url), self.assertRaises(WelcomeValidationError):
                validate_welcome_settings({**valid_payload(), "authorUrl": url}, {"10"})

    def test_accepts_and_normalizes_web_urls(self) -> None:
        examples = (
            ("example.com", "https://example.com"),
            ("www.example.com/path", "https://www.example.com/path"),
            ("http://example.com", "http://example.com"),
            ("https://example.com/path?q=kael", "https://example.com/path?q=kael"),
        )
        for url, expected in examples:
            with self.subTest(url=url):
                settings = validate_welcome_settings(
                    {
                        **valid_payload(),
                        "authorUrl": url,
                        "buttons": [{"label": "Abrir", "url": url, "emoji": ""}],
                    },
                    {"10"},
                )
                self.assertEqual(settings["authorUrl"], expected)
                self.assertEqual(settings["buttons"][0]["url"], expected)

    def test_validates_button_urls_and_emojis(self) -> None:
        for emoji in ("✨", "<:kael:123456789012345678>", "<a:kael:123456789012345678>"):
            with self.subTest(emoji=emoji):
                settings = validate_welcome_settings(
                    {
                        **valid_payload(),
                        "buttons": [
                            {
                                "label": "Abrir",
                                "url": "https://kael.up.railway.app",
                                "emoji": emoji,
                            }
                        ],
                    },
                    {"10"},
                )
                self.assertEqual(settings["buttons"][0]["emoji"], emoji)

        for emoji in ("texto", "kael123"):
            with self.subTest(emoji=emoji), self.assertRaises(WelcomeValidationError):
                validate_welcome_settings(
                    {
                        **valid_payload(),
                        "buttons": [
                            {
                                "label": "Abrir",
                                "url": "https://kael.up.railway.app",
                                "emoji": emoji,
                            }
                        ],
                    },
                    {"10"},
                )

        with self.assertRaises(WelcomeValidationError):
            validate_welcome_settings(
                {
                    **valid_payload(),
                    "buttons": [{"label": "Abrir", "url": "https://", "emoji": ""}],
                },
                {"10"},
            )


class WelcomeRenderingTests(unittest.TestCase):
    def test_renders_variables_embed_button_and_server_banner(self) -> None:
        payload = valid_payload()
        payload.update(
            {
                "message": "Oi {membro.nome} em {servidor} no {canal}",
                "bannerUrl": "",
                "buttons": [
                    {
                        "label": "Site",
                        "url": "https://kael.up.railway.app",
                        "emoji": "✨",
                    }
                ],
            }
        )
        settings = validate_welcome_settings(payload, {"10"})

        embed, view = build_welcome_embed(settings, Member(), Guild(), None)
        data = embed.to_dict()

        self.assertEqual(data["description"], "Oi Rafa em Servidor de teste no este canal")
        self.assertEqual(data["image"]["url"], Guild.banner.url)
        self.assertEqual(data["thumbnail"]["url"], Member.display_avatar.url)
        self.assertIsNotNone(view)
        self.assertEqual(view.children[0].label, "Site")
        self.assertEqual(str(view.children[0].emoji), "✨")

    def test_renders_all_text_variables(self) -> None:
        rendered = render_welcome_text(
            "{membro}|{membro.nome}|{servidor}|{membros}|{canal}",
            Member(),
            Guild(),
            None,
        )
        self.assertEqual(rendered, "<@42>|Rafa|Servidor de teste|5|este canal")


class WelcomeDatabaseTests(unittest.TestCase):
    def test_persists_and_migrates_legacy_format(self) -> None:
        settings = validate_welcome_settings(valid_payload(), {"10"})

        with TemporaryDirectory() as directory:
            database = Database(Path(directory) / "kael.db")
            database.initialize()
            database.save_welcome_settings(123, settings)
            loaded = database.get_welcome_settings(123)

            self.assertTrue(loaded["enabled"])
            self.assertEqual(loaded["channelId"], "10")
            self.assertEqual(loaded["format"], "embed")

            legacy = {**settings, "format": "components_v2"}
            database.connection.execute(
                "UPDATE guild_settings SET welcome_config = ? WHERE guild_id = ?",
                (json.dumps(legacy), "123"),
            )
            database.connection.commit()
            self.assertEqual(database.get_welcome_settings(123)["format"], "embed")
            database.close()


if __name__ == "__main__":
    unittest.main()
