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
        <div className="bg-card-white border border-surface-variant rounded-3xl p-5 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20/20 shadow-sm relative overflow-hidden flex-shrink-0">
                    <div 
                        className="absolute bottom-0 left-0 right-0 bg-blue-400/30 transition-all duration-700 ease-out"
                        style={{ height: `${percentage}%` }}
                    />
                    <Droplet size={26} className="text-white relative z-10 drop-shadow-sm" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-on-surface drop-shadow-sm">{t('diet.water.title')}</h3>
                        {percentage >= 100 && (
                            <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                <Check size={12} strokeWidth={3} /> Goal Met!
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-on-surface-variant font-bold mt-0.5">
                        {waterMl} ml / {goal} ml consumed ({percentage}%)
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex-1 md:w-36 bg-surface-container h-2.5 rounded-full overflow-hidden shadow-inner border border-surface-variant ">
                    <div 
                        className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(96,165,250,0.6)]" 
                        style={{ width: `${percentage}%` }} 
                    />
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                        id="tour-add-water"
                        onClick={() => addWater(250)}
                        className="flex items-center gap-1 bg-white hover:bg-white text-black px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm border border-white/20 btn-press relative z-[110]"
                        title="Add 1 Glass (250 ml)"
                    >
                        <Plus size={14} /> 250ml
                    </button>
                    <button
                        onClick={() => addWater(500)}
                        className="flex items-center gap-1 bg-white hover:bg-zinc-200 text-black px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm border border-white/20 btn-press"
                        title="Add 1 Bottle (500 ml)"
                    >
                        <Plus size={14} /> 500ml
                    </button>
                    <button
                        onClick={resetWater}
                        className="p-1.5 rounded-xl hover:bg-white/5 text-on-surface-variant hover:text-white transition-colors btn-press"
                        title="Reset water intake"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
