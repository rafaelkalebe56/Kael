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

CUSTOM_EMOJI_PATTERN = re.compile(r"^<a?:[A-Za-z0-9_]{2,32}:\d{17,20}>$")
UNICODE_EMOJI_PATTERN = re.compile(
    "["
    "\U0001F000-\U0001FAFF"
    "\u2600-\u27BF"
    "\u2300-\u23FF"
    "\u2B00-\u2BFF"
    "\uFE0F"
    "\u20E3"
    "]"
)


class WelcomeValidationError(ValueError):
    pass


def _text(value: Any, maximum: int, default: str = "") -> str:
    if not isinstance(value, str):
        return default
    return value.strip()[:maximum]


def _web_url(
    value: Any,
    *,
    allow_member_avatar: bool = False,
    maximum: int = 2048,
) -> str:
    text = _text(value, maximum)
    if allow_member_avatar and text in {"{membro.avatar}", "{sem.imagem}"}:
        return text
    if not text:
        return ""
    if any(character.isspace() or ord(character) < 32 for character in text):
        raise WelcomeValidationError("Use uma URL web completa e sem espaços.")
    has_scheme = re.match(r"^[A-Za-z][A-Za-z0-9+.-]*:", text) is not None
    normalized = text if has_scheme else f"https://{text}"
    if len(normalized) > maximum:
        raise WelcomeValidationError("A URL informada é muito longa.")
    parsed = urlparse(normalized)
    try:
        port = parsed.port
    except ValueError as error:
        raise WelcomeValidationError("Use uma URL web completa e válida.") from error
    if (
        parsed.scheme not in {"http", "https"}
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or (port is not None and not 1 <= port <= 65535)
    ):
        raise WelcomeValidationError("Use uma URL web completa e válida.")
    return normalized


def _button_emoji(value: Any) -> str:
    text = _text(value, 100)
    if not text:
        return ""
    if CUSTOM_EMOJI_PATTERN.fullmatch(text):
        return text
    if not re.search(r"[A-Za-z]", text) and UNICODE_EMOJI_PATTERN.search(text):
        return text
    raise WelcomeValidationError(
        "Use um emoji normal ou personalizado no formato <:nome:id>."
    )


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
    settings["authorUrl"] = _web_url(payload.get("authorUrl"))
    settings["authorIcon"] = _web_url(payload.get("authorIcon"), allow_member_avatar=True)
    settings["thumbnail"] = _web_url(payload.get("thumbnail"), allow_member_avatar=True)
    settings["bannerUrl"] = _web_url(payload.get("bannerUrl"), allow_member_avatar=True)

    accent = _text(payload.get("accentColor"), 7, "#4055FF").upper()
    if not re.fullmatch(r"#[0-9A-F]{6}", accent):
        raise WelcomeValidationError("Use uma cor no formato #4055FF.")
    settings["accentColor"] = accent
    settings["footer"] = _text(payload.get("footer"), 2048)
    settings["footerIcon"] = _web_url(payload.get("footerIcon"), allow_member_avatar=True)

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
        url = _web_url(raw_button.get("url"), maximum=512)
        emoji = _button_emoji(raw_button.get("emoji"))
        if not label or not url:
            raise WelcomeValidationError("Cada botão precisa de nome e uma URL web válida.")
        buttons.append({"label": label, "url": url, "emoji": emoji})
    settings["buttons"] = buttons

    settings["ignoreBots"] = payload.get("ignoreBots") is not False
    settings["mentionOnJoin"] = payload.get("mentionOnJoin") is True
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


def _asset_url(asset: Any) -> str | None:
    return str(asset.url) if asset and getattr(asset, "url", None) else None


def _media_url(
    value: str,
    member: discord.abc.User,
    fallback_url: str | None,
) -> str | None:
    if value == "{sem.imagem}":
        return None
    if value == "{membro.avatar}":
        return str(member.display_avatar.url)
    if value.startswith(("http://", "https://")):
        return value
    return fallback_url


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
    guild_icon = _asset_url(guild.icon)
    guild_banner = _asset_url(getattr(guild, "banner", None))
    fallback_enabled = bool(settings.get("fallbackServerIcon"))
    author_icon = _media_url(
        str(settings.get("authorIcon") or ""),
        member,
        guild_icon if fallback_enabled else None,
    )
    if (
        not author_icon
        and settings.get("authorIcon") != "{sem.imagem}"
        and guild.me
        and guild.me.display_avatar
    ):
        author_icon = str(guild.me.display_avatar.url)
    embed.set_author(name=author_name, url=author_url, icon_url=author_icon)

    thumbnail = _media_url(
        str(settings.get("thumbnail") or ""),
        member,
        guild_icon if fallback_enabled else None,
    )
    if thumbnail:
        embed.set_thumbnail(url=thumbnail)

    banner_url = _media_url(
        str(settings.get("bannerUrl") or ""),
        member,
        (guild_banner or guild_icon) if fallback_enabled else None,
    )
    if banner_url:
        embed.set_image(url=banner_url)

    footer = render_welcome_text(str(settings.get("footer") or ""), member, guild, channel)
    footer_icon = _media_url(
        str(settings.get("footerIcon") or ""),
        member,
        guild_icon if fallback_enabled else None,
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
    allowed_mentions = discord.AllowedMentions(everyone=False, roles=True, users=True, replied_user=False)

    if delivery in {"channel", "both"}:
        if not isinstance(channel, discord.abc.Messageable):
            raise WelcomeValidationError("O canal configurado não está mais disponível.")
        embed, view = build_welcome_embed(settings, member, guild, channel)
        await channel.send(
            content=member.mention if settings.get("mentionOnJoin") else None,
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
