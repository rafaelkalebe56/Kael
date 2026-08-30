import { dashboardGuilds, resolveDiscordSession } from '@/lib/discord-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const resolution = await resolveDiscordSession(request);
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  if (resolution.setCookie) headers.append('Set-Cookie', resolution.setCookie);

  if (!resolution.session) {
    return Response.json({ error: 'unauthenticated' }, { status: 401, headers });
  }

  const guilds = await dashboardGuilds(resolution.session);
  if (guilds === null) {
    return Response.json({ error: 'unauthenticated' }, { status: 401, headers });
  }
  if (guilds === undefined) {
    return Response.json({ error: 'bot_unavailable' }, { status: 503, headers });
  }
  return Response.json({ guilds }, { headers });
}
