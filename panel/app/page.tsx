'use client';

import Image from 'next/image';
import { ArrowRight, LogIn, Plus, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (!window.sessionStorage.getItem('kael-welcome-seen')) {
      window.sessionStorage.setItem('kael-welcome-seen', 'true');
      setHasEntered(true);
    }
  }, []);

  return (
    <main className="kael-page">
      <header className="kael-nav">
        <a className="brand" href="/inicio" aria-label="Kael - início">
          <Image src="/kael-avatar.png" alt="Kael" width={44} height={44} priority unoptimized />
          <span>Kael</span>
        </a>
        <nav aria-label="Navegação principal">
          <a className="active" href="/inicio">Início</a>
        </nav>
        <button className="nav-action" type="button">
          <Plus aria-hidden="true" /> Adicionar ao servidor
        </button>
      </header>

      <section className="hero" id="inicio" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">SEU NOVO BOT DISCORD</p>
          <h1 id="hero-title">Sua comunidade,<br /><span>mais simples.</span></h1>
          <p className="hero-description">Kael ajuda você a moderar, organizar e cuidar do seu servidor Discord.</p>
          <div className="actions">
            <button className="primary-action" type="button">
              Adicionar Kael ao servidor <ArrowRight aria-hidden="true" />
            </button>
            <button className="secondary-action" type="button">
              <LogIn aria-hidden="true" /> Acessar painel
            </button>
          </div>
        </div>

        <div className="hero-symbols" aria-hidden="true">
          <span className="symbol plus">+</span>
          <span className="symbol ring">○</span>
          <span className="symbol diamond">◇</span>
          <span className="symbol dash">−</span>
        </div>
        <div className={'kael-art ' + (hasEntered ? 'welcome-wave' : '')} aria-label="Kael acenando para dar boas-vindas">
          <Image src="/kael-wave.png" alt="Kael acenando" fill priority sizes="(max-width: 900px) 90vw, 60vw" />
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
            <span className="about-highlight-icon"><ShieldCheck aria-hidden="true" /></span>
            <span>Mais organização para a equipe. Mais tranquilidade para a comunidade.</span>
          </div>
        </div>

        <div className="about-section-art" aria-label="Retrato do Kael">
          <div className="about-art-ring" aria-hidden="true" />
          <Image src="/kael-avatar.png" alt="Retrato do Kael" width={360} height={360} unoptimized />
        </div>
      </section>
    </main>
  );
}
