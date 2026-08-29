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
          <Image src="/kael-avatar.png" alt="Kael" width={44} height={44} priority />
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
          <div className="about" id="sobre">
            <span className="about-icon"><ShieldCheck aria-hidden="true" /></span>
            <p><strong>Conheça o Kael.</strong> Um bot criado para deixar sua comunidade mais organizada, segura e simples de administrar.</p>
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
    </main>
  );
}
