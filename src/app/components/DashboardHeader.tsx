'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, User, Bell } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';

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
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    
    const displayName = userProfile?.fullName ? userProfile.fullName.split(' ')[0] : (userProfile?.username || 'Friend');
    const initial = displayName.charAt(0).toUpperCase();

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            const now = new Date().toISOString();
            const { data } = await supabase
                .from('tasks')
                .select('id, title, reminder_time')
                .eq('user_id', user.id)
                .eq('notification_sent', false)
                .lte('reminder_time', now)
                .order('reminder_time', { ascending: false });
                
            if (data) setNotifications(data);
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    const markNotificationsRead = async () => {
        if (notifications.length === 0) return;
        const ids = notifications.map(n => n.id);
        await supabase.from('tasks').update({ notification_sent: true }).in('id', ids);
        setNotifications([]);
    };

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
    }, [t]);

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

                <div className="flex items-center gap-3 shrink-0">
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                if (!showNotifications && notifications.length > 0) {
                                    markNotificationsRead();
                                }
                            }}
                            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors relative"
                        >
                            <Bell size={18} />
                            {notifications.length > 0 && (
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-error rounded-full animate-pulse"></span>
                            )}
                        </button>
                        {showNotifications && (
                            <div className="absolute top-12 right-0 w-64 bg-card-white border border-surface-variant rounded-2xl shadow-xl p-4 z-[9999] animate-in slide-in-from-top-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">Notifications</h3>
                                {notifications.length > 0 ? (
                                    <div className="space-y-3">
                                        {notifications.map(n => (
                                            <div key={n.id} className="text-sm">
                                                <p className="font-bold text-on-surface">{n.title}</p>
                                                <p className="text-xs text-on-surface-variant">Reminder: {new Date(n.reminder_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-on-surface-variant text-center py-2">No new notifications</p>
                                )}
                            </div>
                        )}
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