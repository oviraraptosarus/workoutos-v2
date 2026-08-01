'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';


export default function BottomNav() {

  const pathname = usePathname();

  // Profile intentionally lives behind the top-right avatar now, not the tab bar.
  const navItems = [
    { name: 'Today', href: '/dashboard', icon: 'dashboard', matchRoot: true },
    { name: 'Planner', href: '/planner', icon: 'task_alt' },
    { name: 'Diet', href: '/diet', icon: 'nutrition' },
    { name: 'Workout', href: '/workout', icon: 'fitness_center' },
    { name: 'Budget', href: '/budget-tracker', icon: 'payments' },
  ];

  return (
    <>
      <nav className="fixed bottom-0 w-full z-50 pb-safe glass border-t border-surface-variant/30" data-active-classes="text-secondary">
        <div className="flex justify-between items-center min-h-[5rem] py-2 px-4 max-w-5xl mx-auto">
          {navItems.map((item) => {
            const isActive = item.matchRoot 
                ? (pathname === item.href || pathname === '/') 
                : pathname === item.href;
            
            const commonClasses = clsx(
              "flex flex-col items-center justify-center gap-1 w-[60px] h-[60px] transition-colors duration-200",
              isActive ? "text-secondary" : "text-on-surface-variant hover:bg-surface-container/50 rounded-xl"
            );

            return (
              <Link 
                key={item.name}
                href={item.href}
                className={commonClasses}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-label-sm text-label-sm">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
