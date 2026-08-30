const DISCORD_API = 'https://discord.com/api/v10';
const SESSION_COOKIE = 'kael_discord_session';
const STATE_COOKIE = 'kael_oauth_state';
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const TOKEN_RENEWAL_WINDOW_MS = 5 * 60 * 1000;

export type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  banner: string | null;
};

type DiscordSession = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  profile: DiscordProfile | null;
};

export type DiscordSessionResolution = {
  session: DiscordSession | null;
  setCookie: string | null;
};

export type DiscordProfile = {
  displayName: string;
  avatarUrl: string | null;
};

type DiscordPublicConfiguration = {
  clientId: string;
  publicUrl: URL;
};

type DiscordOAuthConfiguration = DiscordPublicConfiguration & {
  clientSecret: string;
  sessionSecret: string;
};

type BotConfiguration = {
  baseUrl: URL;
  apiKey: string;
};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function getPublicConfiguration(): DiscordPublicConfiguration | null {
  const clientId = process.env.DISCORD_CLIENT_ID?.trim();
  const rawPublicUrl = process.env.PUBLIC_URL?.trim();

  if (!clientId || !rawPublicUrl) return null;

  try {
    const publicUrl = new URL(trimTrailingSlash(rawPublicUrl));
    const isLocalhost = publicUrl.hostname === 'localhost' || publicUrl.hostname === '127.0.0.1';
    if (publicUrl.protocol !== 'https:' && !isLocalhost) return null;
    return { clientId, publicUrl };
  } catch {
    return null;
  }
}

function getOAuthConfiguration(): DiscordOAuthConfiguration | null {
  const publicConfiguration = getPublicConfiguration();
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim();
  const sessionSecret = process.env.SESSION_SECRET?.trim();

  if (!publicConfiguration || !clientSecret || !sessionSecret || sessionSecret.length < 32) {
    return null;
  }

  return { ...publicConfiguration, clientSecret, sessionSecret };
}

function getBotConfiguration(): BotConfiguration | null {
  const rawBaseUrl = process.env.BOT_API_URL?.trim();
  const apiKey = process.env.BOT_API_KEY?.trim();
  if (!rawBaseUrl || !apiKey) return null;

  try {
    const baseUrl = new URL(trimTrailingSlash(rawBaseUrl));
    if (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') return null;
    return { baseUrl, apiKey };
  } catch {
    return null;
  }
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function secureRandomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const prefix = `${name}=`;
  for (const item of cookieHeader.split(';')) {
    const trimmed = item.trim();
    if (trimmed.startsWith(prefix)) return decodeURIComponent(trimmed.slice(prefix.length));
  }
  return null;
}

function cookie(name: string, value: string, maxAge: number, secure: boolean) {
  return [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    `Max-Age=${maxAge}`,
  ].filter(Boolean).join('; ');
}

function isSecureCookie(publicUrl: URL) {
  return publicUrl.protocol === 'https:';
}

async function sessionKey(secret: string) {
  const bytes = new TextEncoder().encode(secret);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptSession(session: DiscordSession, secret: string) {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const plaintext = new TextEncoder().encode(JSON.stringify(session));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await sessionKey(secret), plaintext);
  return `v1.${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(encrypted))}`;
}

async function decryptSession(value: string, secret: string): Promise<DiscordSession | null> {
  const [version, ivEncoded, ciphertextEncoded] = value.split('.');
  if (version !== 'v1' || !ivEncoded || !ciphertextEncoded) return null;

  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64UrlDecode(ivEncoded) },
      await sessionKey(secret),
      base64UrlDecode(ciphertextEncoded),
    );
    const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as DiscordSession;
    if (typeof parsed.accessToken !== 'string' || typeof parsed.expiresAt !== 'number') {
      return null;
    }
    return {
      accessToken: parsed.accessToken,
      // Sessões emitidas antes da renovação automática continuam válidas até
      // vencerem. Depois disso a pessoa só precisa entrar novamente uma vez.
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : null,
      expiresAt: parsed.expiresAt,
      profile: parsed.profile && typeof parsed.profile.displayName === 'string'
        ? { displayName: parsed.profile.displayName, avatarUrl: typeof parsed.profile.avatarUrl === 'string' ? parsed.profile.avatarUrl : null }
        : null,
    };
  } catch {
    return null;
  }
}

type DiscordTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

async function exchangeDiscordToken(form: URLSearchParams): Promise<DiscordTokenResponse & { ok: boolean; status: number }> {
  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const token = await response.json() as DiscordTokenResponse;
  return { ...token, ok: response.ok, status: response.status };
}

async function sessionCookie(session: DiscordSession, configuration: DiscordOAuthConfiguration) {
  const encrypted = await encryptSession(session, configuration.sessionSecret);
  return cookie(SESSION_COOKIE, encrypted, SESSION_MAX_AGE_SECONDS, isSecureCookie(configuration.publicUrl));
}

async function fetchDiscordProfile(accessToken: string): Promise<DiscordProfile | null> {
  try {
    const response = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    const user = await response.json() as { id?: string; username?: string; global_name?: string | null; avatar?: string | null };
    if (!user.id || !user.username) return null;
    return {
      displayName: user.global_name || user.username,
      avatarUrl: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128` : null,
    };
  } catch {
    return null;
  }
}

function callbackUrl(configuration: DiscordPublicConfiguration) {
  return new URL('/api/auth/discord/callback', configuration.publicUrl).toString();
}

function redirectWithCookies(location: URL | string, cookies: string[]) {
  // Responses criadas com Response.redirect() podem ter os headers imutáveis
  // no runtime Workers. Criamos a resposta manualmente para anexar o cookie
  // HttpOnly da sessão antes de devolvê-la ao navegador.
  const headers = new Headers({
    Location: location.toString(),
    'Cache-Control': 'no-store',
  });
  for (const setCookie of cookies) headers.append('Set-Cookie', setCookie);
  return new Response(null, { status: 302, headers });
}

export function beginDiscordLogin(request: Request) {
  const configuration = getOAuthConfiguration();
  if (!configuration) {
    return Response.redirect(new URL('/inicio?erro=integracao', request.url), 302);
  }

  const state = secureRandomToken();
  const authorization = new URL('https://discord.com/oauth2/authorize');
  authorization.searchParams.set('client_id', configuration.clientId);
  authorization.searchParams.set('redirect_uri', callbackUrl(configuration));
  authorization.searchParams.set('response_type', 'code');
  authorization.searchParams.set('scope', 'identify guilds');
  authorization.searchParams.set('state', state);

  return redirectWithCookies(authorization, [
    cookie(STATE_COOKIE, state, 10 * 60, isSecureCookie(configuration.publicUrl)),
  ]);
}

export async function finishDiscordLogin(request: Request) {
  const configuration = getOAuthConfiguration();
  if (!configuration) return Response.redirect(new URL('/inicio?erro=integracao', request.url), 302);

  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const expectedState = readCookie(request.headers.get('Cookie'), STATE_COOKIE);
  const clearState = cookie(STATE_COOKIE, '', 0, isSecureCookie(configuration.publicUrl));
  const restart = new URL('/inicio?erro=login', configuration.publicUrl);

  if (!state || !expectedState || state !== expectedState || url.searchParams.get('error')) {
    console.warn('Discord OAuth callback recusado', {
      hasCode: Boolean(url.searchParams.get('code')),
      hasState: Boolean(state),
      hasStateCookie: Boolean(expectedState),
      stateMatches: Boolean(state && expectedState && state === expectedState),
      discordError: url.searchParams.get('error'),
    });
    return redirectWithCookies(restart, [clearState]);
  }

  const form = new URLSearchParams({
    client_id: configuration.clientId,
    client_secret: configuration.clientSecret,
    grant_type: 'authorization_code',
    code: url.searchParams.get('code') ?? '',
    redirect_uri: callbackUrl(configuration),
  });

  try {
    const token = await exchangeDiscordToken(form);
    if (!token.ok || !token.access_token || !token.expires_in) {
      console.error('Discord recusou a troca do código de login', {
        status: token.status,
        error: token.error,
        description: token.error_description,
      });
      throw new Error('Discord OAuth token failed');
    }

    const encryptedSession = await encryptSession({
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? null,
      expiresAt: Date.now() + token.expires_in * 1000,
      profile: await fetchDiscordProfile(token.access_token),
    }, configuration.sessionSecret);

    return redirectWithCookies(new URL('/servidores', configuration.publicUrl), [
      clearState,
      cookie(SESSION_COOKIE, encryptedSession, SESSION_MAX_AGE_SECONDS, isSecureCookie(configuration.publicUrl)),
    ]);
  } catch (error) {
    console.error('Falha ao finalizar login Discord', {
      message: error instanceof Error ? error.message : 'erro desconhecido',
    });
    return redirectWithCookies(restart, [clearState]);
  }
}

export function beginBotInvite(request: Request) {
  const configuration = getPublicConfiguration();
  if (!configuration) return Response.redirect(new URL('/inicio?erro=integracao', request.url), 302);

  const invite = new URL('https://discord.com/oauth2/authorize');
  invite.searchParams.set('client_id', configuration.clientId);
  invite.searchParams.set('scope', 'bot applications.commands');
  invite.searchParams.set('permissions', '0');
  return Response.redirect(invite, 302);
}

export async function resolveDiscordSession(request: Request): Promise<DiscordSessionResolution> {
  const configuration = getOAuthConfiguration();
  const encryptedSession = readCookie(request.headers.get('Cookie'), SESSION_COOKIE);
  if (!configuration || !encryptedSession) return { session: null, setCookie: null };

  const session = await decryptSession(encryptedSession, configuration.sessionSecret);
  if (!session) {
    return { session: null, setCookie: cookie(SESSION_COOKIE, '', 0, isSecureCookie(configuration.publicUrl)) };
  }

  if (session.expiresAt > Date.now() + TOKEN_RENEWAL_WINDOW_MS) {
    return { session, setCookie: null };
  }

  if (!session.refreshToken) {
    return { session: null, setCookie: cookie(SESSION_COOKIE, '', 0, isSecureCookie(configuration.publicUrl)) };
  }

  try {
    const token = await exchangeDiscordToken(new URLSearchParams({
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
    }));
    if (!token.ok || !token.access_token || !token.expires_in) {
      console.warn('Discord recusou a renovação da sessão.', { status: token.status, error: token.error });
      return { session: null, setCookie: cookie(SESSION_COOKIE, '', 0, isSecureCookie(configuration.publicUrl)) };
    }

    const renewedSession: DiscordSession = {
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? session.refreshToken,
      expiresAt: Date.now() + token.expires_in * 1000,
      profile: session.profile,
    };
    console.info('PainelKael: sessão Discord renovada.');
    return { session: renewedSession, setCookie: await sessionCookie(renewedSession, configuration) };
  } catch (error) {
    console.error('Falha ao renovar a sessão Discord.', {
      message: error instanceof Error ? error.message : 'erro desconhecido',
    });
    return { session: null, setCookie: cookie(SESSION_COOKIE, '', 0, isSecureCookie(configuration.publicUrl)) };
  }
}

export async function getDiscordSession(request: Request) {
  return (await resolveDiscordSession(request)).session;
}

export async function getDiscordProfile(request: Request) {
  const session = await getDiscordSession(request);
  if (!session) return null;
  return session.profile ?? fetchDiscordProfile(session.accessToken);
}

export async function managedGuilds(session: DiscordSession): Promise<DiscordGuild[] | null> {
  const response = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  if (!response.ok) return null;

  const guilds = await response.json() as Array<{ id: string; name: string; icon: string | null; owner?: boolean; permissions?: string; permissions_new?: string }>;
  const manageGuild = BigInt(32);
  return guilds
    .filter((guild) => {
      if (guild.owner) return true;
      try {
        return Boolean(BigInt(guild.permissions ?? guild.permissions_new ?? '0') & manageGuild);
      } catch {
        return false;
      }
    })
    .map(({ id, name, icon }) => ({ id, name, icon, banner: null }));
}

async function kaelGuilds(): Promise<DiscordGuild[] | null> {
  const configuration = getBotConfiguration();
  if (!configuration) {
    console.error('PainelKael: BOT_API_URL ou BOT_API_KEY não foi configurada.');
    return null;
  }

  try {
    const response = await fetch(new URL('/internal/guilds', configuration.baseUrl), {
      headers: { Authorization: `Bearer ${configuration.apiKey}` },
      // Workers/edge não implementa `redirect: 'error'`. `manual` mantém a
      // chamada sem seguir redirecionamentos; qualquer 3xx é recusado abaixo.
      redirect: 'manual',
    });
    if (!response.ok) {
      console.error('PainelKael: API privada do Kael recusou a consulta.', { status: response.status });
      return null;
    }
    const payload = await response.json() as { guilds?: unknown };
    if (!Array.isArray(payload.guilds)) return null;

    const guilds = payload.guilds.flatMap((guild) => {
      if (!guild || typeof guild !== 'object') return [];
      const value = guild as Record<string, unknown>;
      if (typeof value.id !== 'string' || typeof value.name !== 'string') return [];
      return [{
        id: value.id,
        name: value.name,
        icon: typeof value.icon === 'string' ? value.icon : null,
        banner: typeof value.banner === 'string' ? value.banner : null,
      }];
    });
    console.info('PainelKael: servidores recebidos do Kael.', { count: guilds.length });
    return guilds;
  } catch (error) {
    console.error('PainelKael: não foi possível alcançar a API privada do Kael.', {
      message: error instanceof Error ? error.message : 'erro desconhecido',
    });
    return null;
  }
}

export async function dashboardGuilds(session: DiscordSession): Promise<DiscordGuild[] | undefined | null> {
  const userGuilds = await managedGuilds(session);
  if (!userGuilds) return null;

  const botGuilds = await kaelGuilds();
  if (!botGuilds) return undefined;

  const manageableGuildIds = new Set(userGuilds.map((guild) => guild.id));
  const guilds = botGuilds.filter((guild) => manageableGuildIds.has(guild.id));
  console.info('PainelKael: servidores filtrados.', {
    botGuilds: botGuilds.length,
    manageableGuilds: userGuilds.length,
    shownGuilds: guilds.length,
  });
  return guilds;
}

export function clearDiscordSession(request: Request) {
  const configuration = getPublicConfiguration();
  const destination = new URL('/inicio', request.url);
  if (!configuration) return Response.redirect(destination, 302);
  return redirectWithCookies(destination, [cookie(SESSION_COOKIE, '', 0, isSecureCookie(configuration.publicUrl))]);
}
