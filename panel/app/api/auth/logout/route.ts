import { clearDiscordSession } from '@/lib/discord-auth';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  return clearDiscordSession(request);
}
