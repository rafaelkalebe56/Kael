from __future__ import annotations

import discord


KAEL_ACCENT = 0x6D5CFF


def information_card(title: str, body: str, *, accent_color: int = KAEL_ACCENT) -> discord.ui.LayoutView:
    """Cria uma mensagem Components v2 no padrão visual do Kael.

    Este projeto não usa embeds em mensagens novas. Os emojis da marca entram
    apenas depois de serem criados e registrados no Discord.
    """

    view = discord.ui.LayoutView(timeout=None)
    view.add_item(
        discord.ui.Container(
            discord.ui.TextDisplay(f"## {title}\n{body}"),
            accent_color=accent_color,
        )
    )
    return view
