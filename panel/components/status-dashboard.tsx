'use client';

import { KaelBot, KaelMembers, KaelPulse, KaelRefresh, KaelServer } from '@/components/kael-icons';
import { useCallback, useEffect, useState } from 'react';

type ServiceStatus = {
  state: 'online' | 'starting' | 'offline';
  version: string | null;
  guildCount: number | null;
  memberCount: number | null;
  latencyMs: number | null;
};

const offlineStatus: ServiceStatus = { state: 'offline', version: null, guildCount: null, memberCount: null, latencyMs: null };

export function StatusDashboard() {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const loadStatus = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const response = await fetch('/api/kael/status', { cache: 'no-store' });
      if (!response.ok) throw new Error('status');
      setStatus(await response.json() as ServiceStatus);
    } catch {
      setStatus(offlineStatus);
    } finally {
      setCheckedAt(new Date());
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadStatus(), 0);
    const interval = window.setInterval(() => void loadStatus(), 30_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadStatus]);

  const state = status?.state ?? 'starting';
  const stateLabel = state === 'online' ? 'Tudo funcionando' : state === 'starting' ? 'Kael iniciando' : 'Serviço indisponível';
  const stateDescription = state === 'online'
    ? 'O bot está conectado ao Discord e respondendo normalmente.'
    : state === 'starting'
      ? 'O Kael está terminando de se conectar. Isso costuma levar poucos instantes.'
      : 'Não foi possível alcançar o Kael agora. Tente novamente em alguns instantes.';
  const metric = (value: number | null | undefined) => value === null || value === undefined ? '—' : value.toLocaleString('pt-BR');

  return (
    <div className="status-surface">
      <section className={`status-summary is-${state}`}>
        <span className="status-summary-icon"><KaelPulse /></span>
        <div><p>STATUS ATUAL</p><h2>{stateLabel}</h2><span>{stateDescription}</span></div>
        <i aria-hidden="true" />
      </section>

      <div className="status-metrics">
        <article><KaelBot /><span><small>Bot do Discord</small><strong>{state === 'online' ? 'Online' : state === 'starting' ? 'Iniciando' : 'Offline'}</strong></span></article>
        <article><KaelPulse /><span><small>Latência</small><strong>{status?.latencyMs === null || status?.latencyMs === undefined ? '—' : `${status.latencyMs} ms`}</strong></span></article>
        <article><KaelServer /><span><small>Servidores</small><strong>{metric(status?.guildCount)}</strong></span></article>
        <article><KaelMembers /><span><small>Membros alcançados</small><strong>{metric(status?.memberCount)}</strong></span></article>
      </div>

      <footer className="status-footer">
        <span>{status?.version ? `Kael ${status.version}` : 'Versão indisponível'}{checkedAt ? ` · verificado às ${checkedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}</span>
        <button type="button" onClick={() => void loadStatus(true)} disabled={refreshing}><KaelRefresh className={refreshing ? 'is-spinning' : ''} />{refreshing ? 'Verificando...' : 'Verificar agora'}</button>
      </footer>
    </div>
  );
}
