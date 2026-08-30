import { managedGuilds } from '@/lib/discord-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const guilds = await managedGuilds(request);
  if (!guilds) {
    return Response.json({ error: 'unauthenticated' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
  return Response.json({ guilds }, { headers: { 'Cache-Control': 'no-store' } });
}
