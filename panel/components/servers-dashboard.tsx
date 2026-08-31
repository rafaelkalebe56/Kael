'use client';

import { KaelAdd, KaelArrowRight, KaelBot, KaelEnter, KaelMembers, KaelRefresh, KaelSearch, KaelServer, KaelSpark } from '@/components/kael-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Guild = { id: string; name: string; icon: string | null; banner: string | null; memberCount?: number };
type State = 'loading' | 'guest' | 'ready' | 'bot_unavailable' | 'error';

export function ServersDashboard() {
  const [state, setState] = useState<State>('loading');
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadGuilds = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setState('loading');

    try {
      const response = await fetch('/api/discord/guilds', { cache: 'no-store' });
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
    } catch {
      setState('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadGuilds(); }, [loadGuilds]);

  const filteredGuilds = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalizedQuery) return guilds;
    return guilds.filter((guild) => guild.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery));
  }, [guilds, query]);

  if (state === 'loading') {
    return (
      <div className="server-loading" aria-live="polite" aria-label="Carregando seus servidores">
        <span className="server-loading-line" />
        <div className="server-loading-grid"><span /><span /><span /><span /></div>
      </div>
    );
  }

  if (state === 'guest') {
    return (
      <div className="panel-empty">
        <span className="panel-empty-icon"><KaelEnter /></span>
        <p className="panel-state-label">SESSÃO DO DISCORD</p>
        <h2>Entre para acessar seus servidores</h2>
        <p>Sua sessão não está ativa. Entre novamente para confirmarmos com segurança quais comunidades você pode gerenciar.</p>
        <a className="panel-primary-link" href="/api/auth/discord">Entrar com Discord <KaelEnter /></a>
      </div>
    );
  }

  if (state === 'error') {
    return <div className="panel-empty"><span className="panel-empty-icon"><KaelRefresh /></span><p className="panel-state-label">FALHA NA CONEXÃO</p><h2>Não foi possível carregar seus servidores.</h2><p>O painel encontrou uma dificuldade temporária. Seus dados continuam seguros.</p><button className="panel-secondary-link" type="button" onClick={() => void loadGuilds()}>Tentar novamente <KaelRefresh /></button></div>;
  }

  if (state === 'bot_unavailable') {
    return <div className="panel-empty"><span className="panel-empty-icon"><KaelBot /></span><p className="panel-state-label">SINCRONIZAÇÃO</p><h2>O Kael ainda está se conectando.</h2><p>Assim que a conexão for concluída, seus servidores aparecerão automaticamente.</p><button className="panel-secondary-link" type="button" onClick={() => void loadGuilds()}>Atualizar agora <KaelRefresh /></button></div>;
  }

  if (guilds.length === 0) {
    return (
      <div className="panel-empty">
        <span className="panel-empty-icon"><KaelServer /></span>
        <p className="panel-state-label">NENHUMA COMUNIDADE</p>
        <h2>Nenhum servidor com Kael por aqui</h2>
        <p>O Kael só aparece quando ele está instalado e você tem permissão para gerenciar a comunidade.</p>
        <a className="panel-primary-link" href="/api/discord/invite">Adicionar o Kael <KaelAdd /></a>
      </div>
    );
  }

  return (
    <section className="servers-surface" aria-label="Seus servidores com Kael">
      <div className="servers-toolbar">
        {guilds.length > 5 ? <label className="servers-search"><KaelSearch /><span className="sr-only">Buscar servidor</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar servidor" /></label> : <span />}
        <button className="servers-refresh" type="button" onClick={() => void loadGuilds(true)} disabled={refreshing} aria-label="Atualizar servidores"><KaelRefresh className={refreshing ? 'is-spinning' : ''} /><span>{refreshing ? 'Atualizando' : 'Atualizar'}</span></button>
      </div>

      {filteredGuilds.length === 0 ? (
        <div className="servers-no-results"><KaelSearch /><strong>Nenhum servidor encontrado</strong><span>Tente buscar usando outro nome.</span></div>
      ) : (
        <div className="server-grid">
          {filteredGuilds.map((guild) => (
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

          <a className="server-add-card" href="/api/discord/invite">
            <span className="server-add-icon"><KaelAdd /></span>
            <span><strong>Adicionar o Kael a outro servidor</strong><small>Convide o Kael para uma nova comunidade.</small></span>
            <KaelArrowRight />
          </a>
        </div>
      )}
      <span className="servers-result-count" aria-live="polite">{filteredGuilds.length} {filteredGuilds.length === 1 ? 'servidor disponível' : 'servidores disponíveis'}</span>
    </section>
  );
}
