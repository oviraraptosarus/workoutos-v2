'use client';

import React, { useState, useEffect } from 'react';
import { Droplet, Plus, RefreshCw, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWaterForDate, saveWaterForDate } from '../services/dietStorage';

interface WaterTrackerProps {
    currentDateKey?: string;
}

export default function WaterTracker({ currentDateKey }: WaterTrackerProps) {
    const { userProfile } = useAuth();
    const { t } = useLanguage();
    
    const goal = userProfile?.waterGoalMl || 3000;
    const dateKey = currentDateKey || new Date().toISOString().slice(0, 10);
    const [waterMl, setWaterMl] = useState<number>(1200);

    // Sync water state whenever currentDateKey changes or events fire
    useEffect(() => {
        const load = async () => setWaterMl(await getWaterForDate(dateKey));
        load();
        
        window.addEventListener('workout_os_water_updated', load);
        window.addEventListener('storage', load);
        return () => {
            window.removeEventListener('workout_os_water_updated', load);
            window.removeEventListener('storage', load);
        };
    }, [dateKey]);

    const addWater = (amount: number) => {
        setWaterMl((prev) => {
            const next = Math.min(goal + 1000, prev + amount);
            saveWaterForDate(dateKey, next);
            return next;
        });
    };

    const resetWater = () => {
        if (confirm('Reset water intake for this date?')) {
            setWaterMl(0);
            saveWaterForDate(dateKey, 0);
        }
    };

    const percentage = Math.min(100, Math.round((waterMl / goal) * 100));

    return (
        <div className="bg-surface-container/30 backdrop-blur-3xl border border-white/10 dark:border-white/5 rounded-[32px] p-6 shadow-[0_20px_40px_rgb(0,0,0,0.06)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.3)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] group/water">
            <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center relative overflow-hidden flex-shrink-0 shadow-inner group-hover/water:border-blue-400/40 transition-colors">
                    <div 
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] opacity-80"
                        style={{ height: `${percentage}%` }}
                    />
                    <Droplet size={28} strokeWidth={2.5} className="text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold tracking-tight text-on-surface">Hydration Matrix</h3>
                        {percentage >= 100 && (
                            <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check size={12} strokeWidth={3} /> Optimal
                            </span>
                        )}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-semibold tracking-tighter text-on-surface tabular-nums">{waterMl}</span>
                        <span className="text-xs font-medium text-on-surface-variant">/ {goal} ml</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div className="w-full md:w-48 bg-surface-container-high h-2 rounded-full overflow-hidden border border-white/5 relative">
                    <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_12px_rgba(56,189,248,0.5)]" 
                        style={{ width: `${percentage}%` }} 
                    />
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto justify-between md:justify-start">
                    <button
                        id="tour-add-water"
                        onClick={() => addWater(250)}
                        className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-on-surface px-4 py-2 rounded-2xl text-xs font-semibold transition-all border border-white/10 active:scale-95"
                        title="Add 1 Glass (250 ml)"
                    >
                        <Plus size={16} /> 250ml
                    </button>
                    <button
                        onClick={() => addWater(500)}
                        className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-on-surface px-4 py-2 rounded-2xl text-xs font-semibold transition-all border border-white/10 active:scale-95"
                        title="Add 1 Bottle (500 ml)"
                    >
                        <Plus size={16} /> 500ml
                    </button>
                    <button
                        onClick={resetWater}
                        className="p-2.5 rounded-2xl hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 border border-transparent hover:border-red-500/20 transition-colors"
                        title="Reset water intake"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
