'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Wallet, Dumbbell, Apple, Settings, Calendar } from 'lucide-react';
import clsx from 'clsx';
import UserProfileModal from '@/app/components/UserProfileModal';

export default function BottomNav() {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navItems = [
    { name: 'Today', href: '/dashboard', icon: LayoutGrid },
    { name: 'Budget', href: '/budget-tracker', icon: Wallet },
    { name: 'Workout', href: '/workout', icon: Dumbbell },
    { name: 'Diet', href: '/diet', icon: Apple },
    { name: 'Planner', href: '/planner', icon: Calendar },
    { name: 'Profile & Cache', href: 'profile', icon: Settings },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#0f1115]/80 backdrop-blur-xl border-t border-gray-100 dark:border-slate-800 z-40 px-4 py-2 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.05)] transition-colors">
        <ul className="flex justify-around items-center max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/dashboard' ? (pathname === '/dashboard' || pathname === '/') : pathname === item.href;
            
            if (item.href === 'profile') {
              return (
                <li key={item.name}>
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="flex flex-col items-center gap-0.5 transition-all duration-150 btn-press group"
                  >
                    <div className="p-2 rounded-2xl flex items-center justify-center transition-colors text-gray-500 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-200 group-hover:bg-gray-100 dark:group-hover:bg-white/10 shadow-sm border border-transparent group-hover:border-gray-200 dark:group-hover:border-white/10">
                      <Icon size={22} strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-500 transition-colors group-hover:text-gray-900 dark:group-hover:text-gray-200 drop-shadow-sm">
                      Profile
                    </span>
                  </button>
                </li>
              );
            }

            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className="flex flex-col items-center gap-0.5 transition-all duration-150 btn-press group"
                >
                  <div className={clsx(
                    "p-2 rounded-2xl flex items-center justify-center transition-colors shadow-sm border",
                    isActive ? "text-blue-600 dark:text-blue-400 bg-white/60 dark:bg-slate-800/80 border-white/80 dark:border-slate-700 shadow-[0_4px_12px_rgba(0,122,255,0.15)] dark:shadow-[0_4px_12px_rgba(0,122,255,0.3)]" : "text-gray-500 dark:text-gray-500 bg-transparent border-transparent group-hover:bg-white/40 dark:group-hover:bg-white/10 group-hover:text-gray-900 dark:group-hover:text-gray-200 group-hover:border-white/40 dark:group-hover:border-white/10"
                  )}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={clsx(
                    "text-[10px] transition-colors drop-shadow-sm",
                    isActive ? "font-bold text-blue-700 dark:text-blue-400" : "font-bold text-gray-600 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-200"
                  )}>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}
