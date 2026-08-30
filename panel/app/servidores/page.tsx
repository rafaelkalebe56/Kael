import { ServersDashboard } from '@/components/servers-dashboard';
import { DashboardProfile } from '@/components/dashboard-profile';
import { KaelGrid, KaelHelp } from '@/components/kael-icons';

export const dynamic = 'force-dynamic';

export default function ServersPage() {
  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <a className="brand dashboard-brand" href="/inicio" aria-label="Kael - início"><img src="/kael-avatar.png" alt="" /><span>Kael</span></a>
        <nav className="dashboard-menu" aria-label="Menu do painel">
          <a className="dashboard-menu-item active" href="/servidores"><KaelGrid /> Meus servidores</a>
          <a className="dashboard-menu-item" href="/inicio#sobre"><KaelHelp /> Sobre o Kael</a>
        </nav>
      </aside>
      <section className="dashboard-main" aria-labelledby="servers-title">
        <header className="dashboard-top"><p>PAINEL K A E L</p><DashboardProfile /></header>
        <div className="dashboard-welcome"><p className="panel-kicker">SUAS COMUNIDADES</p><h1 id="servers-title">Escolha um servidor<br /><span>para começar.</span></h1><p>Somente comunidades em que você pode gerenciar e o Kael já está presente aparecem aqui.</p></div>
        <ServersDashboard />
      </section>
    </main>
  );
}
