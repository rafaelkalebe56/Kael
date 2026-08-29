import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kael — Seu novo bot Discord',
  description: 'Kael ajuda você a moderar, organizar e cuidar da sua comunidade Discord.',
  icons: {
    icon: {
      url: '/assets/kael-favicon-portrait.png',
      type: 'image/png',
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
