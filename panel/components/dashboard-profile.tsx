'use client';

import { KaelChevronDown, KaelExit, KaelGrid, KaelUser } from '@/components/kael-icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Profile = { displayName: string; avatarUrl: string | null };

export function DashboardProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch('/api/discord/profile', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ profile: Profile }> : null)
      .then((data) => setProfile(data?.profile ?? null))
      .catch(() => setProfile(null));
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="dashboard-profile" aria-label="Abrir menu da conta">
        <span className="dashboard-profile-avatar" aria-hidden="true">
          {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" draggable={false} /> : <KaelUser />}
        </span>
        <span className="dashboard-profile-copy"><strong>{profile?.displayName ?? 'Discord'}</strong><small>{profile ? 'Conectado' : 'Carregando'}</small></span>
        <KaelChevronDown className="dashboard-profile-chevron" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="dashboard-account-menu">
        <DropdownMenuLabel className="dashboard-account-label">{profile?.displayName ?? 'Conta Discord'}</DropdownMenuLabel>
        <DropdownMenuSeparator className="dashboard-account-separator" />
        <DropdownMenuItem className="dashboard-account-item" render={<Link href="/servidores" />}><KaelGrid /> Meus servidores</DropdownMenuItem>
        <DropdownMenuItem className="dashboard-account-item dashboard-account-logout" onClick={() => window.location.assign('/api/auth/logout')}><KaelExit /> Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
