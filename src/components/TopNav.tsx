'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function TopNav() {
  const { userProfile } = useAuth();
  const displayName = userProfile?.fullName ? userProfile.fullName.split(' ')[0] : (userProfile?.username || 'User');
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 w-full z-50 glass pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 px-margin-mobile max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 active:scale-95 transition-transform">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[20px]">vital_signs</span>
          </div>
          <span className="font-headline-md text-headline-md font-semibold text-on-surface tracking-tight">Workout OS</span>
        </Link>
        {/* Avatar routes to the full profile screen so there is one profile UI,
            not a modal here and a page in the bottom nav. */}
        <Link
          href="/profile"
          aria-label="Open profile"
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center active:scale-90 transition-transform"
        >
          {userProfile ? (
            <span className="text-on-primary text-xs font-bold">{initial}</span>
          ) : (
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          )}
        </Link>
      </div>
    </header>
  );
}
