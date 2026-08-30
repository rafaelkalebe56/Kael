# Kael

Kael é um bot modular para comunidades no Discord. Esta primeira base inclui
configuração segura, banco separado por servidor e o comando `/status`.

## Dados persistentes

O Kael usa SQLite, com uma configuração isolada para cada servidor. Na
Railway, ele detecta automaticamente o Volume montado em `/data` e salva o
banco em `/data/kael.sqlite3`. Localmente, o arquivo fica em `data/` e não é
enviado ao Git. Caso precise usar outro local, defina `KAEL_DATA_DIR`.

Para o PainelKael mostrar somente servidores onde o bot está instalado, defina
`DASHBOARD_API_KEY` no serviço Kael e use o mesmo valor como `BOT_API_KEY` no
PainelKael. A comunicação ocorre pela rede privada da Railway.

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
