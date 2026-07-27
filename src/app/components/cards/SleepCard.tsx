'use client';

import React from 'react';
import { Moon, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';

export default function SleepCard() {
    const { userProfile } = useAuth();
    const { selectedDate, isToday } = useDate();
    const [currentSleep, setCurrentSleep] = React.useState(0);

    React.useEffect(() => {
        if (!selectedDate) return;
        const loadSleep = () => {
            let saved = localStorage.getItem(`workout_os_sleep_${selectedDate}`);
            
            if (!saved && isToday) {
                const legacy = localStorage.getItem('workout_os_sleep_current');
                if (legacy) {
                    saved = legacy;
                    localStorage.setItem(`workout_os_sleep_${selectedDate}`, legacy);
                    localStorage.removeItem('workout_os_sleep_current');
                }
            }

            if (saved) setCurrentSleep(parseFloat(saved));
            else setCurrentSleep(7.45); // Default mock value if nothing saved
        };
        
        loadSleep();
        
        window.addEventListener('storage', loadSleep);
        return () => window.removeEventListener('storage', loadSleep);
    }, [selectedDate]);

    return (
        <Link 
            href="/sleep"
            className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full min-h-[220px] cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/80 hover:shadow-md transition-all btn-press group block"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-indigo-50/50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-700/50">
                        <Moon size={18} />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">SLEEP</span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-gray-100 dark:border-indigo-800/50 shadow-sm">
                        On target
                    </span>
                </div>
                <div className="text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors p-1" aria-label="Expand sleep details">
                    <ChevronRight size={18} />
                </div>
            </div>

            {/* Main Stat */}
            <div className="my-3">
                <div className="flex items-baseline drop-shadow-sm">
                    <span className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">{currentSleep}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-lg font-bold ml-1.5">hrs</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs ml-3 inline-flex items-center">
                        +–0.0 vs target
                    </span>
                </div>
            </div>

            {/* Target & Progress Bar */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400 font-bold">
                    <span>0h</span>
                    <span>Target: 7.5h</span>
                    <span>10h</span>
                </div>
                <div className="w-full bg-gray-50 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-gray-100 dark:border-slate-700 shadow-inner">
                    <div className="bg-gradient-to-r from-[#7c4dff] to-[#b388ff] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(124,77,255,0.4)]" style={{ width: `${Math.min((currentSleep / 10) * 100, 100)}%` }} />
                </div>
            </div>

            {/* Sleep & Wake Times */}
            <div className="flex items-center justify-around text-[11px] text-gray-700 dark:text-gray-300 font-bold pt-3 mt-3 border-t border-gray-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-gray-100 dark:border-slate-700 shadow-sm">
                    <span>🌙</span> 10:45 PM
                </span>
                <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-gray-100 dark:border-slate-700 shadow-sm">
                    <span>☀️</span> 6:12 AM
                </span>
            </div>
        </Link>
    );
}
