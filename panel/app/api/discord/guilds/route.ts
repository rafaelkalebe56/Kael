import { dashboardGuilds } from '@/lib/discord-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const guilds = await dashboardGuilds(request);
  if (guilds === null) {
    return Response.json({ error: 'unauthenticated' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
  if (guilds === undefined) {
    return Response.json({ error: 'bot_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  return Response.json({ guilds }, { headers: { 'Cache-Control': 'no-store' } });
}
