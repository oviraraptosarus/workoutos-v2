'use client';

import React from 'react';
import { TrendingDown, Flame, Zap, Award, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWeeklyDeficitAggregation } from '../services/dietStorage';

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
    
    const [weeklyData, setWeeklyData] = React.useState<{ cumulativeDeficit: number, estimatedWeightLossKg: number, daysTracked: number } | null>(null);

    React.useEffect(() => {
        const fetchWeekly = async () => {
            const data = await getWeeklyDeficitAggregation();
            setWeeklyData(data);
        };
        fetchWeekly();
        
        // Refresh when diet changes
        window.addEventListener('workout_os_diet_updated', fetchWeekly);
        return () => window.removeEventListener('workout_os_diet_updated', fetchWeekly);
    }, []);
    const netCaloriesIn = Math.max(0, totalCalories - activityBurned);
    const deficitOrSurplus = netCaloriesIn - tdeeGoal; // Negative = Deficit, Positive = Surplus
    const isDeficit = deficitOrSurplus <= 0;
    const absoluteDiff = Math.abs(deficitOrSurplus);

    // 1 kg of fat ≈ 7700 kcal -> Weekly pace calculation
    const weeklyPaceKg = ((absoluteDiff * 7) / 7700).toFixed(2);

    return (
        <div className="bg-surface-container-lowest/80 backdrop-blur-2xl border border-white/10 dark:border-white/5 p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all relative overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-semibold text-on-surface tracking-tight mb-1">
                        Metabolic Velocity
                    </h3>
                    <p className="text-sm font-medium text-on-surface-variant">
                        Daily Energy Balance
                    </p>
                </div>

                <div className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 shadow-sm ${
                        isDeficit
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                    <Flame size={14} />
                    <span>{isDeficit ? `Deficit` : `Surplus`}</span>
                </div>
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-2 gap-8 mb-10">
                {/* Today's Pace */}
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-on-surface-variant tracking-[0.2em] uppercase mb-2">Today's Pace</span>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-5xl font-bold tracking-tighter ${isDeficit ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isDeficit ? '-' : '+'}{weeklyPaceKg}
                        </span>
                        <span className="text-sm font-semibold text-on-surface-variant tracking-widest uppercase">kg/wk</span>
                    </div>
                    <p className="text-xs text-on-surface-variant font-medium mt-2 leading-relaxed">
                        Based on today's {isDeficit ? 'deficit' : 'surplus'} of <strong className="text-on-surface">{absoluteDiff} kcal</strong>.
                    </p>
                </div>
                
                {/* Weekly Actual */}
                {weeklyData && (
                    <div className="flex flex-col pl-8 border-l border-surface-variant/20">
                        <span className="text-[10px] font-bold text-on-surface-variant tracking-[0.2em] uppercase mb-2">Actual This Week</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold tracking-tighter text-on-surface">
                                {weeklyData.cumulativeDeficit <= 0 ? '-' : '+'}{Math.abs(weeklyData.estimatedWeightLossKg).toFixed(2)}
                            </span>
                            <span className="text-xs font-semibold text-on-surface-variant tracking-widest uppercase">kg</span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-medium mt-2 leading-relaxed">
                            From a cumulative <strong className="text-on-surface">{Math.abs(weeklyData.cumulativeDeficit)} kcal</strong> {weeklyData.cumulativeDeficit <= 0 ? 'deficit' : 'surplus'} over {weeklyData.daysTracked} days.
                        </p>
                    </div>
                )}
            </div>

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
                    <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${isDeficit ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                        {isDeficit ? 'Deficit' : 'Surplus'}
                    </span>
                    <span className={`text-lg font-semibold tabular-nums ${isDeficit ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {absoluteDiff}
                    </span>
                </div>
            </div>
        </div>
    );
}
