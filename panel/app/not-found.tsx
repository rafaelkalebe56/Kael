import Image from 'next/image';
import { KaelArrowLeft } from '@/components/kael-icons';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <section className="not-found-copy">
        <p className="panel-kicker">ERRO 404</p>
        <h1>Hmm... essa página se perdeu.</h1>
        <p>Até o Kael ficou na dúvida. Vamos te levar de volta para um lugar conhecido.</p>
        <a className="panel-primary-link" href="/inicio"><KaelArrowLeft /> Voltar para o início</a>
      </section>
      <div className="not-found-art" aria-label="Kael confuso com pontos de interrogação">
        <Image src="/kael-confused.webp" alt="Kael com expressão de dúvida" width={768} height={1152} priority unoptimized sizes="(max-width: 800px) 90vw, 48vw" draggable={false} />
      </div>
    </main>
  );
}
