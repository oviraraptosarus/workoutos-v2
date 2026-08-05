'use client';

import React from 'react';
import { TrendingDown, Flame, Zap, Award, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface TDEEDeficitCardProps {
    totalCalories: number;
    activityBurned?: number;
    tdeeGoal?: number;
    onOpenActivityModal?: () => void;
}

export default function TDEEDeficitCard({
    totalCalories,
    activityBurned = 0,
    tdeeGoal = 2400,
    onOpenActivityModal,
}: TDEEDeficitCardProps) {
    const { t } = useLanguage();
    const netCaloriesIn = Math.max(0, totalCalories - activityBurned);
    const deficitOrSurplus = netCaloriesIn - tdeeGoal; // Negative = Deficit, Positive = Surplus
    const isDeficit = deficitOrSurplus <= 0;
    const absoluteDiff = Math.abs(deficitOrSurplus);

    // 1 kg of fat ≈ 7700 kcal -> Weekly pace calculation
    const weeklyPaceKg = ((absoluteDiff * 7) / 7700).toFixed(2);
    
    // Calculate progress for the multi-segment bar
    const maxBarValue = Math.max(tdeeGoal, totalCalories);
    const consumedPercent = (totalCalories / maxBarValue) * 100;
    const netPercent = (netCaloriesIn / maxBarValue) * 100;

    return (
        <div className="bg-surface-container/30 backdrop-blur-3xl border border-white/10 dark:border-white/5 p-6 rounded-[32px] shadow-[0_20px_40px_rgb(0,0,0,0.06)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.3)] transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] relative overflow-hidden">
            
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                        <TrendingDown size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-on-surface tracking-tight">
                            Metabolic Velocity
                        </h3>
                        <p className="text-xs font-medium text-on-surface-variant">
                            Real-time energy balance & weekly projection
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        isDeficit
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                    }`}
                >
                    <Flame size={14} />
                    <span>{isDeficit ? `Deficit` : `Surplus`}</span>
                </div>
            </div>

            {/* Hero Stat: Weekly Velocity */}
            <div className="mb-8">
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-semibold tracking-tighter text-on-surface tabular-nums">
                        {isDeficit ? `-${weeklyPaceKg}` : `+${weeklyPaceKg}`}
                    </span>
                    <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">kg/wk</span>
                </div>
                <p className="text-sm text-on-surface-variant font-medium mt-1">
                    Projected weekly weight {isDeficit ? 'loss' : 'gain'} based on today's deficit of <strong className="text-on-surface">{absoluteDiff} kcal</strong>.
                </p>
            </div>

            {/* Segmented Energy Bar */}
            <div className="space-y-3 mb-8">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    <span>Net Intake: <span className="text-on-surface">{netCaloriesIn}</span></span>
                    <span>TDEE: <span className="text-on-surface">{tdeeGoal}</span></span>
                </div>
                
                <div className="relative w-full h-4 bg-surface-container-high rounded-full overflow-hidden border border-white/5">
                    {/* Consumed Bar (Background) */}
                    <div
                        className="absolute top-0 left-0 h-full bg-surface-variant/80 transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, consumedPercent)}%` }}
                    />
                    
                    {/* Net Bar (Foreground - Overlaps Consumed, showing active burn diff) */}
                    <div
                        className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(0,0,0,0.2)] ${isDeficit ? 'bg-primary' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, netPercent)}%` }}
                    />
                    
                    {/* TDEE Goal Marker */}
                    <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)] z-10"
                        style={{ left: `${(tdeeGoal / maxBarValue) * 100}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] font-medium text-on-surface-variant">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Net Energy</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-surface-variant" /> Active Burn Offset</span>
                </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface-container/50 rounded-2xl p-4 border border-white/5 text-center">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Consumed</span>
                    <span className="text-lg font-semibold text-on-surface tabular-nums">{totalCalories}</span>
                </div>
                <div 
                    className="bg-surface-container/50 rounded-2xl p-4 border border-white/5 text-center cursor-pointer hover:bg-surface-container transition-colors group relative"
                    onClick={onOpenActivityModal}
                >
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1 group-hover:text-primary transition-colors">Burned</span>
                    <span className="text-lg font-semibold text-on-surface tabular-nums group-hover:text-primary transition-colors">{activityBurned > 0 ? `-${activityBurned}` : '0'}</span>
                    <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg scale-75">
                        <Zap size={14} />
                    </div>
                </div>
                <div className="bg-surface-container/50 rounded-2xl p-4 border border-white/5 text-center">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Deficit</span>
                    <span className="text-lg font-semibold text-on-surface tabular-nums">{absoluteDiff}</span>
                </div>
            </div>
        </div>
    );
}
