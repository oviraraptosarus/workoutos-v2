'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useLanguage } from '@/contexts/LanguageContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { name: t('nav.bottom.today') !== 'nav.bottom.today' ? t('nav.bottom.today') : 'Today', href: '/dashboard', icon: 'dashboard', matchRoot: true },
    { name: t('nav.bottom.planner') !== 'nav.bottom.planner' ? t('nav.bottom.planner') : 'Planner', href: '/planner', icon: 'bolt' },
    { name: t('nav.bottom.diet') !== 'nav.bottom.diet' ? t('nav.bottom.diet') : 'Diet', href: '/diet', icon: 'nutrition' },
    { name: t('nav.bottom.workout') !== 'nav.bottom.workout' ? t('nav.bottom.workout') : 'Workout', href: '/workout', icon: 'fitness_center' },
    { name: t('nav.bottom.budget') !== 'nav.bottom.budget' ? t('nav.bottom.budget') : 'Budget', href: '/budget-tracker', icon: 'payments' },
    { name: t('nav.bottom.countdown') !== 'nav.bottom.countdown' ? t('nav.bottom.countdown') : 'Targets', href: '/countdowns', icon: 'hourglass_empty' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none">
      <div className="mx-auto max-w-md w-full bg-white/10 dark:bg-black/30 backdrop-blur-3xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)] rounded-full pointer-events-auto flex justify-between items-center px-2 py-2 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        {navItems.map((item) => {
          const isActive = item.matchRoot 
              ? (pathname === item.href || pathname === '/') 
              : pathname === item.href;
          
          return (
            <Link 
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-14 h-12 rounded-full transition-all duration-300 group"
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={clsx(
                "absolute inset-0 rounded-full transition-opacity duration-300",
                isActive ? "bg-on-surface/10 opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:bg-on-surface/5"
              )} />
              
              <span className={clsx(
                "material-symbols-outlined text-[24px] z-10 transition-all duration-300",
                isActive ? "text-secondary scale-110 shadow-secondary/50" : "text-on-surface-variant group-hover:text-on-surface"
              )}
              style={isActive ? { textShadow: '0 0 12px rgba(var(--c-secondary) / 0.4)' } : undefined}
              >
                {item.icon}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-secondary shadow-[0_0_8px_rgba(var(--c-secondary)/0.8)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
