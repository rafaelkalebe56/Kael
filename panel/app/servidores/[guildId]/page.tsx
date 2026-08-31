import { GuildUnderConstruction } from '@/components/guild-under-construction';

export const dynamic = 'force-dynamic';

export default async function GuildPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  return (
    <main className="panel-page">
      <header className="panel-nav"><a className="brand" href="/inicio" aria-label="Kael - início"><img src="/kael-avatar.webp" alt="" /><span>Kael</span></a></header>
      <section className="panel-content panel-construction" aria-label="Painel do servidor"><GuildUnderConstruction guildId={guildId} /></section>
    </main>
  );
}
