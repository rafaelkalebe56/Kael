import { finishDiscordLogin } from '@/lib/discord-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return finishDiscordLogin(request);
}
