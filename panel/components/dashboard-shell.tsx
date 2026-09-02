'use client';

import Image from 'next/image';
import { DashboardProfile } from '@/components/dashboard-profile';
import { KaelGrid, KaelHome, KaelInfo, KaelMenu, KaelMoon, KaelPulse, KaelSun } from '@/components/kael-icons';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

const navigation = [
  { key: 'home', label: 'Início', href: '/inicio', icon: KaelHome },
  { key: 'servers', label: 'Meus servidores', href: '/servidores', icon: KaelGrid },
  { key: 'status', label: 'Status', href: '/status', icon: KaelPulse },
  { key: 'about', label: 'Sobre', href: '/inicio#sobre', icon: KaelInfo },
];

function DashboardNavigation({ active }: { active: string }) {
  return (
    <nav className="dashboard-menu" aria-label="Menu do painel">
      {navigation.map((item) => {
        const NavigationIcon = item.icon;
        return <a className={`dashboard-menu-item ${active === item.key ? 'active' : ''}`} href={item.href} key={item.key}><NavigationIcon /><span>{item.label}</span></a>;
      })}
    </nav>
  );
}

function DashboardBrand() {
  return (
    <a className="dashboard-brand" href="/inicio" aria-label="Kael - início">
      <Image src="/kael-avatar.webp" alt="" width={44} height={44} unoptimized draggable={false} />
      <span>KAEL</span>
    </a>
  );
}

export function DashboardShell({ children, active = 'servers' }: { children: ReactNode; active?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.dataset.kaelTheme;
    setTheme(current === 'light' ? 'light' : 'dark');
  }, []);

  const changeTheme = (nextTheme: Theme) => {
    document.documentElement.dataset.kaelTheme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem('kael-theme', nextTheme);
    setTheme(nextTheme);
  };

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <DashboardBrand />
        <DashboardNavigation active={active} />
        <p className="dashboard-sidebar-note">Painel seguro conectado ao Discord.</p>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-top">
          <div className="dashboard-mobile-nav">
            <Sheet>
              <SheetTrigger className="dashboard-mobile-trigger" aria-label="Abrir menu"><KaelMenu /></SheetTrigger>
              <SheetContent side="left" className="dashboard-mobile-sheet">
                <SheetHeader className="dashboard-mobile-sheet-header">
                  <SheetTitle><DashboardBrand /></SheetTitle>
                  <SheetDescription>Menu do painel Kael</SheetDescription>
                </SheetHeader>
                <DashboardNavigation active={active} />
              </SheetContent>
            </Sheet>
          </div>
          <p>PAINEL KAEL</p>
          <div className="dashboard-top-actions">
            <div className="dashboard-theme-switch" role="group" aria-label="Tema do painel">
              <button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => changeTheme('light')} aria-label="Usar tema claro"><KaelSun /></button>
              <button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => changeTheme('dark')} aria-label="Usar tema escuro"><KaelMoon /></button>
            </div>
            <DashboardProfile />
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
