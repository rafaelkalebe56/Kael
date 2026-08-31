# Escopo do Kael — versão inicial

## Objetivo

Criar uma primeira versão simples, segura e reconhecível do Kael: um bot Discord com uma apresentação pública própria e um painel conectado à conta do usuário.

## Incluído nesta versão

- Home responsiva em modo claro e escuro.
- Apresentação do Kael, recursos principais e convite para adicionar o bot.
- Acesso visível ao painel pela rota `/servidores`.
- Login oficial pelo Discord, com sessão persistente e encerramento de sessão.
- Lista somente dos servidores que o usuário pode gerenciar e nos quais o Kael está presente.
- Foto, banner e quantidade de membros dos servidores quando esses dados estiverem disponíveis.
- Página individual de cada servidor com aviso de área em construção.
- Página 404 personalizada com o Kael.
- Identidade visual própria, ícones minimalistas e layouts responsivos.

## Próxima etapa

- Construir a visão geral de cada servidor.
- Adicionar configurações de moderação, utilidades, automações e registros.
- Exibir estados claros de salvamento, erro e falta de permissão.
- Conectar cada configuração do painel ao bot de forma segura.

## Fora do escopo por enquanto

- Cobranças ou planos pagos.
- Aplicativo para celular.
- Marketplace de módulos.
- Configurações avançadas de vários servidores ao mesmo tempo.

## Fluxo principal

1. A pessoa conhece o Kael pela home.
2. Adiciona o bot ao Discord ou seleciona **Acessar painel**.
3. Se necessário, entra com o Discord.
4. Escolhe um servidor autorizado em `/servidores`.
5. Abre `/servidores/{id}` para gerenciar aquela comunidade.
