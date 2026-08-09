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
    { text: '"Amateurs sit and wait for inspiration, the rest of us just get up and go to work."', subtext: "— Stephen King" },
    { text: '"Don\'t stop when you\'re tired. Stop when you\'re done."', subtext: "— David Goggins" },
    { text: '"Arrogance breeds complacency and complacency breeds failure."', subtext: "— Andrew Tate" },
    { text: '"You are exactly where you deserve to be. Change your actions, change your life."', subtext: "— Andrew Tate" },
    { text: '"Discipline is doing what you hate to do, but doing it like you love it."', subtext: "— Mike Tyson" },
    { text: '"The only difference between you and the person you want to be is the work you aren\'t doing."', subtext: "— Unknown" },
    { text: '"If you want to be a master, you have to spend more time on the mat than anyone else."', subtext: "— Andrew Tate" },
    { text: '"Suffering is a test. That\'s all it is. Suffering is the true test of life."', subtext: "— David Goggins" },
    { text: '"Do not pray for an easy life, pray for the strength to endure a difficult one."', subtext: "— Bruce Lee" },
    { text: '"A man without a vision for his future always returns to his past."', subtext: "— Unknown" },
    { text: '"You cannot escape the matrix if you act like everyone else inside it."', subtext: "— Andrew Tate" },
    { text: '"The arrogant man thinks he knows everything. The confident man knows he can learn anything."', subtext: "— Unknown" },
    { text: '"Most people are not willing to do what it takes to win. They just want the medal."', subtext: "— David Goggins" },
    { text: '"You are either building your own dream, or someone else is paying you to build theirs."', subtext: "— Andrew Tate" },
    { text: '"No one is coming to save you. You have to save yourself."', subtext: "— Unknown" },
    { text: '"I hated every minute of training, but I said, \'Don\'t quit. Suffer now and live the rest of your life as a champion.\'"', subtext: "— Muhammad Ali" },
    { text: '"Your mind is a weapon. Keep it loaded."', subtext: "— Unknown" },
    { text: '"You must construct your own world, or you will perish in the one constructed for you."', subtext: "— Andrew Tate" },
    { text: '"There is no limit to what you can achieve if you are willing to outwork everyone."', subtext: "— Unknown" },
    { text: '"Pain is temporary. Quitting lasts forever."', subtext: "— Lance Armstrong" },
    { text: '"You have to be willing to suffer if you want to be great. There is no other way."', subtext: "— David Goggins" },
    { text: '"The universe rewards calculated risk and passion. It punishes laziness and fear."', subtext: "— Andrew Tate" },
    { text: '"Outwork your self-doubt."', subtext: "— Unknown" },
    { text: '"Success is the sum of small efforts, repeated day-in and day-out."', subtext: "— Robert Collier" },
    { text: '"If you are not where you want to be in life, it is because you have not worked hard enough."', subtext: "— Andrew Tate" },
    { text: '"A comfort zone is a beautiful place, but nothing ever grows there."', subtext: "— Unknown" },
    { text: '"The only way to achieve the impossible is to believe it is possible, and then work until it is."', subtext: "— Unknown" },
    { text: '"Speed is extremely important in business. The faster you move, the more you learn."', subtext: "— Andrew Tate" },
    { text: '"Embrace the suck."', subtext: "— Navy SEALs" },
    { text: '"You don\'t get what you wish for, you get what you work for."', subtext: "— Unknown" }
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