'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Flame, Settings2, X, Check } from 'lucide-react';
import { MacroGoals } from '../types';

interface MacroRingsProps {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalSugar: number;
    totalFiber: number;
    macroGoals?: MacroGoals;
    onUpdateGoals?: (goals: MacroGoals) => void;
}

export default function MacroRings({
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    totalSugar,
    totalFiber,
    macroGoals = { calories: 2200, protein: 140, carbs: 220, fat: 65, sugar: 35, fiber: 25 },
    onUpdateGoals,
}: MacroRingsProps) {
    const { userProfile } = useAuth();
    const { t } = useLanguage();
    
    const [isEditingGoals, setIsEditingGoals] = useState(false);
    const [tempGoals, setTempGoals] = useState<MacroGoals>(macroGoals);

    const calorieGoal = macroGoals.calories || userProfile?.calorieGoal || 2200;
    const caloriesLeft = Math.max(0, calorieGoal - totalCalories);

    const macros = [
        { name: t('diet.macro.protein'), eaten: totalProtein, goal: macroGoals.protein || 140, color: 'from-blue-400 to-blue-500', unit: 'g' },
        { name: t('diet.macro.carbs'), eaten: totalCarbs, goal: macroGoals.carbs || 220, color: 'from-orange-400 to-orange-500', unit: 'g' },
        { name: t('diet.macro.fat'), eaten: totalFat, goal: macroGoals.fat || 65, color: 'from-rose-400 to-rose-500', unit: 'g' },
        { name: t('diet.macro.sugar'), eaten: totalSugar, goal: macroGoals.sugar || 35, color: 'from-amber-400 to-amber-500', unit: 'g' },
        { name: 'Fiber', eaten: totalFiber, goal: macroGoals.fiber || 25, color: 'from-emerald-400 to-emerald-500', unit: 'g' },
    ];

    const progressPercentage = Math.min(100, (totalCalories / calorieGoal) * 100);

    const handleSaveGoals = (e: React.FormEvent) => {
        e.preventDefault();
        if (onUpdateGoals) {
            onUpdateGoals(tempGoals);
        }
        setIsEditingGoals(false);
    };

    return (
        <div className="bg-surface-container/30 backdrop-blur-3xl border border-white/10 dark:border-white/5 p-6 rounded-[32px] shadow-[0_20px_40px_rgb(0,0,0,0.06)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.3)] transition-all relative overflow-hidden group/macro hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]">
            
            {/* Top Right Goal Customize Button */}
            {onUpdateGoals && (
                <button
                    onClick={() => {
                        setTempGoals(macroGoals);
                        setIsEditingGoals(true);
                    }}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-on-surface-variant hover:text-on-surface transition-all z-10"
                    title={t('diet.macro.customize')}
                >
                    <Settings2 size={16} />
                </button>
            )}

            <div className="flex flex-col md:flex-row gap-8 items-center">
                
                {/* Circular Gauge */}
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="relative w-48 h-48 rounded-full border border-white/10 bg-surface-container-low flex items-center justify-center shadow-inner">
                        {/* Custom SVG gauge replacing the CSS clip-path which is blocky */}
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                            <circle
                                cx="80"
                                cy="80"
                                r="72"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-surface-variant/30"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r="72"
                                fill="none"
                                stroke="var(--color-primary, #3b82f6)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 72}
                                strokeDashoffset={(2 * Math.PI * 72) - ((progressPercentage / 100) * (2 * Math.PI * 72))}
                                className="transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                            />
                        </svg>

                        <div className="flex flex-col items-center relative z-10">
                            <Flame size={20} strokeWidth={2.5} className="text-primary mb-2" />
                            <span className="text-5xl font-semibold tracking-tighter text-on-surface tabular-nums leading-none mb-1">{caloriesLeft}</span>
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{t('diet.macro.kcalLeft')}</span>
                        </div>
                    </div>
                </div>

                {/* Macro Segmented Bars */}
                <div className="flex-1 w-full space-y-5">
                    <h3 className="text-sm font-semibold tracking-tight text-on-surface mb-2">Macro Distribution</h3>
                    {macros.map(m => {
                        const percent = m.goal > 0 ? Math.min(100, Math.round((m.eaten / m.goal) * 100)) : (m.eaten > 0 ? 100 : 0);
                        return (
                            <div key={m.name} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{m.name}</span>
                                    <span className="text-sm font-semibold text-on-surface tabular-nums">
                                        {m.eaten}<span className="text-on-surface-variant font-medium text-xs"> / {m.goal}{m.unit}</span>
                                    </span>
                                </div>
                                <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden border border-white/5 relative">
                                    <div 
                                        className={`absolute top-0 left-0 bg-gradient-to-r ${m.color} h-full rounded-full transition-all duration-1000 ease-out`} 
                                        style={{ width: `${percent}%` }} 
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Goal Customization Modal */}
            {isEditingGoals && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card-white rounded-2xl w-full max-w-sm p-4 sm:p-5 shadow-2xl border border-surface-variant space-y-4">
                        <div className="flex items-center justify-between border-b border-surface-variant pb-3">
                            <h3 className="text-base font-bold text-on-surface dark:text-white">Set Target Goals</h3>
                            <button
                                onClick={() => setIsEditingGoals(false)}
                                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant dark:text-on-surface-variant"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveGoals} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant mb-1">Calorie Target (kcal)</label>
                                <input
                                    type="number"
                                    value={tempGoals.calories}
                                    onChange={(e) => setTempGoals({ ...tempGoals, calories: Number(e.target.value) })}
                                    className="w-full bg-surface-container-low border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-white mb-1">Protein (g)</label>
                                    <input
                                        type="number"
                                        value={tempGoals.protein}
                                        onChange={(e) => setTempGoals({ ...tempGoals, protein: Number(e.target.value) })}
                                        className="w-full bg-white/5/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-white mb-1">Carbs (g)</label>
                                    <input
                                        type="number"
                                        value={tempGoals.carbs}
                                        onChange={(e) => setTempGoals({ ...tempGoals, carbs: Number(e.target.value) })}
                                        className="w-full bg-white/5/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-white mb-1">Fat (g)</label>
                                    <input
                                        type="number"
                                        value={tempGoals.fat}
                                        onChange={(e) => setTempGoals({ ...tempGoals, fat: Number(e.target.value) })}
                                        className="w-full bg-white/5/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-white mb-1">Sugar (g)</label>
                                    <input
                                        type="number"
                                        value={tempGoals.sugar}
                                        onChange={(e) => setTempGoals({ ...tempGoals, sugar: Number(e.target.value) })}
                                        className="w-full bg-white/5/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-white mb-1">Fiber (g)</label>
                                    <input
                                        type="number"
                                        value={tempGoals.fiber}
                                        onChange={(e) => setTempGoals({ ...tempGoals, fiber: Number(e.target.value) })}
                                        className="w-full bg-white/5/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditingGoals(false)}
                                    className="flex-1 flex items-center justify-center gap-1 bg-surface-container-high hover:bg-surface-container text-on-surface-variant text-xs font-bold py-2 rounded-xl transition-colors btn-press"
                                >
                                    <X size={14} />
                                    {t('diet.macro.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 flex items-center justify-center gap-1 bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold py-2 rounded-xl transition-colors shadow-sm btn-press"
                                >
                                    <Check size={14} />
                                    {t('diet.macro.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
