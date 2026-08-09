'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles } from 'lucide-react';

export function TopNav() {
  const { userProfile } = useAuth();
  const displayName = userProfile?.fullName ? userProfile.fullName.split(' ')[0] : (userProfile?.username || 'User');
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 pt-4 pointer-events-none">
      <div className="mx-auto max-w-5xl w-full bg-white/10 dark:bg-black/30 backdrop-blur-3xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)] rounded-2xl pointer-events-auto flex items-center justify-between px-4 py-3 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        <Link href="/dashboard" className="flex items-center gap-3 active:scale-95 transition-transform group">
          <div className="w-9 h-9 rounded-full overflow-hidden shadow-sm group-hover:shadow-md transition-shadow flex items-center justify-center bg-black/20 border border-white/10">
            <img src="/logo.png" alt="Workout OS Logo" className="w-full h-full object-cover scale-110" />
          </div>
          <span className="font-bold text-lg text-on-surface tracking-tight group-hover:text-secondary transition-colors">Workout OS</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new Event('open-ai-copilot'))}
            aria-label="Open AI Copilot"
            className="w-9 h-9 rounded-full transition-transform active:scale-90 flex items-center justify-center shadow-sm relative overflow-hidden group/ai border border-white/20"
          >
             <div className="ava-orb-icon w-full h-full absolute inset-0 opacity-80 group-hover/ai:opacity-100 transition-opacity"></div>
             <Sparkles size={16} className="text-white relative z-10 drop-shadow-md" />
          </button>
          <Link
            href="/profile"
            className="w-9 h-9 rounded-full bg-black dark:bg-white flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:shadow-[0_0_15px_rgba(255,255,255,0.4)] border border-black/10 dark:border-white/20 hover:shadow-[0_0_25px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]"
          >
            {userProfile ? (
              <span className="text-white dark:text-black text-sm font-black">{initial}</span>
            ) : (
              <span className="material-symbols-outlined text-white dark:text-black text-[20px]">person</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
