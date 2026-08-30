import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <section className="not-found-copy">
        <p className="panel-kicker">ERRO 404</p>
        <h1>Hmm... essa página se perdeu.</h1>
        <p>Até o Kael ficou na dúvida. Vamos te levar de volta para um lugar conhecido.</p>
        <a className="panel-primary-link" href="/inicio"><ArrowLeft aria-hidden="true" /> Voltar para o início</a>
      </section>
      <div className="not-found-art" aria-label="Kael confuso com pontos de interrogação">
        <Image src="/kael-confused.png" alt="Kael com expressão de dúvida" width={768} height={1024} priority unoptimized draggable={false} />
      </div>
    </main>
  );
}
