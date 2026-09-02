import { dashboardGuilds, kaelDashboardRequest, resolveDiscordSession } from '@/lib/discord-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const resolution = await resolveDiscordSession(request);
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  if (resolution.setCookie) headers.append('Set-Cookie', resolution.setCookie);
  if (!resolution.session) return Response.json({ error: 'unauthenticated' }, { status: 401, headers });

  const guilds = await dashboardGuilds(resolution.session);
  if (guilds === null) return Response.json({ error: 'unauthenticated' }, { status: 401, headers });
  if (guilds === undefined) return Response.json({ error: 'bot_unavailable' }, { status: 503, headers });
  if (!guilds.some((guild) => guild.id === guildId)) {
    return Response.json({ error: 'forbidden' }, { status: 403, headers });
  }

  const incomingUrl = new URL(request.url);
  const kind = incomingUrl.searchParams.get('kind');
  const query = incomingUrl.searchParams.get('q') ?? '';
  if (kind !== 'at' && kind !== 'channel') {
    return Response.json({ error: 'invalid_kind' }, { status: 400, headers });
  }

  const parameters = new URLSearchParams({ kind, q: query.slice(0, 32) });
  const response = await kaelDashboardRequest(`/internal/guilds/${guildId}/welcome/mentions?${parameters}`);
  if (!response) return Response.json({ error: 'bot_unavailable' }, { status: 503, headers });
  const body = await response.text();
  headers.set('Content-Type', response.headers.get('Content-Type') || 'application/json; charset=utf-8');
  return new Response(body, { status: response.status, headers });
}
