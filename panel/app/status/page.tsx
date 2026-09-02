import { DashboardShell } from '@/components/dashboard-shell';
import { StatusDashboard } from '@/components/status-dashboard';

export const dynamic = 'force-dynamic';

export default function StatusPage() {
  return (
    <DashboardShell active="status">
      <section className="dashboard-content" aria-labelledby="status-title">
        <div className="dashboard-welcome"><p className="panel-kicker">STATUS DO KAEL</p><h1 id="status-title">Tudo certo por aqui?</h1><p>Acompanhe em tempo real a conexão do bot com o Discord e os números da comunidade.</p></div>
        <StatusDashboard />
      </section>
    </DashboardShell>
  );
}
