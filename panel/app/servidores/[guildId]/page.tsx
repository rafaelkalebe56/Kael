import { GuildUnderConstruction } from '@/components/guild-under-construction';
import { DashboardShell } from '@/components/dashboard-shell';

export const dynamic = 'force-dynamic';

export default async function GuildPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  return (
    <DashboardShell active="servers">
      <section className="dashboard-content guild-access-page" aria-label="Painel do servidor"><GuildUnderConstruction guildId={guildId} /></section>
    </DashboardShell>
  );
}
