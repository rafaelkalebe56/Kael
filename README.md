# Kael

Kael é um bot modular para comunidades no Discord. Esta primeira base inclui
configuração segura, banco separado por servidor e o comando `/status`.

## Padrões de interface

- Mensagens novas usam **Discord Components v2**, não embeds.
- Emojis serão próprios da marca Kael; não usamos pacotes de emojis prontos.

## Rodar localmente

1. Crie um ambiente virtual e instale `pip install -r requirements.txt`.
2. Copie `.env.example` para `.env`.
3. Preencha somente `DISCORD_TOKEN` no arquivo `.env` local.
4. Execute `python main.py`.

Para desenvolver com atualização imediata do comando, preencha também
`KAEL_DEV_GUILD_ID` com o ID do seu servidor de teste. Nunca envie o token
em chat nem o inclua no Git.
