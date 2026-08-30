'use client';

import { ArrowLeft, Construction, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';

type State = 'loading' | 'guest' | 'allowed' | 'denied';

export function GuildUnderConstruction({ guildId }: { guildId: string }) {
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    fetch('/api/discord/guilds', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) return setState('guest');
        if (!response.ok) return setState('denied');
        const data = await response.json() as { guilds: Array<{ id: string }> };
        setState(data.guilds.some((guild) => guild.id === guildId) ? 'allowed' : 'denied');
      })
      .catch(() => setState('denied'));
  }, [guildId]);

  if (state === 'loading') return <div className="panel-state">Verificando acesso ao servidor...</div>;
  if (state === 'guest') {
    return <div className="panel-empty"><span className="panel-empty-icon"><LogIn aria-hidden="true" /></span><h2>Entre com o Discord primeiro</h2><p>Precisamos confirmar se você pode gerenciar esse servidor.</p><a className="panel-primary-link" href="/api/auth/discord">Entrar com Discord</a></div>;
  }
  if (state === 'denied') {
    return <div className="panel-empty"><h2>Você não tem acesso a esse servidor.</h2><p>Escolha um servidor que você possa gerenciar.</p><a className="panel-secondary-link" href="/servidores"><ArrowLeft aria-hidden="true" /> Voltar aos servidores</a></div>;
  }

  return (
    <div className="construction-card">
      <span className="construction-icon"><Construction aria-hidden="true" /></span>
      <p className="panel-kicker">PAINEL DO SERVIDOR</p>
      <h2>Estamos criando essa aba.</h2>
      <p>Não se preocupe, será rápido.</p>
      <a className="panel-secondary-link" href="/servidores"><ArrowLeft aria-hidden="true" /> Voltar aos servidores</a>
    </div>
  );
}
