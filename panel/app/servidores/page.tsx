import { ServersDashboard } from '@/components/servers-dashboard';
import { DashboardShell } from '@/components/dashboard-shell';

export const dynamic = 'force-dynamic';

export default function ServersPage() {
  return (
    <DashboardShell active="servers">
      <section className="dashboard-content" aria-labelledby="servers-title">
        <div className="dashboard-welcome"><p className="panel-kicker">MEUS SERVIDORES</p><h1 id="servers-title">Escolha uma comunidade para gerenciar</h1><p>Somente servidores em que você pode gerenciar e o Kael está presente aparecem aqui.</p></div>
        <ServersDashboard />
      </section>
    </DashboardShell>
  );
}
