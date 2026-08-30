import { ServersDashboard } from '@/components/servers-dashboard';
import { CircleHelp, LayoutGrid, LogOut, Settings2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ServersPage() {
  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <a className="brand dashboard-brand" href="/inicio" aria-label="Kael - início"><img src="/kael-avatar.png" alt="" /><span>Kael</span></a>
        <nav className="dashboard-menu" aria-label="Menu do painel">
          <a className="dashboard-menu-item active" href="/servidores"><LayoutGrid aria-hidden="true" /> Meus servidores</a>
          <a className="dashboard-menu-item" href="/inicio#sobre"><CircleHelp aria-hidden="true" /> Sobre o Kael</a>
        </nav>
        <a className="dashboard-account" href="/api/auth/logout"><span><Settings2 aria-hidden="true" /></span><small>Sessão Discord</small><LogOut aria-label="Sair" /></a>
      </aside>
      <section className="dashboard-main" aria-labelledby="servers-title">
        <header className="dashboard-top"><p>PAINEL K A E L</p><a className="panel-logout" href="/api/auth/logout"><LogOut aria-hidden="true" /> Sair</a></header>
        <div className="dashboard-welcome"><p className="panel-kicker">SUAS COMUNIDADES</p><h1 id="servers-title">Escolha um servidor<br /><span>para começar.</span></h1><p>Somente comunidades em que você pode gerenciar e o Kael já está presente aparecem aqui.</p></div>
        <ServersDashboard />
      </section>
    </main>
  );
}
