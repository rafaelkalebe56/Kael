import { getDiscordProfile } from '@/lib/discord-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const profile = await getDiscordProfile(request);
  if (!profile) {
    return Response.json({ error: 'unauthenticated' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
  return Response.json({ profile }, { headers: { 'Cache-Control': 'no-store' } });
}
