'use client';

import Image from 'next/image';
import { ArrowRight, Headphones, LogIn, Plus, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

function playWelcomeChime() {
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    const context = new Context();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(554.37, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(739.99, context.currentTime + 0.16);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.07, context.currentTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.24);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.25);
    window.setTimeout(() => void context.close(), 350);
  } catch {
    // Audio is optional; browsers may block it until a user interacts.
  }
}

export default function Home() {
  const [hasEntered, setHasEntered] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!window.sessionStorage.getItem('kael-welcome-seen')) {
      window.sessionStorage.setItem('kael-welcome-seen', 'true');
      setHasEntered(true);
    }
  }, []);

  function enableSound() {
    playWelcomeChime();
    setNotice('Som de boas-vindas ativado.');
  }

  function unavailable(feature: string) {
    setNotice(feature + ' será conectado com o login seguro do Discord.');
  }

  return (
    <main className="kael-page">
      <header className="kael-nav">
        <a className="brand" href="#inicio" aria-label="Kael - início">
          <Image src="/kael-avatar.png" alt="Kael" width={44} height={44} priority />
          <span>Kael</span>
        </a>
        <nav aria-label="Navegação principal">
          <a className="active" href="#inicio">Início</a>
          <a href="#sobre">Sobre</a>
          <a href="#suporte">Suporte</a>
        </nav>
        <button className="nav-action" onClick={() => unavailable('Adicionar ao servidor')}>
          <Plus aria-hidden="true" /> Adicionar ao servidor
        </button>
      </header>

      <section className="hero" id="inicio" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">SEU NOVO BOT DISCORD</p>
          <h1 id="hero-title">Sua comunidade,<br /><span>mais simples.</span></h1>
          <p className="hero-description">Kael ajuda você a moderar, organizar e cuidar do seu servidor Discord.</p>
          <div className="actions">
            <button className="primary-action" onClick={() => unavailable('Adicionar Kael ao servidor')}>
              Adicionar Kael ao servidor <ArrowRight aria-hidden="true" />
            </button>
            <button className="secondary-action" onClick={() => unavailable('Acessar painel')}>
              <LogIn aria-hidden="true" /> Acessar painel
            </button>
          </div>
          <div className="about" id="sobre">
            <span className="about-icon"><ShieldCheck aria-hidden="true" /></span>
            <p><strong>Feito para comunidades.</strong> Menos confusão, mais tempo para o seu servidor.</p>
          </div>
        </div>

        <div className={'kael-art ' + (hasEntered ? 'welcome-wave' : '')} aria-label="Kael acenando para dar boas-vindas">
          <Image src="/kael-wave.png" alt="Kael acenando" fill priority sizes="(max-width: 900px) 90vw, 60vw" />
          {hasEntered && <div className="hello-bubble" role="status">Olá, eu sou o Kael!</div>}
        </div>
      </section>

      <div className="sound-control">
        <button onClick={enableSound}><Headphones aria-hidden="true" /> Ativar som de boas-vindas</button>
      </div>
      <p className="security-note" id="suporte">
        O acesso ao painel será feito pelo Discord e cada servidor só poderá ser gerenciado por quem tiver permissão.
      </p>
      {notice && <output className="notice" aria-live="polite">{notice}</output>}
    </main>
  );
}
