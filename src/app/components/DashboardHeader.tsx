'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, User, Bell } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase/client';
import CommandCenterOverlay from '@/app/components/modals/CommandCenterOverlay';
import { useCommandCenterEngine } from '@/hooks/useCommandCenterEngine';
import { useReminderEngine } from '@/hooks/useReminderEngine';
import { useDailySnapshot } from '@/hooks/useDailySnapshot';
import { Sparkles } from 'lucide-react';

const GREETING_BY_HOUR = (h: number) => {
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
};

const QUOTES = [
    { text: '"Tell me, what is it you plan to do with your one wild and precious life?"', subtext: "— Mary Oliver" },
    { text: '"You could leave life right now. Let that determine what you do and say and think."', subtext: "— Marcus Aurelius" },
    { text: '"Amateurs sit and wait for inspiration, the rest of us just get up and go to work."', subtext: "— Stephen King" },
    { text: '"We suffer more often in imagination than in reality."', subtext: "— Seneca" },
    { text: '"Don\'t stop when you\'re tired. Stop when you\'re done."', subtext: "— David Goggins" }
];

export default function DashboardHeader() {
    const { userProfile } = useAuth();
    const { offsetDays, setOffsetDays, selectedDate, isToday } = useDate();
    const { t } = useLanguage();
    const [greeting, setGreeting] = useState('');
    const [dateStr, setDateStr] = useState('');
    const [showCommandCenter, setShowCommandCenter] = useState(false);
    const [dailyQuote, setDailyQuote] = useState(QUOTES[0]);
    
    const { snapshot } = useDailySnapshot();
    
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
        
        // Pick a consistent quote for the day based on the date
        const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        setDailyQuote(QUOTES[dayOfYear % QUOTES.length]);
    }, [t]);

    return (
        <div className="space-y-4">

            {/* Header Main Row */}
            <div className="flex items-center justify-between gap-2 pt-2 pb-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex flex-col items-start min-w-0 w-full">
                        <h1 className="text-2xl sm:text-4xl font-bold text-on-surface drop-shadow-sm leading-tight w-full py-1 break-words">
                            {greeting}, {displayName}
                        </h1>
                        <p className="text-sm font-medium text-on-surface-variant italic mt-1 hidden sm:block">
                            {dailyQuote.text} {dailyQuote.subtext}
                        </p>
                        <div className="flex items-center gap-3 mt-2 sm:mt-1.5 flex-wrap">
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setOffsetDays(Math.max(offsetDays - 1, -14))}
                                disabled={offsetDays <= -14}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-surface-container-high dark:hover:bg-surface-container-high disabled:opacity-30 transition-colors text-on-surface-variant dark:text-on-surface-variant"
                            >
                                <ChevronLeft size={12} />
                            </button>
                            <p className="text-xs text-on-surface-variant dark:text-on-surface-variant font-bold whitespace-nowrap select-none">
                                {isToday ? t('nav.today') : ''}{dateStr || 'Loading...'}
                            </p>
                            <button 
                                onClick={() => setOffsetDays(Math.min(offsetDays + 1, 0))}
                                disabled={isToday}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-surface-container-high dark:hover:bg-surface-container-high disabled:opacity-30 transition-colors text-on-surface-variant dark:text-on-surface-variant"
                            >
                                <ChevronRight size={12} />
                            </button>
                            </div>
                            
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="relative">
                        <button
                            onClick={() => setShowCommandCenter(true)}
                            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors relative"
                        >
                            <Bell size={18} />
                            {/* You could fetch a quick unread count here if needed */}
                        </button>
                        
                        <CommandCenterOverlay 
                            isOpen={showCommandCenter} 
                            onClose={() => setShowCommandCenter(false)} 
                        />
                    </div>
                    
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