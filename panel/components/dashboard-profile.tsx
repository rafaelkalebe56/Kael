'use client';

import { LogOut, UserRound } from 'lucide-react';
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
    <div className="dashboard-profile">
      <span className="dashboard-profile-avatar" aria-hidden="true">
        {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" draggable={false} /> : <UserRound />}
      </span>
      <span className="dashboard-profile-copy"><strong>{profile?.displayName ?? 'Discord'}</strong><small>Conectado</small></span>
      <a href="/api/auth/logout" aria-label="Sair do painel"><LogOut aria-hidden="true" /></a>
    </div>
  );
}
