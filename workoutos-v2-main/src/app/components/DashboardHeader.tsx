'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCommandCenterEngine } from '@/hooks/useCommandCenterEngine';
import { useReminderEngine } from '@/hooks/useReminderEngine';
import QUOTES from '@/data/quotes.json';

const GREETING_BY_HOUR = (h: number) => {
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
};


export default function DashboardHeader() {
    const { userProfile } = useAuth();
    const { offsetDays, setOffsetDays, selectedDate, isToday } = useDate();
    const { t } = useLanguage();
    const [greeting, setGreeting] = useState('');
    const [dateStr, setDateStr] = useState('');
    const [dailyQuote, setDailyQuote] = useState(QUOTES[0]);
    
    // Initialize the engine to generate AI insights behind the scenes
    useCommandCenterEngine();
    useReminderEngine();
    
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
        if (h < 12) setGreeting(t('nav.greeting.morning'));
        else if (h < 17) setGreeting(t('nav.greeting.afternoon'));
        else setGreeting(t('nav.greeting.evening'));
        
        // Pick a quote: use the same one the splash showed, or fall back to random
        try {
            const stored = sessionStorage.getItem('workout_os_daily_quote');
            setDailyQuote(stored ? JSON.parse(stored) : QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        } catch {
            setDailyQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        }
    }, [t]);

    return (
        <div className="space-y-4">

            {/* Header Main Row */}
            <div className="flex items-center justify-between gap-2 pt-4 sm:pt-2 pb-2">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex flex-col items-start min-w-0 w-full">
                        <h1 className="text-3xl sm:text-4xl font-bold text-on-surface drop-shadow-sm leading-tight w-full py-1 break-words">
                            {greeting}, {displayName}
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-on-surface-variant italic mt-1.5 opacity-80 line-clamp-2">
                            "{dailyQuote.text.replace(/^"+|"+$/g, '').replace(/^'|'$/g, '')}" — {dailyQuote.subtext.replace(/^["\-\s\u2014]+/, '')}
                        </p>
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <label className="text-xs text-on-surface-variant dark:text-on-surface-variant font-bold whitespace-nowrap select-none cursor-pointer flex items-center gap-1.5 relative hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors bg-surface-container-low px-3 py-1.5 rounded-full border border-surface-variant/50 shadow-sm">
                                <Calendar size={12} className="text-on-surface-variant" />
                                {isToday ? t('nav.today') : ''}{dateStr || 'Loading...'}
                                <input 
                                    type="date"
                                    value={selectedDate || ''}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const newDate = new Date(e.target.value);
                                            const today = new Date();
                                            const diffTime = newDate.getTime() - today.getTime();
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                            if (diffDays <= 0 && diffDays >= -14) {
                                                setOffsetDays(diffDays);
                                            }
                                        }
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    max={new Date().toISOString().split('T')[0]}
                                    min={new Date(new Date().setDate(new Date().getDate() - 14)).toISOString().split('T')[0]}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}