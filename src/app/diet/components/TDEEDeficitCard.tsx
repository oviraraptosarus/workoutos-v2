'use client';

import React from 'react';
import { TrendingDown, Flame, Zap, Award, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TDEEDeficitCardProps {
    totalCalories: number;
    activityBurned?: number;
    tdeeGoal?: number;
}

export default function TDEEDeficitCard({
    totalCalories,
    activityBurned = 180,
    tdeeGoal = 2400,
}: TDEEDeficitCardProps) {
    const netCaloriesIn = Math.max(0, totalCalories - activityBurned);
    const deficitOrSurplus = netCaloriesIn - tdeeGoal; // Negative = Deficit, Positive = Surplus
    const isDeficit = deficitOrSurplus <= 0;
    const absoluteDiff = Math.abs(deficitOrSurplus);

    // 1 kg of fat ≈ 7700 kcal -> Weekly pace calculation
    const weeklyPaceKg = ((absoluteDiff * 7) / 7700).toFixed(2);

    return (
        <div className="bg-white border border-gray-100 border-gray-200 rounded-3xl p-5 shadow-sm transition-all bg-gradient-to-br from-white/80 via-purple-50/20 to-indigo-50/30 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-2xl bg-purple-500/10 text-purple-600 border border-purple-500/20 shadow-sm">
                        <TrendingDown size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 drop-shadow-sm">
                            TDEE & Net Energy Balance
                        </h3>
                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500">
                            Real-time caloric deficit & weekly weight velocity
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div
                    className={`px-3 py-1 rounded-full text-xs font-black shadow-sm border flex items-center gap-1.5 ${
                        isDeficit
                            ? 'bg-emerald-500 text-white border-emerald-400'
                            : 'bg-amber-500 text-white border-amber-400'
                    }`}
                >
                    <Flame size={14} />
                    <span>{isDeficit ? `-${absoluteDiff} kcal Deficit` : `+${absoluteDiff} kcal Surplus`}</span>
                </div>
            </div>

            {/* Metrics Breakdown Bar */}
            <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-2xl bg-gray-100 border border-gray-200 shadow-inner mb-4">
                <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Maintenance (TDEE)</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">{tdeeGoal} kcal</span>
                </div>
                <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Food Consumed</span>
                    <span className="text-sm font-black text-stone-900">{totalCalories} kcal</span>
                </div>
                <div>
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider block">Active Burn</span>
                    <span className="text-sm font-black text-purple-700">-{activityBurned} kcal</span>
                </div>
                <div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">Weekly Velocity</span>
                    <span className="text-sm font-black text-emerald-700">
                        {isDeficit ? `-${weeklyPaceKg} kg/wk` : `+${weeklyPaceKg} kg/wk`}
                    </span>
                </div>
            </div>

            {/* Visual Gauge Bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300">
                    <span>Net Energy Intake ({netCaloriesIn} kcal)</span>
                    <span>TDEE Limit ({tdeeGoal} kcal)</span>
                </div>
                <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden shadow-inner border border-gray-100 dark:border-slate-800">
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
