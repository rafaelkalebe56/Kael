import { DashboardShell } from '@/components/dashboard-shell';
import { WelcomeSettings } from '@/components/welcome-settings';

export const dynamic = 'force-dynamic';

export default async function WelcomePage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  return (
    <DashboardShell active="servers">
      <section className="dashboard-content guild-access-page welcome-access-page" aria-label="Boas-vindas do servidor">
        <WelcomeSettings guildId={guildId} />
      </section>
    </DashboardShell>
  );
}
