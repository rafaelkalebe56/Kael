'use client';

import { KaelArrowRight, KaelBot, KaelEnter, KaelMembers, KaelServer, KaelSpark } from '@/components/kael-icons';
import { useEffect, useState } from 'react';

type Guild = { id: string; name: string; icon: string | null; banner: string | null; memberCount?: number };
type State = 'loading' | 'guest' | 'ready' | 'bot_unavailable' | 'error';

export function ServersDashboard() {
  const [state, setState] = useState<State>('loading');
  const [guilds, setGuilds] = useState<Guild[]>([]);

  useEffect(() => {
    fetch('/api/discord/guilds', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) {
          setState('guest');
          return;
        }
        if (response.status === 503) {
          setState('bot_unavailable');
          return;
        }
        if (!response.ok) throw new Error('guilds');
        const data = await response.json() as { guilds: Guild[] };
        setGuilds(data.guilds);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  if (state === 'loading') {
    return <div className="panel-state" aria-live="polite">Carregando seus servidores...</div>;
  }

  if (state === 'guest') {
    return (
      <div className="panel-empty">
        <span className="panel-empty-icon"><KaelEnter /></span>
        <h2>Entre para acessar seus servidores</h2>
        <p>Usamos o login oficial do Discord para mostrar somente os servidores que você pode gerenciar.</p>
        <a className="panel-primary-link" href="/api/auth/discord">Entrar com Discord <KaelEnter /></a>
      </div>
    );
  }

  if (state === 'error') {
    return <div className="panel-empty"><h2>Não foi possível carregar seus servidores.</h2><p>Tente entrar novamente em alguns instantes.</p></div>;
  }

  if (state === 'bot_unavailable') {
    return <div className="panel-empty"><span className="panel-empty-icon"><KaelBot /></span><h2>O Kael ainda está se conectando.</h2><p>Em alguns instantes ele vai informar ao painel quais servidores já fazem parte da sua comunidade.</p></div>;
  }

  if (guilds.length === 0) {
    return (
      <div className="panel-empty">
        <span className="panel-empty-icon"><KaelServer /></span>
        <h2>Nenhum servidor com Kael por aqui</h2>
        <p>O Kael só aparece quando ele está instalado e você tem permissão para gerenciar a comunidade.</p>
      </div>
    );
  }

  return (
    <div className="server-grid" aria-label="Seus servidores com Kael">
      {guilds.map((guild) => (
        <a className="server-card" key={guild.id} href={`/servidores/${guild.id}`}>
          <span className="server-banner" aria-hidden="true">
              {guild.banner ? <img src={guild.banner} alt="" draggable={false} /> : guild.icon ? <img className="server-banner-icon-bg" src={guild.icon} alt="" draggable={false} /> : <span className="server-banner-fallback"><KaelSpark /></span>}
          </span>
          <span className="server-card-body">
            <span className="server-icon" aria-hidden="true">
              {guild.icon ? <img src={guild.icon} alt="" draggable={false} /> : guild.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="server-card-copy"><span className="server-name">{guild.name}</span>{typeof guild.memberCount === 'number' && <span className="server-members"><KaelMembers /> {guild.memberCount.toLocaleString('pt-BR')} {guild.memberCount === 1 ? 'membro' : 'membros'}</span>}</span>
            <span className="server-manage">Gerenciar <KaelArrowRight /></span>
          </span>
        </a>
      ))}
    </div>
  );
}
