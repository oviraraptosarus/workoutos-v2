'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function RecentActivity() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [activities, setActivities] = useState<any[]>([]);
    const [isClearing, setIsClearing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadActivities = async () => {
            if (!user) return;
            setLoading(true);
            const allActs: any[] = [];
            const now = Date.now();
            const dateKey = new Date().toISOString().split('T')[0];

            try {
                // Fetch workouts
                const { data: workouts } = await supabase.from('workout_logs').select('id, name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3);
                if (workouts) {
                    workouts.forEach((w: any) => allActs.push({ id: w.created_at, title: `Completed ${w.name || 'Workout'}`, time: new Date(w.created_at).getTime(), icon: '🏋️‍♂️' }));
                }

                // Fetch meals
                const { data: meals } = await supabase.from('meal_entries').select('id, name, created_at').eq('user_id', user.id).eq('date', dateKey).order('created_at', { ascending: false }).limit(3);
                if (meals) {
                    meals.forEach((m: any) => allActs.push({ id: m.created_at, title: `Logged ${m.name}`, time: new Date(m.created_at).getTime(), icon: '🍽️' }));
                }

                // Fetch expenses
                const { data: expenses } = await supabase.from('expenses').select('id, description, amount, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3);
                if (expenses) {
                    expenses.forEach((e: any) => allActs.push({ id: e.created_at, title: `Spent $${e.amount} on ${e.description}`, time: new Date(e.created_at).getTime(), icon: '🛒' }));
                }

                allActs.sort((a, b) => b.time - a.time);
                
                // Format times
                const formatted = allActs.slice(0, 3).map(act => {
                    const diffMs = now - act.time;
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHrs = Math.floor(diffMins / 60);
                    const diffDays = Math.floor(diffHrs / 24);
                    
                    let timeStr = 'Just now';
                    if (diffDays > 0) timeStr = `${diffDays}d ago`;
                    else if (diffHrs > 0) timeStr = `${diffHrs}h ago`;
                    else if (diffMins > 0) timeStr = `${diffMins}m ago`;

                    return { ...act, time: timeStr };
                });

                setActivities(formatted);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        
        loadActivities();
        // Optional: subscribe to real-time changes
    }, [user]);

    const handleClear = async () => {
        setIsClearing(true);
        // Note: For a real app, clearing activity might mean dismissing them from the UI
        // We will just clear the local state here as we don't want to delete DB records
        setTimeout(() => {
            setActivities([]);
            setIsClearing(false);
        }, 300);
    };

    if (loading) return (
        <section className="bg-card-white dark:bg-surface-container-lowest rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/5 flex flex-col transition-all">
            <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2 mb-3">
                <Loader2 size={16} className="text-primary animate-spin" /> {t('recentActivity.title', { fallback: 'Recent Activity' })}
            </h2>
        </section>
    );

    return (
        <section className={`bg-card-white dark:bg-surface-container-lowest rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/5 flex flex-col transition-all ${isClearing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="flex items-center justify-between mb-3">
                <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                    <span className="text-lg">⚡</span> {t('recentActivity.title', { fallback: 'Recent Activity' })}
                </h2>
                
                {activities.length > 0 && (
                    <button 
                        onClick={handleClear}
                        className="font-label-sm text-label-sm text-on-surface-variant hover:text-error flex items-center transition-colors gap-1 active:scale-95"
                    >
                        {t('recentActivity.clear')} <Trash2 size={12} />
                    </button>
                )}
            </div>

            <div className="space-y-0 relative">
                {activities.length === 0 ? (
                    <div className="py-2 text-on-surface-variant text-sm italic">
                        {t('recentActivity.empty', { fallback: 'No recent activity recorded yet.' })}
                    </div>
                ) : (
                    activities.map((act, i) => (
                        <div key={act.id + i} className="flex items-start gap-3 relative py-3 group">
                            {/* Timeline line */}
                            {i < activities.length - 1 && (
                                <div className="absolute left-[13px] top-8 bottom-[-12px] w-0.5 bg-surface-variant/50 group-hover:bg-primary/20 transition-colors"></div>
                            )}
                            
                            <div className="w-7 h-7 rounded-full bg-surface-container-low border border-surface-variant flex items-center justify-center flex-shrink-0 z-10 shadow-sm text-xs">
                                {act.icon}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-on-surface leading-tight">{act.title}</p>
                                <p className="text-[11px] font-medium text-on-surface-variant mt-0.5 uppercase tracking-wide opacity-80">{act.time}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
