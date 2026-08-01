'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';

const GREETING_BY_HOUR = (h: number) => {
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
};

export default function DashboardHeader() {
    const { userProfile } = useAuth();
    const { offsetDays, setOffsetDays, selectedDate, isToday } = useDate();
    const [greeting, setGreeting] = useState('Good morning');
    const [dateStr, setDateStr] = useState('');
    const displayName = userProfile?.fullName ? userProfile.fullName.split(' ')[0] : (userProfile?.username || 'Friend');
    const initial = displayName.charAt(0).toUpperCase();

    useEffect(() => {
        if (!selectedDate) return;
        const d = new Date(selectedDate);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        setDateStr(`${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`);
    }, [selectedDate]);

    useEffect(() => {
        const now = new Date();
        const h = now.getHours();
        setGreeting(GREETING_BY_HOUR(h));
    }, []);

    return (
        <div className="space-y-4">

            {/* Header Main Row */}
            <div className="flex items-center justify-between gap-2 pt-2 pb-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex flex-col items-start min-w-0 w-full">
                        <h1 className="text-3xl sm:text-4xl font-bold text-on-surface drop-shadow-sm truncate w-full py-1">
                            {greeting}, {displayName}
                        </h1>
                        <div className="flex items-center gap-2 mt-1.5 sm:mt-1">
                            <button 
                                onClick={() => setOffsetDays(Math.max(offsetDays - 1, -14))}
                                disabled={offsetDays <= -14}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors text-gray-500 dark:text-gray-400"
                            >
                                <ChevronLeft size={12} />
                            </button>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-bold whitespace-nowrap select-none">
                                {isToday ? 'Today, ' : ''}{dateStr || 'Loading...'}
                            </p>
                            <button 
                                onClick={() => setOffsetDays(Math.min(offsetDays + 1, 0))}
                                disabled={isToday}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors text-gray-500 dark:text-gray-400"
                            >
                                <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Link
                        href="/profile"
                        aria-label="Open profile"
                        className="w-10 h-10 rounded-full bg-primary flex items-center justify-center active:scale-90 transition-transform shadow-sm"
                    >
                        {userProfile ? (
                            <span className="text-on-primary text-sm font-bold tabular-nums">{initial}</span>
                        ) : (
                            <User size={18} className="text-on-primary" />
                        )}
                    </Link>
                </div>
            </div>




        </div>
    );
}