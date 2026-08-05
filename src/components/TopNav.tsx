'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export function TopNav() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const displayName = userProfile?.fullName ? userProfile.fullName.split(' ')[0] : (userProfile?.username || (t('nav.top.user') !== 'nav.top.user' ? t('nav.top.user') : 'యూజర్'));
  const initial = displayName.charAt(0).toUpperCase();

  const [showNotifPrompt, setShowNotifPrompt] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowNotifPrompt(true);
      }
    }
  }, []);

  const requestNotifPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setShowNotifPrompt(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 glass pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin-mobile max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 active:scale-95 transition-transform">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-black">
              <img src="/logo.png" alt="Workout OS Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">Workout OS</span>
          </Link>
          <Link
            href="/profile"
            aria-label={t('nav.top.openProfile') !== 'nav.top.openProfile' ? t('nav.top.openProfile') : 'ప్రొఫైల్ తెరవండి'}
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
      {showNotifPrompt && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-primary/95 backdrop-blur-sm text-on-primary px-4 py-2 flex items-center justify-between shadow-md">
          <span className="text-sm font-medium">Enable notifications to get hydration and workout reminders!</span>
          <button onClick={requestNotifPermission} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ml-2 shrink-0">
            Enable
          </button>
        </div>
      )}
    </>
  );
}
