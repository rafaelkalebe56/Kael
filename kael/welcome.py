from __future__ import annotations

import asyncio
import re
from datetime import datetime
from typing import Any, Mapping
from urllib.parse import urlparse

import discord

from kael.database import DEFAULT_WELCOME_SETTINGS


VARIABLES = (
    "{membro}",
    "{membro.nome}",
    "{membro.avatar}",
    "{servidor}",
    "{membros}",
    "{canal}",
    "{data}",
    "{hora}",
)


class WelcomeValidationError(ValueError):
    pass


def _text(value: Any, maximum: int, default: str = "") -> str:
    if not isinstance(value, str):
        return default
    return value.strip()[:maximum]


def _https_url(value: Any, *, allow_member_avatar: bool = False) -> str:
    text = _text(value, 2048)
    if allow_member_avatar and text == "{membro.avatar}":
        return text
    if not text:
        return ""
    parsed = urlparse(text)
    if parsed.scheme != "https" or not parsed.netloc:
        raise WelcomeValidationError("As URLs precisam começar com https://.")
    return text


def validate_welcome_settings(payload: Any, valid_channel_ids: set[str]) -> dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise WelcomeValidationError("Configuração inválida.")

    settings = dict(DEFAULT_WELCOME_SETTINGS)
    settings["enabled"] = payload.get("enabled") is True
    delivery = payload.get("delivery")
    settings["delivery"] = delivery if delivery in {"channel", "dm", "both"} else "channel"

    channel_id = payload.get("channelId")
    settings["channelId"] = str(channel_id) if channel_id is not None else None
    if settings["delivery"] in {"channel", "both"} and settings["channelId"] not in valid_channel_ids:
        raise WelcomeValidationError("Escolha um canal em que o Kael possa enviar mensagens.")

    settings["format"] = "embed"
    settings["title"] = _text(payload.get("title"), 256, DEFAULT_WELCOME_SETTINGS["title"])
    settings["message"] = _text(payload.get("message"), 2000, DEFAULT_WELCOME_SETTINGS["message"])
    if not settings["title"] or not settings["message"]:
        raise WelcomeValidationError("Preencha o título e a mensagem.")

    settings["authorName"] = _text(payload.get("authorName"), 256, "Kael")
    settings["authorUrl"] = _https_url(payload.get("authorUrl"))
    settings["authorIcon"] = _https_url(payload.get("authorIcon"), allow_member_avatar=True)
    settings["thumbnail"] = _https_url(payload.get("thumbnail"), allow_member_avatar=True)
    settings["bannerUrl"] = _https_url(payload.get("bannerUrl"))

    accent = _text(payload.get("accentColor"), 7, "#4055FF").upper()
    if not re.fullmatch(r"#[0-9A-F]{6}", accent):
        raise WelcomeValidationError("Use uma cor no formato #4055FF.")
    settings["accentColor"] = accent
    settings["footer"] = _text(payload.get("footer"), 2048)
    settings["footerIcon"] = _https_url(payload.get("footerIcon"), allow_member_avatar=True)

    raw_buttons = payload.get("buttons")
    if not isinstance(raw_buttons, list):
        raw_buttons = []
    if len(raw_buttons) > 3:
        raise WelcomeValidationError("Use no máximo três botões.")
    buttons: list[dict[str, str]] = []
    for raw_button in raw_buttons:
        if not isinstance(raw_button, Mapping):
            continue
        label = _text(raw_button.get("label"), 80)
        url = _https_url(raw_button.get("url"))
        emoji = _text(raw_button.get("emoji"), 100)
        if not label or not url:
            raise WelcomeValidationError("Cada botão precisa de nome e link HTTPS.")
        buttons.append({"label": label, "url": url, "emoji": emoji})
    settings["buttons"] = buttons

    settings["ignoreBots"] = payload.get("ignoreBots") is not False
    delay = payload.get("delaySeconds")
    settings["delaySeconds"] = max(0, min(30, int(delay) if isinstance(delay, (int, float)) else 1))
    auto_delete = payload.get("autoDeleteSeconds")
    settings["autoDeleteSeconds"] = (
        max(5, min(86400, int(auto_delete)))
        if isinstance(auto_delete, (int, float)) and auto_delete > 0
        else None
    )
    settings["deduplicate"] = payload.get("deduplicate") is not False
    settings["fallbackServerIcon"] = payload.get("fallbackServerIcon") is not False
    return settings


def render_welcome_text(template: str, member: discord.abc.User, guild: discord.Guild, channel: discord.abc.GuildChannel | None) -> str:
    now = datetime.now().astimezone()
    replacements = {
        "{membro}": member.mention,
        "{membro.nome}": getattr(member, "display_name", member.name),
        "{membro.avatar}": str(member.display_avatar.url),
        "{servidor}": guild.name,
        "{membros}": str(guild.member_count or len(guild.members)),
        "{canal}": channel.mention if isinstance(channel, discord.abc.GuildChannel) else "este canal",
        "{data}": now.strftime("%d/%m/%Y"),
        "{hora}": now.strftime("%H:%M"),
    }
    rendered = template
    for variable in VARIABLES:
        rendered = rendered.replace(variable, replacements[variable])
    return rendered


def _media_url(value: str, member: discord.abc.User, guild: discord.Guild, fallback: bool) -> str | None:
    if value == "{membro.avatar}":
        return str(member.display_avatar.url)
    if value.startswith("https://"):
        return value
    if fallback and guild.icon:
        return str(guild.icon.url)
    return None


def build_welcome_embed(
    settings: Mapping[str, Any],
    member: discord.abc.User,
    guild: discord.Guild,
    channel: discord.abc.GuildChannel | None,
) -> tuple[discord.Embed, discord.ui.View | None]:
    accent = int(str(settings["accentColor"]).lstrip("#"), 16)
    title = render_welcome_text(str(settings["title"]), member, guild, channel)
    message = render_welcome_text(str(settings["message"]), member, guild, channel)
    embed = discord.Embed(title=title, description=message, colour=accent)

    author_name = render_welcome_text(
        str(settings.get("authorName") or "Kael"), member, guild, channel
    )
    author_url = str(settings.get("authorUrl") or "") or None
    author_icon = _media_url(str(settings.get("authorIcon") or ""), member, guild, False)
    if not author_icon and guild.me and guild.me.display_avatar:
        author_icon = str(guild.me.display_avatar.url)
    embed.set_author(name=author_name, url=author_url, icon_url=author_icon)

    thumbnail = _media_url(
        str(settings.get("thumbnail") or ""),
        member,
        guild,
        bool(settings.get("fallbackServerIcon")),
    )
    if thumbnail:
        embed.set_thumbnail(url=thumbnail)

    banner_url = _media_url(
        str(settings.get("bannerUrl") or ""),
        member,
        guild,
        bool(settings.get("fallbackServerIcon")),
    )
    if banner_url:
        embed.set_image(url=banner_url)

    footer = render_welcome_text(str(settings.get("footer") or ""), member, guild, channel)
    footer_icon = _media_url(
        str(settings.get("footerIcon") or ""),
        member,
        guild,
        bool(settings.get("fallbackServerIcon")),
    )
    if footer:
        embed.set_footer(text=footer, icon_url=footer_icon)

    buttons = settings.get("buttons") or []
    view: discord.ui.View | None = None
    if buttons:
        view = discord.ui.View(timeout=None)
        for button in buttons[:3]:
            try:
                view.add_item(
                    discord.ui.Button(
                        style=discord.ButtonStyle.link,
                        label=button["label"],
                        url=button["url"],
                        emoji=button.get("emoji") or None,
                    )
                )
            except (TypeError, ValueError):
                view.add_item(
                    discord.ui.Button(style=discord.ButtonStyle.link, label=button["label"], url=button["url"])
                )
    return embed, view


async def send_welcome(
    bot: discord.Client,
    guild: discord.Guild,
    member: discord.abc.User,
    settings: Mapping[str, Any],
    *,
    target_override: str | None = None,
    dm_user: discord.abc.User | None = None,
) -> None:
    channel = guild.get_channel(int(settings["channelId"])) if settings.get("channelId") else None
    delivery = target_override or str(settings.get("delivery") or "channel")
    delete_after = settings.get("autoDeleteSeconds")
    allowed_mentions = discord.AllowedMentions(everyone=False, roles=False, users=True, replied_user=False)

    if delivery in {"channel", "both"}:
        if not isinstance(channel, discord.abc.Messageable):
            raise WelcomeValidationError("O canal configurado não está mais disponível.")
        embed, view = build_welcome_embed(settings, member, guild, channel)
        await channel.send(
            embed=embed,
            view=view,
            allowed_mentions=allowed_mentions,
            delete_after=delete_after,
        )

    if delivery in {"dm", "both", "self"}:
        recipient = dm_user or member
        embed, view = build_welcome_embed(settings, member, guild, channel)
        await recipient.send(
            embed=embed,
            view=view,
            allowed_mentions=allowed_mentions,
            delete_after=delete_after,
        )


async def send_configured_welcome(bot: discord.Client, member: discord.Member, settings: Mapping[str, Any]) -> None:
    if not settings.get("enabled") or (settings.get("ignoreBots") and member.bot):
        return
    delay = int(settings.get("delaySeconds") or 0)
    if delay:
        await asyncio.sleep(delay)
    await send_welcome(bot, member.guild, member, settings)
