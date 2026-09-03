from __future__ import annotations

import discord
from discord import app_commands
from discord.ext import commands

from kael.emojis import (
    KAEL_HELP,
    KAEL_INFO,
    KAEL_LINK,
    KAEL_MEMBER,
    KAEL_PANEL,
    KAEL_ROLES,
    KAEL_SERVER,
    KAEL_SHIELD,
    KAEL_CALENDAR,
    KAEL_CLOCK,
    KAEL_AVATAR,
    KAEL_SUCCESS,
)
from kael.ui import KAEL_ACCENT


PANEL_URL = "https://kael.up.railway.app"
NO_MENTIONS = discord.AllowedMentions.none()


def _safe(value: object) -> str:
    return discord.utils.escape_markdown(str(value))


def _date(value) -> str:
    return discord.utils.format_dt(value, "D") if value else "Não disponível"


def _role_pages(guild: discord.Guild, page_size: int = 30) -> list[list[discord.Role]]:
    roles = list(reversed(guild.roles))
    return [roles[index : index + page_size] for index in range(0, len(roles), page_size)] or [[]]


def _role_names(roles: list[discord.Role]) -> str:
    return " · ".join(_safe(role.name) for role in roles) or "Nenhum cargo"


class ShowHelpButton(discord.ui.Button):
    def __init__(self) -> None:
        super().__init__(style=discord.ButtonStyle.secondary, label="Mostrar ajuda", emoji=KAEL_HELP)

    async def callback(self, interaction: discord.Interaction) -> None:
        await interaction.response.send_message(view=help_view(), ephemeral=True, allowed_mentions=NO_MENTIONS)


class HelpCategorySelect(discord.ui.Select):
    def __init__(self, category: str) -> None:
        options = [
            discord.SelectOption(label="Todos os comandos", value="all", default=category == "all"),
            discord.SelectOption(label="Comunidade", value="community", default=category == "community"),
            discord.SelectOption(label="Perfil", value="profile", default=category == "profile"),
        ]
        super().__init__(placeholder="Escolha uma categoria", options=options)

    async def callback(self, interaction: discord.Interaction) -> None:
        await interaction.response.edit_message(view=help_view(self.values[0]), allowed_mentions=NO_MENTIONS)


class ShowRolesButton(discord.ui.Button):
    def __init__(self) -> None:
        super().__init__(style=discord.ButtonStyle.secondary, label="Ver todos os cargos", emoji=KAEL_ROLES)

    async def callback(self, interaction: discord.Interaction) -> None:
        if interaction.guild is None:
            return await interaction.response.send_message("Servidor indisponível.", ephemeral=True)
        await interaction.response.send_message(
            view=roles_view(interaction.guild),
            ephemeral=True,
            allowed_mentions=NO_MENTIONS,
        )


class RolesPageButton(discord.ui.Button):
    def __init__(self, page: int, *, label: str, disabled: bool = False) -> None:
        super().__init__(style=discord.ButtonStyle.secondary, label=label, disabled=disabled)
        self.page = page

    async def callback(self, interaction: discord.Interaction) -> None:
        if interaction.guild is None:
            return await interaction.response.send_message("Servidor indisponível.", ephemeral=True)
        await interaction.response.edit_message(view=roles_view(interaction.guild, self.page), allowed_mentions=NO_MENTIONS)


def mention_view(display_name: str) -> discord.ui.LayoutView:
    view = discord.ui.LayoutView(timeout=300)
    view.add_item(
        discord.ui.Container(
            discord.ui.TextDisplay(
                f"## {KAEL_AVATAR} Olá, {_safe(display_name)}.\n"
                "Você me chamou? Posso abrir meus comandos ou levar você ao painel."
            ),
            discord.ui.ActionRow(
                discord.ui.Button(
                    style=discord.ButtonStyle.link,
                    label="Abrir painel",
                    emoji=KAEL_PANEL,
                    url=f"{PANEL_URL}/servidores",
                ),
                ShowHelpButton(),
            ),
            accent_color=KAEL_ACCENT,
        )
    )
    return view


def help_view(category: str = "all") -> discord.ui.LayoutView:
    commands_by_category = {
        "community": [
            f"{KAEL_SERVER} `/serverinfo` — Informações completas desta comunidade.",
            f"{KAEL_SUCCESS} `/status` — Confirma a conexão e a latência do Kael.",
            f"{KAEL_AVATAR} `@Kael` — Abre a ajuda rápida ao mencionar o bot.",
        ],
        "profile": [f"{KAEL_MEMBER} `/perfil [membro]` — Mostra seu perfil ou o de outra pessoa."],
    }
    selected = (
        commands_by_category[category]
        if category in commands_by_category
        else commands_by_category["community"] + commands_by_category["profile"]
    )
    view = discord.ui.LayoutView(timeout=300)
    view.add_item(
        discord.ui.Container(
            discord.ui.TextDisplay(f"## {KAEL_HELP} Central de ajuda\nEscolha uma categoria para encontrar o comando certo."),
            discord.ui.Separator(),
            discord.ui.TextDisplay("\n".join(selected)),
            discord.ui.ActionRow(HelpCategorySelect(category)),
            discord.ui.ActionRow(
                discord.ui.Button(style=discord.ButtonStyle.link, label="Abrir site", emoji=KAEL_LINK, url=f"{PANEL_URL}/inicio")
            ),
            accent_color=KAEL_ACCENT,
        )
    )
    return view


def roles_view(guild: discord.Guild, page: int = 0) -> discord.ui.LayoutView:
    pages = _role_pages(guild)
    page = max(0, min(page, len(pages) - 1))
    view = discord.ui.LayoutView(timeout=300)
    view.add_item(
        discord.ui.Container(
            discord.ui.TextDisplay(
                f"## {KAEL_ROLES} Cargos de {_safe(guild.name)}\n"
                f"{_role_names(pages[page])}\n\n"
                f"Página {page + 1} de {len(pages)} · {len(guild.roles)} cargos"
            ),
            discord.ui.ActionRow(
                RolesPageButton(page - 1, label="Anterior", disabled=page == 0),
                RolesPageButton(page + 1, label="Próxima", disabled=page >= len(pages) - 1),
            ),
            accent_color=KAEL_ACCENT,
        )
    )
    return view


def serverinfo_view(guild: discord.Guild) -> discord.ui.LayoutView:
    member_count = guild.member_count if guild.member_count is not None else len(guild.members)
    owner = guild.owner.display_name if guild.owner else f"ID {guild.owner_id}"
    roles = list(reversed(guild.roles))
    visible_roles = roles if len(roles) <= 20 else roles[:20]
    description = guild.description or "Uma comunidade cuidada com o Kael."
    details = (
        f"## {KAEL_SERVER} {_safe(guild.name)}\n{_safe(description)}\n\n"
        f"{KAEL_MEMBER} **Membros**\n{member_count}\n\n"
        f"{KAEL_INFO} **Canais**\n{len(guild.channels)} ({len(guild.text_channels)} de texto · {len(guild.voice_channels)} de voz)\n\n"
        f"{KAEL_ROLES} **Cargos**\n{len(guild.roles)}\n\n"
        f"{KAEL_SUCCESS} **Impulsos**\n{guild.premium_subscription_count or 0}\n\n"
        f"{KAEL_SHIELD} **Dono do servidor**\n{_safe(owner)}\n\n"
        f"{KAEL_AVATAR} **Emojis disponíveis**\n{len(guild.emojis)}\n\n"
        f"{KAEL_CALENDAR} **Servidor criado em**\n{_date(guild.created_at)}\n\n"
        f"{KAEL_CLOCK} **ID**\n`{guild.id}`"
    )
    media_items = []
    if guild.banner:
        media_items.append(discord.MediaGalleryItem(str(guild.banner.url), description=f"Banner de {guild.name}"))
    if guild.icon:
        media_items.append(discord.MediaGalleryItem(str(guild.icon.url), description=f"Ícone de {guild.name}"))

    children: list[discord.ui.Item] = []
    if media_items:
        children.append(discord.ui.MediaGallery(*media_items))
    children.extend(
        [
            discord.ui.TextDisplay(details),
            discord.ui.Separator(),
            discord.ui.TextDisplay(
                f"{KAEL_ROLES} **Todos os cargos**\n{_role_names(visible_roles)}"
                + (f"\n\nMais {len(roles) - len(visible_roles)} cargos disponíveis no botão abaixo." if len(roles) > 20 else "")
            ),
        ]
    )
    actions: list[discord.ui.Item] = [
        discord.ui.Button(
            style=discord.ButtonStyle.link,
            label="Abrir painel",
            emoji=KAEL_PANEL,
            url=f"{PANEL_URL}/servidores/{guild.id}",
        )
    ]
    if len(roles) > 20:
        actions.append(ShowRolesButton())
    children.append(discord.ui.ActionRow(*actions))

    view = discord.ui.LayoutView(timeout=300)
    view.add_item(discord.ui.Container(*children, accent_color=KAEL_ACCENT))
    return view


def profile_view(member: discord.Member) -> discord.ui.LayoutView:
    roles = list(reversed(member.roles[1:]))
    highest_role = member.top_role.name if len(member.roles) > 1 else "Nenhum cargo"
    body = (
        f"## {KAEL_MEMBER} {_safe(member.display_name)}\n"
        f"@{_safe(member.name)}\n\n"
        f"{KAEL_CALENDAR} **Conta criada em**\n{_date(member.created_at)}\n\n"
        f"{KAEL_CLOCK} **Entrou no servidor**\n{_date(member.joined_at)}\n\n"
        f"{KAEL_SHIELD} **Maior cargo**\n{_safe(highest_role)}\n\n"
        f"{KAEL_ROLES} **Cargos**\n{_role_names(roles)}\n\n"
        f"{KAEL_INFO} **ID**\n`{member.id}`"
    )
    view = discord.ui.LayoutView(timeout=300)
    view.add_item(
        discord.ui.Container(
            discord.ui.Section(
                discord.ui.TextDisplay(body),
                accessory=discord.ui.Thumbnail(str(member.display_avatar.url), description=f"Avatar de {member.display_name}"),
            ),
            discord.ui.ActionRow(
                discord.ui.Button(
                    style=discord.ButtonStyle.link,
                    label="Ver avatar",
                    emoji=KAEL_LINK,
                    url=str(member.display_avatar.url),
                )
            ),
            accent_color=KAEL_ACCENT,
        )
    )
    return view


class CommunityCog(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot
        self.mention_cooldown = commands.CooldownMapping.from_cooldown(1, 5, commands.BucketType.user)

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message) -> None:
        if message.author.bot or message.guild is None or self.bot.user is None:
            return
        if self.bot.user not in message.mentions:
            return
        if self.mention_cooldown.get_bucket(message).update_rate_limit():
            return
        await message.reply(
            view=mention_view(message.author.display_name),
            mention_author=False,
            allowed_mentions=NO_MENTIONS,
        )

    @app_commands.command(name="ajuda", description="Mostra os comandos disponíveis no Kael.")
    async def help_command(self, interaction: discord.Interaction) -> None:
        await interaction.response.send_message(view=help_view(), ephemeral=True, allowed_mentions=NO_MENTIONS)

    @app_commands.command(name="serverinfo", description="Mostra informações completas deste servidor.")
    @app_commands.guild_only()
    async def serverinfo(self, interaction: discord.Interaction) -> None:
        if interaction.guild is None:
            return
        await interaction.response.send_message(view=serverinfo_view(interaction.guild), allowed_mentions=NO_MENTIONS)

    @app_commands.command(name="perfil", description="Mostra seu perfil ou o perfil de outro membro.")
    @app_commands.describe(membro="Membro que você deseja consultar")
    @app_commands.guild_only()
    async def profile(self, interaction: discord.Interaction, membro: discord.Member | None = None) -> None:
        selected_member = membro or interaction.user
        if not isinstance(selected_member, discord.Member):
            return await interaction.response.send_message("Esse perfil não está disponível neste servidor.", ephemeral=True)
        await interaction.response.send_message(view=profile_view(selected_member), allowed_mentions=NO_MENTIONS)


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(CommunityCog(bot))
