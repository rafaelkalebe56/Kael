'use client';

import { KaelChevronDown, KaelExit, KaelGrid, KaelUser } from '@/components/kael-icons';
import { useEffect, useRef, useState } from 'react';

type Profile = { displayName: string; avatarUrl: string | null };

export function DashboardProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/discord/profile', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ profile: Profile }> : null)
      .then((data) => setProfile(data?.profile ?? null))
      .catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <div className="dashboard-profile-wrap" ref={menuRef}>
      <button className="dashboard-profile" type="button" aria-label="Abrir menu da conta" aria-expanded={menuOpen} aria-controls="dashboard-account-menu" onClick={() => setMenuOpen((current) => !current)}>
        <span className="dashboard-profile-avatar" aria-hidden="true">
          {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" draggable={false} /> : <KaelUser />}
        </span>
        <span className="dashboard-profile-copy"><strong>{profile?.displayName ?? 'Discord'}</strong><small>{profile ? 'Conectado' : 'Carregando'}</small></span>
        <KaelChevronDown className={`dashboard-profile-chevron ${menuOpen ? 'is-open' : ''}`} />
      </button>
      {menuOpen && (
        <div id="dashboard-account-menu" className="dashboard-account-menu" role="menu" aria-label="Menu da conta">
          <p className="dashboard-account-label">{profile?.displayName ?? 'Conta Discord'}</p>
          <hr className="dashboard-account-separator" />
          <a className="dashboard-account-item" href="/servidores" role="menuitem"><KaelGrid /> Meus servidores</a>
          <a className="dashboard-account-item dashboard-account-logout" href="/api/auth/logout" role="menuitem"><KaelExit /> Sair</a>
        </div>
      )}
    </div>
  );
}
