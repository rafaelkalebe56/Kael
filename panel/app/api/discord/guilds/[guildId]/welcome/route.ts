import { dashboardGuilds, kaelDashboardRequest, resolveDiscordSession } from '@/lib/discord-auth';

export const dynamic = 'force-dynamic';

async function authorize(request: Request, guildId: string) {
  const resolution = await resolveDiscordSession(request);
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  if (resolution.setCookie) headers.append('Set-Cookie', resolution.setCookie);
  if (!resolution.session) return { response: Response.json({ error: 'unauthenticated' }, { status: 401, headers }) };

  const guilds = await dashboardGuilds(resolution.session);
  if (guilds === null) return { response: Response.json({ error: 'unauthenticated' }, { status: 401, headers }) };
  if (guilds === undefined) return { response: Response.json({ error: 'bot_unavailable' }, { status: 503, headers }) };
  const guild = guilds.find((item) => item.id === guildId);
  if (!guild) {
    return { response: Response.json({ error: 'forbidden' }, { status: 403, headers }) };
  }
  return { headers, guild, profile: resolution.session.profile };
}

async function proxyResponse(response: Response | null, headers: Headers) {
  if (!response) return Response.json({ error: 'bot_unavailable' }, { status: 503, headers });
  const body = await response.text();
  headers.set('Content-Type', response.headers.get('Content-Type') || 'application/json; charset=utf-8');
  return new Response(body, { status: response.status, headers });
}

export async function GET(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const authorization = await authorize(request, guildId);
  if (authorization.response) return authorization.response;
  const response = await kaelDashboardRequest(`/internal/guilds/${guildId}/welcome`);
  if (!response) return Response.json({ error: 'bot_unavailable' }, { status: 503, headers: authorization.headers });
  if (!response.ok) return proxyResponse(response, authorization.headers);
  const payload = await response.json() as Record<string, unknown>;
  return Response.json(
    { ...payload, guild: authorization.guild, profile: authorization.profile },
    { headers: authorization.headers },
  );
}

export async function PUT(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const authorization = await authorize(request, guildId);
  if (authorization.response) return authorization.response;
  const body = await request.text();
  if (body.length > 64 * 1024) return Response.json({ error: 'payload_too_large' }, { status: 413, headers: authorization.headers });
  const response = await kaelDashboardRequest(`/internal/guilds/${guildId}/welcome`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  return proxyResponse(response, authorization.headers);
}
