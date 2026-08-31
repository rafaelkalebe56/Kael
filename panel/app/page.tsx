'use client';

import Image from 'next/image';
import { KaelAdd, KaelArrowRight, KaelEnter, KaelShield } from '@/components/kael-icons';
import { useEffect, useState } from 'react';

export default function Home() {
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
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

  return (
    <main className="kael-page">
      <header className="kael-nav">
        <a className="brand" href="/inicio" aria-label="Kael - início">
          <Image src="/kael-avatar.png" alt="Kael" width={44} height={44} priority unoptimized draggable={false} />
          <span>Kael</span>
        </a>
        <nav aria-label="Navegação principal">
          <a className="active" href="/inicio">Início</a>
        </nav>
        <a className="nav-action" href="/api/discord/invite">
          <KaelAdd /> Adicionar ao servidor
        </a>
      </header>

      <section className="hero" id="inicio" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">BOT DISCORD · SIMPLES E DIRETO</p>
          <h1 id="hero-title">Cuide do seu servidor.<br /><span>O Kael ajuda.</span></h1>
          <p className="hero-description">Moderação, organização e ferramentas para sua comunidade — em um só lugar.</p>
          <div className="actions">
            <a className="primary-action" href="/api/discord/invite">
              Adicionar Kael ao servidor <KaelArrowRight />
            </a>
            <a className="secondary-action" href="/api/auth/discord">
              <KaelEnter /> Acessar painel
            </a>
          </div>
          <p className="hero-note"><KaelShield /> Login seguro pelo Discord. Você decide quem pode gerenciar.</p>
        </div>

        <div className={'kael-art ' + (hasEntered ? 'welcome-wave' : '')} aria-label="Kael acenando para dar boas-vindas">
          <Image src="/kael-wave.png" alt="Kael acenando" fill priority sizes="(max-width: 900px) 90vw, 60vw" draggable={false} />
          {hasEntered && <div className="hello-bubble" role="status">Olá, eu sou o Kael!</div>}
        </div>
      </section>

      <section className="about-section" id="sobre" aria-labelledby="about-title">
        <div className="about-section-copy">
          <p className="section-eyebrow">SOBRE O KAEL</p>
          <h2 id="about-title">Um bot para deixar seu servidor <span>mais vivo.</span></h2>
          <p>Todo servidor tem sua própria personalidade. O Kael foi criado para ajudar sua comunidade a crescer com organização, diversão e menos tarefas repetitivas.</p>
          <p>Enquanto você cuida das pessoas e dos momentos importantes, ele ajuda a manter tudo funcionando de um jeito simples, bonito e do seu jeito.</p>
          <div className="about-highlight">
            <span className="about-highlight-icon"><KaelShield /></span>
            <span>Mais organização para a equipe. Mais tranquilidade para a comunidade.</span>
          </div>
        </div>

        <div className="about-section-art" aria-label="Retrato do Kael">
          <div className="about-art-ring" aria-hidden="true" />
          <Image src="/kael-avatar.png" alt="Retrato do Kael" width={360} height={360} unoptimized draggable={false} />
        </div>
      </section>
    </main>
  );
}
