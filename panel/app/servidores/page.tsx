import { ServersDashboard } from '@/components/servers-dashboard';
import { LogOut } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ServersPage() {
  return (
    <main className="panel-page">
      <header className="panel-nav">
        <a className="brand" href="/inicio" aria-label="Kael - início"><img src="/kael-avatar.png" alt="" /><span>Kael</span></a>
        <a className="panel-logout" href="/api/auth/logout"><LogOut aria-hidden="true" /> Sair</a>
      </header>
      <section className="panel-content" aria-labelledby="servers-title">
        <p className="panel-kicker">PAINEL K A E L</p>
        <h1 id="servers-title">Seus servidores</h1>
        <p className="panel-intro">Escolha uma comunidade para gerenciar com o Kael.</p>
        <ServersDashboard />
      </section>
    </main>
  );
}
