'use client';

import React from 'react';
import { Flame, Target, Trophy } from 'lucide-react';
import { useDailySnapshot } from '@/hooks/useDailySnapshot';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';

export default function BurnGoalTracker() {
    const { snapshot } = useDailySnapshot();
    const { user } = useAuth();
    const { selectedDate } = useDate();
    const current = snapshot.burnProgress.current || 0;
    const target = snapshot.burnProgress.target || 500;
    
    // Ensure we don't divide by zero
    const displayTarget = target > 0 ? target : 500;
    const percentage = Math.min(100, Math.round((current / displayTarget) * 100));
    const isCompleted = current >= displayTarget;
    const isRestDay = snapshot.isRestDay;

    const toggleRestDay = async () => {
        if (!user) return;
        const dateKey = selectedDate || new Date().toLocaleDateString('en-CA');
        await supabase.from('daily_logs').upsert(
            { user_id: user.id, date: dateKey, is_rest_day: !isRestDay },
            { onConflict: 'user_id,date' }
        );
        window.dispatchEvent(new Event('workout_os_activity_updated'));
        window.dispatchEvent(new Event('workout_os_refresh'));
    };

    // SVG Circle Math
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="glass-card-premium p-5  animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-on-surface flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                        <Flame size={16} />
                    </div>
                    Daily Burn Goal
                </h3>
                <div className="flex items-center gap-2">
                    {isCompleted && !isRestDay && (
                        <span className="text-[10px] font-bold text-on-tertiary bg-tertiary px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Trophy size={12} /> Goal Met
                        </span>
                    )}
                    {isRestDay && (
                        <span className="text-[10px] font-bold text-white bg-blue-500 px-2 py-1 rounded-full uppercase tracking-wider">
                            Rest Day
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Progress Ring */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                    {/* Background track */}
                    <svg className="w-full h-full transform -rotate-90 absolute top-0 left-0">
                        <circle
                            cx="56"
                            cy="56"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-surface-variant"
                        />
                        {/* Progress */}
                        <circle
                            cx="56"
                            cy="56"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className={`${isRestDay ? 'text-blue-500' : 'text-tertiary'} transition-all duration-1000 ease-out`}
                        />
                    </svg>
                    
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-on-surface leading-none">{percentage}%</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex-1 space-y-4">
                    <div>
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Burned Today</span>
                        <span className={`text-2xl font-black ${isRestDay ? 'text-blue-500' : 'text-tertiary'} flex items-center gap-1`}>
                            {current} <span className="text-base text-on-surface-variant font-bold">kcal</span>
                        </span>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1 flex items-center gap-1">
                            <Target size={12} /> Target
                        </span>
                        <span className="text-lg font-bold text-on-surface">{displayTarget} kcal</span>
                    </div>
                </div>
            </div>
            
            {!isCompleted && current > 0 && !isRestDay && (
                <div className="mt-4 pt-4 border-t border-surface-variant">
                    <p className="text-xs font-bold text-on-surface-variant">
                        Only <span className="text-on-surface font-black">{displayTarget - current} kcal</span> left to hit your daily goal. Keep pushing!
                    </p>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-surface-variant flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-on-surface">Mark as Rest Day</p>
                    <p className="text-xs text-on-surface-variant">Lower expectations to recover</p>
                </div>
                <button
                    onClick={toggleRestDay}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isRestDay ? 'bg-blue-500' : 'bg-surface-variant'
                    }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isRestDay ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>
        </div>
    );
}

