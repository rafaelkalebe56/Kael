'use client';

import { ArrowRight, Bot, LogIn, Server, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

type Guild = { id: string; name: string; icon: string | null; banner: string | null };
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
        <span className="panel-empty-icon"><LogIn aria-hidden="true" /></span>
        <h2>Entre para acessar seus servidores</h2>
        <p>Usamos o login oficial do Discord para mostrar somente os servidores que você pode gerenciar.</p>
        <a className="panel-primary-link" href="/api/auth/discord">Entrar com Discord <LogIn aria-hidden="true" /></a>
      </div>
    );
  }

  if (state === 'error') {
    return <div className="panel-empty"><h2>Não foi possível carregar seus servidores.</h2><p>Tente entrar novamente em alguns instantes.</p></div>;
  }

  if (state === 'bot_unavailable') {
    return <div className="panel-empty"><span className="panel-empty-icon"><Bot aria-hidden="true" /></span><h2>O Kael ainda está se conectando.</h2><p>Em alguns instantes ele vai informar ao painel quais servidores já fazem parte da sua comunidade.</p></div>;
  }

  if (guilds.length === 0) {
    return (
      <div className="panel-empty">
        <span className="panel-empty-icon"><Server aria-hidden="true" /></span>
        <h2>Nenhum servidor para mostrar</h2>
        <p>Quando você tiver permissão para gerenciar um servidor, ele aparecerá aqui.</p>
      </div>
    );
  }

  return (
    <div className="server-grid" aria-label="Seus servidores com Kael">
      {guilds.map((guild) => (
        <a className="server-card" key={guild.id} href={`/servidores/${guild.id}`}>
          <span className="server-banner" aria-hidden="true">
            {guild.banner ? <img src={guild.banner} alt="" draggable={false} /> : <span className="server-banner-fallback"><Sparkles /></span>}
          </span>
          <span className="server-card-body">
            <span className="server-icon" aria-hidden="true">
              {guild.icon ? <img src={guild.icon} alt="" draggable={false} /> : guild.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="server-card-copy"><span className="server-name">{guild.name}</span><span className="server-status"><Bot aria-hidden="true" /> Kael está aqui</span></span>
            <span className="server-manage">Gerenciar <ArrowRight aria-hidden="true" /></span>
          </span>
        </a>
      ))}
    </div>
  );
}
