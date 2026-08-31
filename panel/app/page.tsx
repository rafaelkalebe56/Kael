'use client';

import Image from 'next/image';
import { KaelAdd, KaelArrowRight, KaelBot, KaelClock, KaelCommand, KaelMembers, KaelMoon, KaelServer, KaelShield, KaelSun, KaelWand } from '@/components/kael-icons';
import { useEffect, useState } from 'react';

export default function Home() {
  const [hasEntered, setHasEntered] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('kael-theme');
    if (savedTheme === 'light') setTheme('light');
    if (!window.sessionStorage.getItem('kael-welcome-seen')) {
      window.sessionStorage.setItem('kael-welcome-seen', 'true');
      setHasEntered(true);
    }

    const blockContextMenu = (event: MouseEvent) => event.preventDefault();
    const blockCopy = (event: ClipboardEvent) => event.preventDefault();
    const blockDrag = (event: DragEvent) => event.preventDefault();

    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('copy', blockCopy);
    document.addEventListener('cut', blockCopy);
    document.addEventListener('dragstart', blockDrag);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('copy', blockCopy);
      document.removeEventListener('cut', blockCopy);
      document.removeEventListener('dragstart', blockDrag);
    };
  }, []);

  const changeTheme = (nextTheme: 'dark' | 'light') => {
    setTheme(nextTheme);
    window.localStorage.setItem('kael-theme', nextTheme);
  };

  return (
    <main className={`kael-page home-${theme}`}>
      <header className="home-nav">
        <a className="home-brand" href="/inicio" aria-label="Kael - início">
          <Image src="/kael-avatar.png" alt="" width={48} height={48} priority unoptimized draggable={false} />
          <span>KAEL</span><i aria-hidden="true" />
        </a>
        <nav className="home-links" aria-label="Navegação principal">
          <a className="active" href="#inicio">Início</a>
          <a href="#recursos">Recursos</a>
          <a href="#sobre">Sobre</a>
        </nav>
        <div className="home-nav-actions">
          <div className="theme-switch" role="group" aria-label="Tema do site">
            <button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => changeTheme('light')} aria-label="Usar tema claro"><KaelSun /></button>
            <button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => changeTheme('dark')} aria-label="Usar tema escuro"><KaelMoon /></button>
          </div>
          <a className="home-nav-add" href="/api/discord/invite"><KaelAdd /> Adicionar ao Discord</a>
        </div>
      </header>

      <section className="home-hero" id="inicio" aria-labelledby="hero-title">
        <div className="home-hero-copy">
          <h1 id="hero-title">Seu servidor<br />funciona melhor<br />com o Kael.</h1>
          <p>Moderação, organização e ferramentas para sua comunidade em um só lugar.</p>
          <div className="home-hero-actions">
            <a className="home-primary" href="/api/discord/invite"><KaelBot /> Adicionar ao Discord</a>
            <a className="home-secondary" href="#recursos">Conhecer o Kael <KaelArrowRight /></a>
          </div>
          <dl className="home-proof" aria-label="Números atuais do Kael">
            <div><dt><KaelServer /> <strong>1</strong></dt><dd>Servidor</dd></div>
            <div><dt><KaelMembers /> <strong>2</strong></dt><dd>Membros</dd></div>
            <div><dt><KaelCommand /> <strong>1</strong></dt><dd>Comando</dd></div>
          </dl>
        </div>

        <div className="home-visual" aria-label="Kael e uma prévia do painel">
          <div className="home-console" aria-hidden="true">
            <div className="console-title">KAEL</div>
            <div className="console-body">
              <div className="console-menu"><span className="active">Visão geral</span><span>Moderação</span><span>Utilidades</span><span>Automação</span><span>Logs</span><span>Configurações</span></div>
              <div className="console-main"><h2>Visão geral</h2><div className="console-stats"><span><small>Servidores</small><strong>1</strong></span><span><small>Membros</small><strong>2</strong></span><span><small>Status</small><strong className="online">Online</strong></span></div><div className="console-activity"><b>Atividades recentes</b><span>Kael está pronto para começar</span><span>Painel conectado com segurança</span><span>Comunidade sincronizada</span></div></div>
            </div>
          </div>
          <div className={'home-kael ' + (hasEntered ? 'welcome-wave' : '')}>
            <Image src="/kael-wave.png" alt="Kael acenando" fill priority sizes="(max-width: 900px) 88vw, 48vw" draggable={false} />
          </div>
        </div>
      </section>

      <section className="home-resources" id="recursos" aria-labelledby="resources-title">
        <p>RECURSOS</p><h2 id="resources-title">Tudo que sua comunidade precisa.</h2><span>Ferramentas para moderar, organizar e simplificar o dia a dia do seu servidor.</span>
        <div className="resource-grid">
          <article><KaelShield /><small>01</small><h3>Moderação simples</h3><p>Controles claros para proteger sua comunidade sem complicação.</p></article>
          <article><KaelWand /><small>02</small><h3>Rotinas automáticas</h3><p>Menos tarefas repetitivas e mais tempo para cuidar das pessoas.</p></article>
          <article><KaelClock /><small>03</small><h3>Tudo em um painel</h3><p>Configure seu servidor pelo navegador e acompanhe o que importa.</p></article>
        </div>
      </section>

      <section className="home-about" id="sobre" aria-labelledby="about-title">
        <div className="home-about-art"><Image src="/kael-avatar.png" alt="Retrato do Kael" width={420} height={420} unoptimized draggable={false} /></div>
        <div><p>SOBRE O KAEL</p><h2 id="about-title">Feito para comunidades que querem crescer bem.</h2><span>O Kael nasceu para organizar o trabalho da equipe e deixar a experiência da comunidade mais leve. Cada recurso é pensado para ser direto, bonito e fácil de configurar.</span>
          <a href="/api/discord/invite">Adicionar ao Discord <KaelArrowRight /></a>
        </div>
      </section>

      <footer className="home-footer">
        <a className="home-brand" href="#inicio"><Image src="/kael-avatar.png" alt="" width={38} height={38} unoptimized draggable={false} /><span>KAEL</span></a>
        <p>Feito para cuidar da sua comunidade.</p>
        <div><a href="#recursos">Recursos</a><a href="#sobre">Sobre</a><a href="/api/auth/discord">Entrar</a></div>
      </footer>
    </main>
  );
}
