'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  KaelArrowLeft,
  KaelCheck,
  KaelEnter,
  KaelGrid,
  KaelImage,
  KaelInfo,
  KaelLink,
  KaelMembers,
  KaelMessage,
  KaelRefresh,
  KaelSave,
  KaelSend,
  KaelShield,
  KaelTrash,
  KaelWelcome,
} from '@/components/kael-icons';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

type Guild = { id: string; name: string; icon: string | null; banner: string | null; memberCount?: number };
type Channel = { id: string; name: string };
type Profile = { displayName: string; avatarUrl: string | null };
type Delivery = 'channel' | 'dm' | 'both';
type EditorTab = 'message' | 'appearance' | 'behavior';
type Feedback = { kind: 'success' | 'error'; message: string } | null;
type WelcomeButton = { label: string; url: string; emoji: string };
type ImageField = 'authorIcon' | 'thumbnail' | 'bannerUrl' | 'footerIcon';
type FailedImages = Partial<Record<ImageField, string>>;
type WelcomeConfig = {
  enabled: boolean;
  delivery: Delivery;
  channelId: string | null;
  format: 'embed';
  title: string;
  message: string;
  authorName: string;
  authorUrl: string;
  authorIcon: string;
  thumbnail: string;
  bannerUrl: string;
  accentColor: string;
  footer: string;
  footerIcon: string;
  buttons: WelcomeButton[];
  ignoreBots: boolean;
  delaySeconds: number;
  autoDeleteSeconds: number | null;
  deduplicate: boolean;
  fallbackServerIcon: boolean;
};

const variables = ['{membro}', '{membro.nome}', '{membro.avatar}', '{servidor}', '{membros}', '{canal}', '{data}', '{hora}'];
const initialMessage = 'Olá, {membro}! Que bom ter você no {servidor}.\nAgora somos {membros} membros.';

const defaultConfig: WelcomeConfig = {
  enabled: false,
  delivery: 'channel',
  channelId: null,
  format: 'embed',
  title: 'Bem-vindo ao servidor!',
  message: initialMessage,
  authorName: 'Kael',
  authorUrl: 'https://kael.up.railway.app',
  authorIcon: '',
  thumbnail: '{membro.avatar}',
  bannerUrl: '',
  accentColor: '#4055FF',
  footer: 'Agora somos {membros} membros.',
  footerIcon: '',
  buttons: [],
  ignoreBots: true,
  delaySeconds: 1,
  autoDeleteSeconds: null,
  deduplicate: true,
  fallbackServerIcon: true,
};

function normalizeConfig(value: Partial<WelcomeConfig>): WelcomeConfig {
  return {
    ...defaultConfig,
    ...value,
    buttons: Array.isArray(value.buttons) ? value.buttons.slice(0, 3) : [],
    format: 'embed',
  };
}

function secureWebUrl(value: string) {
  const text = value.trim();
  if (!text) return null;
  try {
    const hasScheme = /^[A-Za-z][A-Za-z0-9+.-]*:/.test(text);
    const url = new URL(hasScheme ? text : `https://${text}`);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function isWebUrl(value: string, allowAvatar = false) {
  return !value.trim() || (allowAvatar && value.trim() === '{membro.avatar}') || Boolean(secureWebUrl(value));
}

function isButtonEmoji(value: string) {
  const emoji = value.trim();
  if (!emoji) return true;
  if (/^<a?:[A-Za-z0-9_]{2,32}:\d{17,20}>$/.test(emoji)) return true;
  if (/[A-Za-z]/.test(emoji)) return false;
  return Array.from(emoji).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return (codePoint >= 0x2300 && codePoint <= 0x23ff)
      || (codePoint >= 0x2600 && codePoint <= 0x27bf)
      || (codePoint >= 0x2b00 && codePoint <= 0x2bff)
      || (codePoint >= 0x1f000 && codePoint <= 0x1faff)
      || codePoint === 0xfe0f
      || codePoint === 0x20e3;
  });
}

function replaceVariables(value: string, guild: Guild, profile: Profile | null, channel: Channel | undefined) {
  const today = new Date();
  const replacements: Record<string, string> = {
    '{membro}': `@${profile?.displayName || 'Novo membro'}`,
    '{membro.nome}': profile?.displayName || 'Novo membro',
    '{membro.avatar}': profile?.avatarUrl || guild.icon || '/kael-avatar.webp',
    '{servidor}': guild.name,
    '{membros}': String((guild.memberCount ?? 2) + 1),
    '{canal}': channel ? `#${channel.name}` : '#boas-vindas',
    '{data}': today.toLocaleDateString('pt-BR'),
    '{hora}': today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
  return variables.reduce((text, variable) => text.replaceAll(variable, replacements[variable]), value);
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <button type="button" className={`welcome-toggle ${checked ? 'is-on' : ''}`} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}><span /></button>;
}

export function WelcomeSettings({ guildId }: { guildId: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'guest' | 'denied' | 'error'>('loading');
  const [guild, setGuild] = useState<Guild | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [config, setConfig] = useState<WelcomeConfig>(defaultConfig);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [tab, setTab] = useState<EditorTab>('message');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTarget, setTestTarget] = useState<'self' | 'channel'>('self');
  const [failedImages, setFailedImages] = useState<FailedImages>({});
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const welcomeResponse = await fetch(`/api/discord/guilds/${guildId}/welcome`, { cache: 'no-store', credentials: 'same-origin' });
      if (!active) return;
      if (welcomeResponse.status === 401) return setState('guest');
      if (welcomeResponse.status === 403) return setState('denied');
      if (!welcomeResponse.ok) return setState('error');

      const welcomeData = await welcomeResponse.json() as { config: Partial<WelcomeConfig>; channels: Channel[]; guild: Guild; profile?: Profile | null };
      const selectedGuild = welcomeData.guild?.id === guildId ? welcomeData.guild : null;
      if (!selectedGuild) return setState('denied');
      const availableChannels = welcomeData.channels ?? [];
      const loaded = normalizeConfig(welcomeData.config);
      if (!loaded.channelId && availableChannels[0]) loaded.channelId = availableChannels[0].id;
      setGuild(selectedGuild);
      setChannels(availableChannels);
      setConfig(loaded);
      setSavedSnapshot(JSON.stringify(loaded));
      if (welcomeData.profile) setProfile(welcomeData.profile);
      setState('ready');
    };
    void load().catch(() => active && setState('error'));
    return () => { active = false; };
  }, [guildId]);

  const selectedChannel = channels.find((channel) => channel.id === config.channelId);
  const validationError = useMemo(() => {
    if (!config.title.trim()) return 'Escreva um título.';
    if (!config.message.trim()) return 'Escreva uma mensagem.';
    if ((config.delivery === 'channel' || config.delivery === 'both') && !selectedChannel) return 'Escolha um canal disponível.';
    const urlFields: Array<[string, string, boolean]> = [
      ['URL do autor', config.authorUrl, false],
      ['foto do autor', config.authorIcon, true],
      ['thumbnail', config.thumbnail, true],
      ['banner', config.bannerUrl, false],
      ['imagem do rodapé', config.footerIcon, true],
    ];
    const invalidUrl = urlFields.find(([, value, allowAvatar]) => !isWebUrl(value, allowAvatar));
    if (invalidUrl) return `A ${invalidUrl[0]} precisa ser um endereço web válido.`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(config.accentColor)) return 'Use uma cor no formato #4055FF.';
    for (const [index, button] of config.buttons.entries()) {
      if (!button.label.trim()) return `Escreva o nome do botão ${index + 1}.`;
      if (!secureWebUrl(button.url)) return `O link do botão ${index + 1} precisa ser um endereço web válido.`;
      if (!isButtonEmoji(button.emoji)) return `O emoji do botão ${index + 1} é inválido. Use um emoji normal ou <:nome:id>.`;
    }
    const failedImage = (Object.entries(failedImages) as Array<[ImageField, string]>).find(([field, url]) => config[field] === url);
    if (failedImage && !config.fallbackServerIcon) return 'Uma imagem não carregou. Corrija a URL ou ative o fallback do servidor.';
    return null;
  }, [config, failedImages, selectedChannel]);

  const fallbackNotice = useMemo(() => {
    if (!config.fallbackServerIcon) return null;
    const hasFailedImage = (Object.entries(failedImages) as Array<[ImageField, string]>).some(([field, url]) => config[field] === url);
    return hasFailedImage ? 'Uma imagem não carregou. O banner ou ícone do servidor será usado no lugar dela.' : null;
  }, [config, failedImages]);

  const dirty = state === 'ready' && JSON.stringify(config) !== savedSnapshot;
  const update = <K extends keyof WelcomeConfig>(key: K, value: WelcomeConfig[K]) => {
    setFeedback(null);
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const markImageFailed = (field: ImageField, url: string) => {
    if (!url) return;
    setFailedImages((current) => ({ ...current, [field]: url }));
  };

  const submissionConfig = () => {
    const normalized: WelcomeConfig = {
      ...config,
      authorUrl: secureWebUrl(config.authorUrl) || '',
      authorIcon: config.authorIcon === '{membro.avatar}' ? config.authorIcon : secureWebUrl(config.authorIcon) || '',
      thumbnail: config.thumbnail === '{membro.avatar}' ? config.thumbnail : secureWebUrl(config.thumbnail) || '',
      bannerUrl: secureWebUrl(config.bannerUrl) || '',
      footerIcon: config.footerIcon === '{membro.avatar}' ? config.footerIcon : secureWebUrl(config.footerIcon) || '',
      buttons: config.buttons.map((button) => ({ ...button, url: secureWebUrl(button.url) || button.url })),
    };
    if (!guild || !config.fallbackServerIcon) return normalized;
    const fallbackFor = (field: ImageField, fallback: string | null) => failedImages[field] === config[field] ? (fallback || '') : normalized[field];
    return { ...normalized, authorIcon: fallbackFor('authorIcon', guild.icon), thumbnail: fallbackFor('thumbnail', guild.icon), bannerUrl: fallbackFor('bannerUrl', guild.banner || guild.icon), footerIcon: fallbackFor('footerIcon', guild.icon) };
  };

  const insertVariable = (variable: string) => {
    const field = messageRef.current;
    const start = field?.selectionStart ?? config.message.length;
    const end = field?.selectionEnd ?? start;
    update('message', `${config.message.slice(0, start)}${variable}${config.message.slice(end)}`.slice(0, 2000));
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(start + variable.length, start + variable.length);
    });
  };

  const save = async () => {
    if (validationError) return setFeedback({ kind: 'error', message: validationError });
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/discord/guilds/${guildId}/welcome`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionConfig()),
      });
      const data = await response.json().catch(() => ({})) as { config?: Partial<WelcomeConfig>; message?: string };
      if (response.status === 401) return setState('guest');
      if (response.status === 403) return setState('denied');
      if (!response.ok || !data.config) throw new Error(data.message || 'Não foi possível salvar agora.');
      const saved = normalizeConfig(data.config);
      setConfig(saved);
      setSavedSnapshot(JSON.stringify(saved));
      setFeedback({ kind: 'success', message: 'Alterações salvas.' });
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof Error ? error.message : 'Não foi possível salvar agora.' });
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (validationError) return setFeedback({ kind: 'error', message: validationError });
    setTesting(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/discord/guilds/${guildId}/welcome/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: submissionConfig(), target: testTarget }),
      });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (response.status === 401) return setState('guest');
      if (response.status === 403) return setState('denied');
      if (!response.ok) throw new Error(data.message || 'O teste não pôde ser enviado.');
      const destination = testTarget === 'self' ? 'Teste enviado para sua DM.' : 'Teste enviado no canal.';
      setFeedback({ kind: 'success', message: fallbackNotice ? `${destination} Uma imagem foi substituída pelo fallback.` : destination });
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof Error ? error.message : 'O teste não pôde ser enviado.' });
    } finally {
      setTesting(false);
    }
  };

  if (state === 'loading') return <div className="guild-access-loading"><span /><p>Carregando as configurações de boas-vindas...</p></div>;
  if (state === 'guest') return <div className="panel-empty guild-access-state"><span className="panel-empty-icon"><KaelEnter /></span><p className="panel-state-label">SESSÃO EXPIRADA</p><h2>Entre com o Discord novamente</h2><p>Precisamos confirmar sua identidade antes de abrir as configurações.</p><button className="panel-primary-link" type="button" onClick={() => location.assign('/api/auth/discord')}>Entrar com Discord <KaelEnter /></button></div>;
  if (state === 'denied') return <div className="panel-empty guild-access-state"><span className="panel-empty-icon"><KaelShield /></span><p className="panel-state-label">ACESSO PROTEGIDO</p><h2>Você não pode configurar este servidor.</h2><p>O Kael confirmou suas permissões novamente e bloqueou esta página.</p><Link className="panel-secondary-link" href="/servidores"><KaelArrowLeft /> Voltar aos servidores</Link></div>;
  if (state === 'error' || !guild) return <div className="panel-empty guild-access-state"><span className="panel-empty-icon"><KaelRefresh /></span><p className="panel-state-label">CONEXÃO INDISPONÍVEL</p><h2>Não foi possível abrir as boas-vindas.</h2><p>Tente novamente em alguns instantes. Nenhuma configuração foi alterada.</p><button className="panel-secondary-link" type="button" onClick={() => location.reload()}>Tentar novamente <KaelRefresh /></button></div>;

  const previewAvatar = profile?.avatarUrl || guild.icon || '/kael-avatar.webp';
  const authorIconFailed = Boolean(config.authorIcon && failedImages.authorIcon === config.authorIcon);
  const thumbnailFailed = Boolean(config.thumbnail && failedImages.thumbnail === config.thumbnail);
  const bannerFailed = Boolean(config.bannerUrl && failedImages.bannerUrl === config.bannerUrl);
  const footerIconFailed = Boolean(config.footerIcon && failedImages.footerIcon === config.footerIcon);
  const previewAuthorIcon = authorIconFailed
    ? (config.fallbackServerIcon ? guild.icon || '/kael-avatar.webp' : '/kael-avatar.webp')
    : config.authorIcon === '{membro.avatar}' ? previewAvatar : (secureWebUrl(config.authorIcon) || '/kael-avatar.webp');
  const previewThumbnail = thumbnailFailed
    ? (config.fallbackServerIcon ? guild.icon : null)
    : config.thumbnail === '{membro.avatar}' ? previewAvatar : (secureWebUrl(config.thumbnail) || (config.fallbackServerIcon ? guild.icon : null));
  const configuredBanner = secureWebUrl(config.bannerUrl) || guild.banner || (config.fallbackServerIcon ? guild.icon : null);
  const previewBanner = bannerFailed ? (config.fallbackServerIcon ? guild.banner || guild.icon : null) : configuredBanner;
  const renderedTitle = replaceVariables(config.title, guild, profile, selectedChannel);
  const renderedMessage = replaceVariables(config.message, guild, profile, selectedChannel);
  const renderedFooter = replaceVariables(config.footer, guild, profile, selectedChannel);
  const previewFooterIcon = footerIconFailed
    ? (config.fallbackServerIcon ? guild.icon : null)
    : config.footerIcon === '{membro.avatar}' ? previewAvatar : secureWebUrl(config.footerIcon);

  return (
    <div className="guild-overview welcome-workspace">
      <aside className="guild-overview-nav" aria-label="Seções do servidor">
        <Link className="guild-overview-back" href="/servidores"><KaelArrowLeft /> Servidores</Link>
        {/* oxlint-disable-next-line next/no-html-link-for-pages -- Full reload preserves the hardened Discord session check. */}
        <a className="guild-overview-nav-item" href={`/servidores/${guildId}`}><KaelGrid /> Visão geral</a>
        <span className="guild-overview-nav-item active"><KaelWelcome /> Boas-vindas</span>
      </aside>

      <div className="welcome-main">
        <section className="welcome-server-hero" aria-label={`Servidor ${guild.name}`}>
          <span className="welcome-server-banner" aria-hidden="true">{guild.banner ? <Image src={guild.banner} alt="" fill unoptimized draggable={false} /> : guild.icon ? <Image className="welcome-server-banner-fallback" src={guild.icon} alt="" fill unoptimized draggable={false} /> : null}</span>
          <span className="welcome-server-icon">{guild.icon ? <Image src={guild.icon} alt="" width={74} height={74} unoptimized draggable={false} /> : guild.name.slice(0, 1)}</span>
          <span className="welcome-server-copy"><strong>{guild.name}</strong><small><span><KaelMembers /> {guild.memberCount ?? 0} membros</span><span className="welcome-online"><i /> Kael conectado</span></small></span>
        </section>

        <header className="welcome-header">
          <span><h1>Boas-vindas</h1><p>Receba novos membros com uma mensagem personalizada.</p></span>
          <div className="welcome-system-toggle">Sistema ativo <Toggle checked={config.enabled} onChange={(value) => update('enabled', value)} label="Ativar boas-vindas" /></div>
        </header>

        <section className="welcome-setup" aria-label="Destino das boas-vindas">
          <fieldset><legend>Envio</legend><div className="welcome-segmented">{(['channel', 'dm', 'both'] as Delivery[]).map((delivery) => <button type="button" className={config.delivery === delivery ? 'active' : ''} key={delivery} onClick={() => update('delivery', delivery)}>{delivery === 'channel' ? 'Canal' : delivery === 'dm' ? 'DM' : 'Ambos'}</button>)}</div></fieldset>
          <label>Canal<select value={config.channelId ?? ''} disabled={config.delivery === 'dm'} onChange={(event) => update('channelId', event.target.value || null)}><option value="">Escolha um canal</option>{channels.map((channel) => <option key={channel.id} value={channel.id}># {channel.name}</option>)}</select><small>O canal precisa permitir o envio de mensagens.</small></label>
          <label>Formato<span className="welcome-format-wrap"><select value="embed" disabled><option>Embed tradicional</option></select><span title="Mensagem em embed tradicional do Discord."><KaelInfo /></span></span></label>
        </section>

        <nav className="welcome-tabs" aria-label="Editor de boas-vindas">{([['message', 'Mensagem'], ['appearance', 'Aparência'], ['behavior', 'Comportamento']] as [EditorTab, string][]).map(([key, label]) => <button type="button" className={tab === key ? 'active' : ''} key={key} onClick={() => setTab(key)}>{label}</button>)}<small>Bots ignorados · atraso de {config.delaySeconds}s · antirrepetição {config.deduplicate ? 'ativa' : 'desativada'}</small></nav>
        <output className={`welcome-validation welcome-validation-global ${validationError ? 'is-error' : fallbackNotice ? 'is-warning' : ''}`}>{validationError || fallbackNotice ? <KaelInfo /> : <KaelCheck />}{validationError || fallbackNotice || 'Tudo certo para enviar'}</output>
        <footer className="welcome-actions"><span className={dirty ? 'is-dirty' : ''}><i />{dirty ? 'Alterações não salvas' : 'Tudo salvo'}</span><button type="button" onClick={() => void save()} disabled={saving || Boolean(validationError) || !dirty}><KaelSave />{saving ? 'Salvando...' : 'Salvar alterações'}</button></footer>

        <div className="welcome-editor-grid">
          <section className="welcome-editor" aria-label="Editor da mensagem">
            {tab === 'message' && <div className="welcome-tab-panel">
              <h2><KaelMessage /> Conteúdo</h2>
              <label>Título<span className="welcome-counter">{config.title.length} / 256</span><input maxLength={256} value={config.title} onChange={(event) => update('title', event.target.value)} /></label>
              <label>Mensagem<span className="welcome-counter">{config.message.length} / 2000</span><textarea ref={messageRef} maxLength={2000} value={config.message} onChange={(event) => update('message', event.target.value)} /></label>
              <div className="welcome-variables"><span>Inserir variável</span><div>{variables.map((variable) => <button type="button" key={variable} onClick={() => insertVariable(variable)}>{variable}</button>)}</div></div>
              <div className="welcome-template"><span><strong>Modelo inicial</strong><small>Uma mensagem pronta para você personalizar.</small></span><button type="button" onClick={() => { update('title', defaultConfig.title); update('message', initialMessage); }}>Restaurar modelo</button></div>
            </div>}

            {tab === 'appearance' && <div className="welcome-tab-panel">
              <h2><KaelImage /> Aparência</h2>
              <div className="welcome-form-section"><h3>Cabeçalho</h3><div className="welcome-form-grid"><label>Nome do autor<input maxLength={256} value={config.authorName} onChange={(event) => update('authorName', event.target.value)} /></label><label>URL do autor<input inputMode="url" placeholder="site.com ou link completo" value={config.authorUrl} onChange={(event) => update('authorUrl', event.target.value)} /></label><label>Foto do autor<input inputMode="url" placeholder="site.com/imagem ou {membro.avatar}" value={config.authorIcon} onChange={(event) => update('authorIcon', event.target.value)} /></label></div></div>
              <div className="welcome-form-section"><h3>Imagens e estilo</h3><div className="welcome-form-grid"><label>Thumbnail<input inputMode="url" placeholder="site.com/imagem ou {membro.avatar}" value={config.thumbnail} onChange={(event) => update('thumbnail', event.target.value)} /></label><label>Banner<input inputMode="url" placeholder="site.com/imagem" value={config.bannerUrl} onChange={(event) => update('bannerUrl', event.target.value)} /></label><label>Cor lateral<span className="welcome-color-input"><input type="color" value={config.accentColor} onChange={(event) => update('accentColor', event.target.value.toUpperCase())} /><input maxLength={7} value={config.accentColor} onChange={(event) => update('accentColor', event.target.value.toUpperCase())} /></span></label></div><label className="welcome-checkbox"><input type="checkbox" checked={config.fallbackServerIcon} onChange={(event) => update('fallbackServerIcon', event.target.checked)} />Usar o ícone do servidor se a imagem falhar</label></div>
              <div className="welcome-form-section"><h3>Rodapé e botões</h3><div className="welcome-footer-fields"><label>Rodapé<input maxLength={2048} value={config.footer} onChange={(event) => update('footer', event.target.value)} /></label><label>Imagem do rodapé<input inputMode="url" placeholder="site.com/imagem ou {membro.avatar}" value={config.footerIcon} onChange={(event) => update('footerIcon', event.target.value)} /></label></div><div className="welcome-buttons-editor">{config.buttons.map((button, index) => <div className="welcome-button-row" key={index}><input aria-label={`Nome do botão ${index + 1}`} maxLength={80} placeholder="Nome" value={button.label} onChange={(event) => update('buttons', config.buttons.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} /><span className="welcome-url-field"><KaelLink /><input aria-label={`Link do botão ${index + 1}`} inputMode="url" maxLength={512} placeholder="site.com ou link completo" value={button.url} onChange={(event) => update('buttons', config.buttons.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} /></span><input className="welcome-emoji-field" aria-label={`Emoji do botão ${index + 1}`} maxLength={100} placeholder="✨ ou <:kael:id>" value={button.emoji} onChange={(event) => update('buttons', config.buttons.map((item, itemIndex) => itemIndex === index ? { ...item, emoji: event.target.value } : item))} /><button type="button" aria-label={`Remover botão ${index + 1}`} onClick={() => update('buttons', config.buttons.filter((_, itemIndex) => itemIndex !== index))}><KaelTrash /></button></div>)}<div className="welcome-add-button"><span>{config.buttons.length} de 3 botões</span><button type="button" disabled={config.buttons.length >= 3} onClick={() => update('buttons', [...config.buttons, { label: '', url: '', emoji: '' }])}>+ Adicionar botão</button></div></div></div>
            </div>}

            {tab === 'behavior' && <div className="welcome-tab-panel">
              <h2><KaelShield /> Comportamento</h2>
              <div className="welcome-behavior-list">
                <div><span><strong>Ignorar entrada de bots</strong><small>Evita mensagens para contas automatizadas.</small></span><Toggle checked={config.ignoreBots} onChange={(value) => update('ignoreBots', value)} label="Ignorar bots" /></div>
                <div><span><strong>Atraso antes do envio</strong><small>Dá tempo para o Discord concluir a entrada.</small></span><select value={config.delaySeconds} onChange={(event) => update('delaySeconds', Number(event.target.value))}>{[0, 1, 2, 3, 5, 10].map((seconds) => <option key={seconds} value={seconds}>{seconds === 0 ? 'Sem atraso' : `${seconds}s`}</option>)}</select></div>
                <div><span><strong>Apagar automaticamente</strong><small>Opcional para manter o canal organizado.</small></span><span className="welcome-behavior-control"><Toggle checked={config.autoDeleteSeconds !== null} onChange={(checked) => update('autoDeleteSeconds', checked ? 60 : null)} label="Apagar automaticamente" />{config.autoDeleteSeconds !== null && <select value={config.autoDeleteSeconds} onChange={(event) => update('autoDeleteSeconds', Number(event.target.value))}>{[30, 60, 300, 3600].map((seconds) => <option key={seconds} value={seconds}>{seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${seconds / 60} min` : '1 hora'}</option>)}</select>}</span></div>
                <div><span><strong>Proteção contra repetições</strong><small>Impede boas-vindas duplicadas em reconexões indevidas.</small></span><Toggle checked={config.deduplicate} onChange={(value) => update('deduplicate', value)} label="Proteção contra repetições" /></div>
              </div>
            </div>}
          </section>

          <aside className="welcome-preview" aria-label="Prévia em tempo real">
            <h2>Prévia em tempo real</h2>
            <div className="welcome-component-preview" style={{ '--preview-accent': config.accentColor } as CSSProperties}>
              <div className="welcome-preview-author"><Image src={previewAuthorIcon} alt="" width={36} height={36} unoptimized draggable={false} onError={() => markImageFailed('authorIcon', config.authorIcon)} /><span>{config.authorName || 'Kael'}</span></div>
              <div className="welcome-preview-copy"><span><strong>{renderedTitle}</strong><p>{renderedMessage}</p></span>{previewThumbnail && <Image src={previewThumbnail} alt="" width={58} height={58} unoptimized draggable={false} onError={() => markImageFailed('thumbnail', config.thumbnail)} />}</div>
              {previewBanner && <span className="welcome-preview-banner"><Image src={previewBanner} alt="" fill unoptimized draggable={false} onError={() => markImageFailed('bannerUrl', config.bannerUrl || previewBanner)} /></span>}
              {renderedFooter && <small className="welcome-preview-footer">{previewFooterIcon && <Image src={previewFooterIcon} alt="" width={20} height={20} unoptimized draggable={false} onError={() => markImageFailed('footerIcon', config.footerIcon)} />}{renderedFooter}</small>}
              {config.buttons.length > 0 && <div className="welcome-preview-buttons">{config.buttons.map((button, index) => {
                const previewUrl = secureWebUrl(button.url);
                return <a key={index} href={previewUrl || '#'} target={previewUrl ? '_blank' : undefined} rel={previewUrl ? 'noopener noreferrer' : undefined} aria-disabled={!previewUrl} onClick={previewUrl ? undefined : (event) => event.preventDefault()}>{button.emoji && <span>{button.emoji}</span>}{button.label || `Botão ${index + 1}`}</a>;
              })}</div>}
            </div>
            <div className="welcome-test-row"><button type="button" onClick={() => void sendTest()} disabled={testing || Boolean(validationError)}><KaelSend /> {testing ? 'Enviando...' : 'Enviar teste'}</button><select value={testTarget} onChange={(event) => setTestTarget(event.target.value as 'self' | 'channel')}><option value="self">Somente para mim</option><option value="channel">No canal escolhido</option></select></div>
            <div className="welcome-feedback" aria-live="polite">{feedback && <p className={feedback.kind}><span>{feedback.kind === 'success' ? <KaelCheck /> : <KaelInfo />}</span>{feedback.message}</p>}</div>
          </aside>
        </div>

      </div>
    </div>
  );
}
