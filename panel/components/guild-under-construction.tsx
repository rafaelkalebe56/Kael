'use client';

import Image from 'next/image';
import Link from 'next/link';
import { KaelArrowLeft, KaelConstruct, KaelEnter, KaelGrid, KaelMembers, KaelRefresh, KaelShield, KaelWelcome } from '@/components/kael-icons';
import { useEffect, useState } from 'react';

type Guild = { id: string; name: string; icon: string | null; banner: string | null; memberCount?: number };
type State = 'loading' | 'guest' | 'allowed' | 'denied' | 'error';

export function GuildUnderConstruction({ guildId }: { guildId: string }) {
  const [state, setState] = useState<State>('loading');
  const [guild, setGuild] = useState<Guild | null>(null);
  const [enlargedServerImage, setEnlargedServerImage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/discord/guilds', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) return setState('guest');
        if (!response.ok) return setState('error');
        const data = await response.json() as { guilds: Guild[] };
        const allowedGuild = data.guilds.find((item) => item.id === guildId) ?? null;
        setGuild(allowedGuild);
        setState(allowedGuild ? 'allowed' : 'denied');
      })
      .catch(() => setState('error'));
  }, [guildId]);

  if (state === 'loading') return <div className="guild-access-loading"><span /><p>Confirmando suas permissões no Discord...</p></div>;
  if (state === 'guest') {
    return <div className="panel-empty guild-access-state"><span className="panel-empty-icon"><KaelEnter /></span><p className="panel-state-label">SESSÃO EXPIRADA</p><h2>Entre com o Discord novamente</h2><p>Precisamos confirmar sua identidade e suas permissões antes de abrir esta comunidade.</p><button className="panel-primary-link" type="button" onClick={() => location.assign('/api/auth/discord')}>Entrar com Discord <KaelEnter /></button></div>;
  }
  if (state === 'denied') {
    return (
      <div className="guild-denied">
        <div className="guild-denied-copy"><span className="panel-empty-icon"><KaelShield /></span><p className="panel-state-label">ACESSO PROTEGIDO</p><h2>Essa comunidade não está disponível para sua conta.</h2><p>O Kael confirmou novamente suas permissões no Discord. Escolha um servidor que você possa gerenciar e onde o bot esteja presente.</p><Link className="panel-secondary-link" href="/servidores"><KaelArrowLeft /> Voltar aos servidores</Link></div>
        <div className="guild-denied-art"><Image src="/kael-confused.webp" alt="Kael com expressão de dúvida" width={520} height={520} unoptimized draggable={false} /></div>
      </div>
    );
  }
  if (state === 'error') {
    return <div className="panel-empty guild-access-state"><span className="panel-empty-icon"><KaelRefresh /></span><p className="panel-state-label">VERIFICAÇÃO INDISPONÍVEL</p><h2>Não conseguimos confirmar seu acesso.</h2><p>Por segurança, o painel não será aberto até o Discord e o Kael responderem.</p><Link className="panel-secondary-link" href={`/servidores/${guildId}`}><KaelRefresh /> Tentar novamente</Link></div>;
  }

  return (
    <div className="guild-overview">
      <aside className="guild-overview-nav" aria-label="Seções do servidor">
        <Link className="guild-overview-back" href="/servidores"><KaelArrowLeft /> Servidores</Link>
        <span className="guild-overview-nav-item active"><KaelGrid /> Visão geral</span>
        <a className="guild-overview-nav-item" href={`/servidores/${guildId}/boas-vindas`}><KaelWelcome /> Boas-vindas</a>
      </aside>

      <div className="guild-overview-main">
        <section className="guild-overview-hero" aria-labelledby="guild-title">
          {guild?.banner || guild?.icon ? <button className="guild-overview-banner" type="button" aria-label="Ampliar imagem do servidor" onClick={() => setEnlargedServerImage(guild.banner || guild.icon)}>
            {guild?.banner ? <Image src={guild.banner} alt="" fill sizes="(max-width: 760px) 100vw, 75vw" unoptimized draggable={false} /> : guild?.icon ? <Image className="guild-overview-banner-fallback-image" src={guild.icon} alt="" fill sizes="(max-width: 760px) 100vw, 75vw" unoptimized draggable={false} /> : <span className="guild-overview-banner-empty" />}
          </button> : <div className="guild-overview-banner" aria-hidden="true"><span className="guild-overview-banner-empty" /></div>}
          <div className="guild-overview-identity">
            {guild?.icon ? <button className="guild-overview-icon" type="button" aria-label="Ampliar ícone do servidor" onClick={() => setEnlargedServerImage(guild.icon)}><Image src={guild.icon} alt="" width={128} height={128} unoptimized draggable={false} /></button> : <span className="guild-overview-icon" aria-hidden="true">{(guild?.name ?? 'K').slice(0, 1).toUpperCase()}</span>}
            <div className="guild-overview-title">
              <h1 id="guild-title">{guild?.name ?? 'Sua comunidade'}</h1>
              <div className="guild-overview-meta">
                {typeof guild?.memberCount === 'number' && <span><KaelMembers /> {guild.memberCount.toLocaleString('pt-BR')} {guild.memberCount === 1 ? 'membro' : 'membros'}</span>}
                <span className="guild-overview-online"><i /> Kael conectado</span>
              </div>
            </div>
          </div>
        </section>
        {enlargedServerImage && <button className="welcome-server-lightbox" type="button" aria-label="Fechar visualização da imagem" onClick={() => setEnlargedServerImage(null)}><span className="welcome-server-lightbox-close" aria-hidden="true">×</span><span className="welcome-server-lightbox-frame"><Image src={enlargedServerImage} alt={`Imagem ampliada do servidor ${guild?.name ?? ''}`} fill sizes="90vw" unoptimized draggable={false} /></span></button>}

        <div className="guild-overview-grid">
          <section className="guild-development-card" aria-labelledby="development-title">
            <span className="guild-development-icon"><KaelConstruct /></span>
            <h2 id="development-title">Esta área está em desenvolvimento</h2>
            <p>Estamos preparando as próximas configurações do Kael. Não se preocupe, será rápido.</p>
            <span className="guild-development-status">Em breve</span>
          </section>

          <section className="guild-permissions-card" aria-labelledby="permissions-title">
            <h2 id="permissions-title">Permissões</h2>
            <span className="guild-permissions-icon"><KaelShield /></span>
            <strong>Tudo certo</strong>
            <p>Seu acesso ao painel e a conexão do Kael foram confirmados com segurança.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
