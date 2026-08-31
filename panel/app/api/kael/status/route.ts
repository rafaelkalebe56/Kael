import { kaelServiceStatus } from '@/lib/discord-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await kaelServiceStatus(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
