'use client';

import React from 'react';
import { Moon, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';

export default function SleepCard() {
    const { userProfile } = useAuth();
    const { selectedDate } = useDate();
    const [currentSleep, setCurrentSleep] = React.useState(0);
    const [hasData, setHasData] = React.useState(false);

    React.useEffect(() => {
        if (!selectedDate) return;
        const loadSleep = () => {
            const saved = localStorage.getItem(`workout_os_sleep_${selectedDate}`);
            if (saved) {
                setCurrentSleep(parseFloat(saved));
                setHasData(true);
            } else {
                setCurrentSleep(0);
                setHasData(false);
            }
        };
        loadSleep();
        window.addEventListener('storage', loadSleep);
        return () => window.removeEventListener('storage', loadSleep);
    }, [selectedDate]);

    const target = userProfile?.sleepGoal || 7.5;
    const diff = currentSleep - target;
    const diffStr = diff === 0 ? '±0.0' : diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
    const isOnTarget = Math.abs(diff) <= 0.5;

    return (
        <Link
            href="/sleep"
            className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full min-h-[220px] cursor-pointer hover:shadow-md transition-shadow group block"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center border border-gray-100 dark:border-slate-700">
                        <Moon size={18} />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">SLEEP</span>
                    {hasData && (
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${isOnTarget ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'}`}>
                            {isOnTarget ? 'On target' : 'Off target'}
                        </span>
                    )}
                </div>
                <div className="text-gray-400 group-hover:text-gray-700 transition-colors p-1">
                    <ChevronRight size={18} />
                </div>
            </div>

            {/* Main Stat */}
            {hasData ? (
                <>
                    <div className="my-3">
                        <div className="flex items-baseline">
                            <span className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">{currentSleep.toFixed(1)}</span>
                            <span className="text-gray-500 text-lg font-bold ml-1.5">hrs</span>
                            <span className={`font-bold text-xs ml-3 ${isOnTarget ? 'text-emerald-600' : 'text-orange-500'}`}>
                                {diffStr} vs target
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                            <span>0h</span>
                            <span>Target: {target}h</span>
                            <span>10h</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((currentSleep / 10) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-4">
                    <p className="text-xs text-gray-400 font-medium">No sleep logged today</p>
                    <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                        <Plus size={12} /> Log Sleep
                    </span>
                </div>
            )}
        </Link>
    );
}
