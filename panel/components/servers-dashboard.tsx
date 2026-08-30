'use client';

import { LogIn, Server, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type Guild = { id: string; name: string; icon: string | null };
type State = 'loading' | 'guest' | 'ready' | 'error';

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
    <div className="guild-grid" aria-label="Seus servidores">
      {guilds.map((guild) => (
        <a className="guild-card" key={guild.id} href={`/servidores/${guild.id}`}>
          <span className="guild-avatar" aria-hidden="true">{guild.name.slice(0, 1).toUpperCase()}</span>
          <span className="guild-name">{guild.name}</span>
          <Settings2 aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
