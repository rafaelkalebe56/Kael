'use client';

import Image from 'next/image';
import Link from 'next/link';
import { KaelArrowLeft, KaelConstruct, KaelEnter, KaelRefresh, KaelShield } from '@/components/kael-icons';
import { useEffect, useState } from 'react';

type Guild = { id: string; name: string; icon: string | null; banner: string | null; memberCount?: number };
type State = 'loading' | 'guest' | 'allowed' | 'denied' | 'error';

export function GuildUnderConstruction({ guildId }: { guildId: string }) {
  const [state, setState] = useState<State>('loading');
  const [guild, setGuild] = useState<Guild | null>(null);

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
    return <div className="panel-empty guild-access-state"><span className="panel-empty-icon"><KaelEnter /></span><p className="panel-state-label">SESSÃO EXPIRADA</p><h2>Entre com o Discord novamente</h2><p>Precisamos confirmar sua identidade e suas permissões antes de abrir esta comunidade.</p><a className="panel-primary-link" href="/api/auth/discord">Entrar com Discord <KaelEnter /></a></div>;
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
    <div className="guild-construction">
      <div className="guild-construction-banner" aria-hidden="true">
        {guild?.banner ? <img src={guild.banner} alt="" draggable={false} /> : guild?.icon ? <img className="server-banner-icon-bg" src={guild.icon} alt="" draggable={false} /> : null}
      </div>
      <div className="guild-construction-content">
        <span className="construction-icon"><KaelConstruct /></span>
        <p className="panel-kicker">PAINEL DO SERVIDOR</p>
        <h1>{guild?.name ?? 'Sua comunidade'}</h1>
        <h2>Estamos criando essa aba.</h2>
        <p>Não se preocupe, será rápido. Suas permissões já foram confirmadas com segurança.</p>
        <Link className="panel-secondary-link" href="/servidores"><KaelArrowLeft /> Voltar aos servidores</Link>
      </div>
    </div>
  );
}
