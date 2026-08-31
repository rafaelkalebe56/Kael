import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://kael.up.railway.app'),
  title: 'Kael — Seu novo bot Discord',
  description: 'Kael ajuda você a moderar, organizar e cuidar da sua comunidade Discord.',
  openGraph: {
    title: 'Kael — Seu servidor funciona melhor',
    description: 'Moderação, organização e ferramentas para sua comunidade Discord em um só lugar.',
    url: '/inicio',
    siteName: 'Kael',
    locale: 'pt_BR',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Kael acenando' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kael — Seu servidor funciona melhor',
    description: 'Moderação, organização e ferramentas para sua comunidade Discord em um só lugar.',
    images: ['/og.png'],
  },
  icons: {
    icon: {
      url: '/assets/kael-favicon-128.png',
      type: 'image/png',
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "(()=>{try{const s=localStorage.getItem('kael-theme');const t=s==='light'||s==='dark'?s:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.kaelTheme=t;document.documentElement.style.colorScheme=t}catch{document.documentElement.dataset.kaelTheme='dark'}})();" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
