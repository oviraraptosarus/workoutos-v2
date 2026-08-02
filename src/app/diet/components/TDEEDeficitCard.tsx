'use client';

import React from 'react';
import { TrendingDown, Flame, Zap, Award, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
    const netCaloriesIn = Math.max(0, totalCalories - activityBurned);
    const deficitOrSurplus = netCaloriesIn - tdeeGoal; // Negative = Deficit, Positive = Surplus
    const isDeficit = deficitOrSurplus <= 0;
    const absoluteDiff = Math.abs(deficitOrSurplus);

    // 1 kg of fat ≈ 7700 kcal -> Weekly pace calculation
    const weeklyPaceKg = ((absoluteDiff * 7) / 7700).toFixed(2);

    return (
        <div className="bg-card-white backdrop-blur-xl border border-surface-variant p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-2xl bg-white/10 text-activity-purple border border-white/20/20 shadow-sm">
                        <TrendingDown size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-on-surface drop-shadow-sm">
                            TDEE & Net Energy Balance
                        </h3>
                        <p className="text-[11px] font-bold text-on-surface-variant dark:text-on-surface-variant dark:text-on-surface-variant">
                            Real-time caloric deficit & weekly weight velocity
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div
                    className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm border flex items-center gap-1.5 ${
                        isDeficit
                            ? 'bg-white text-black border-white/20'
                            : 'bg-white text-black border-white/20'
                    }`}
                >
                    <Flame size={14} />
                    <span>{isDeficit ? `-${absoluteDiff} kcal Deficit` : `+${absoluteDiff} kcal Surplus`}</span>
                </div>
            </div>

            {/* Metrics Breakdown Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-2 text-center p-3 rounded-2xl bg-surface-container border border-surface-variant shadow-inner mb-4">
                <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Maintenance (TDEE)</span>
                    <span className="text-sm font-bold text-on-surface dark:text-white">{tdeeGoal} kcal</span>
                </div>
                <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Food Consumed</span>
                    <span className="text-sm font-bold text-on-surface">{totalCalories} kcal</span>
                </div>
                <div 
                    className="cursor-pointer group relative"
                    onClick={onOpenActivityModal}
                    title="Click to log steps/activity"
                >
                    <span className="text-[10px] font-bold text-activity-purple group-hover:text-activity-purple uppercase tracking-wider block transition-colors">Active Burn</span>
                    <span className="text-sm font-bold text-activity-purple group-hover:text-purple-800 transition-colors">{activityBurned > 0 ? `-${activityBurned}` : '0'} kcal</span>
                    <div className="absolute -top-1 -right-1 bg-purple-100 text-activity-purple rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Zap size={10} />
                    </div>
                </div>
                <div>
                    <span className="text-[10px] font-bold text-activity-green uppercase tracking-wider block">Weekly Velocity</span>
                    <span className="text-sm font-bold text-activity-green">
                        {isDeficit ? `-${weeklyPaceKg} kg/wk` : `+${weeklyPaceKg} kg/wk`}
                    </span>
                </div>
            </div>

            {/* Visual Gauge Bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-on-surface-variant dark:text-on-surface-variant">
                    <span>Net Energy Intake ({netCaloriesIn} kcal)</span>
                    <span>TDEE Limit ({tdeeGoal} kcal)</span>
                </div>
                <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden shadow-inner border border-surface-variant ">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${
                            isDeficit
                                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                : 'bg-gradient-to-r from-amber-400 to-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, (netCaloriesIn / tdeeGoal) * 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
