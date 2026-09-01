import { dashboardGuilds, getDiscordProfileForSession, kaelDashboardRequest, resolveDiscordSession } from '@/lib/discord-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const resolution = await resolveDiscordSession(request);
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  if (resolution.setCookie) headers.append('Set-Cookie', resolution.setCookie);
  if (!resolution.session) return Response.json({ error: 'unauthenticated' }, { status: 401, headers });

  const guilds = await dashboardGuilds(resolution.session);
  if (guilds === null) return Response.json({ error: 'unauthenticated' }, { status: 401, headers });
  if (guilds === undefined) return Response.json({ error: 'bot_unavailable' }, { status: 503, headers });
  if (!guilds.some((guild) => guild.id === guildId)) return Response.json({ error: 'forbidden' }, { status: 403, headers });

  const profile = await getDiscordProfileForSession(resolution.session);
  if (!profile?.id) return Response.json({ error: 'profile_unavailable' }, { status: 401, headers });

  const body = await request.json().catch(() => null) as { config?: unknown; target?: unknown } | null;
  if (!body || (body.target !== 'channel' && body.target !== 'self')) {
    return Response.json({ error: 'invalid_request' }, { status: 400, headers });
  }

  const response = await kaelDashboardRequest(`/internal/guilds/${guildId}/welcome/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: body.config, target: body.target, userId: profile.id }),
  });
  if (!response) return Response.json({ error: 'bot_unavailable' }, { status: 503, headers });
  const responseBody = await response.text();
  headers.set('Content-Type', response.headers.get('Content-Type') || 'application/json; charset=utf-8');
  return new Response(responseBody, { status: response.status, headers });
}
