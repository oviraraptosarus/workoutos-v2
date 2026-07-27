'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Flame, Settings2, X, Check } from 'lucide-react';
import { MacroGoals } from '../types';

interface MacroRingsProps {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalSugar: number;
    macroGoals?: MacroGoals;
    onUpdateGoals?: (goals: MacroGoals) => void;
}

export default function MacroRings({
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    totalSugar,
    macroGoals = { calories: 2200, protein: 140, carbs: 220, fat: 65, sugar: 35 },
    onUpdateGoals,
}: MacroRingsProps) {
    const { userProfile } = useAuth();
    
    const [isEditingGoals, setIsEditingGoals] = useState(false);
    const [tempGoals, setTempGoals] = useState<MacroGoals>(macroGoals);

    const calorieGoal = macroGoals.calories || userProfile?.calorieGoal || 2200;
    const caloriesLeft = Math.max(0, calorieGoal - totalCalories);

    const macros = [
        { name: 'Protein', eaten: totalProtein, goal: macroGoals.protein || 140, color: 'from-blue-400 to-blue-500', unit: 'g' },
        { name: 'Carbs', eaten: totalCarbs, goal: macroGoals.carbs || 220, color: 'from-orange-400 to-orange-500', unit: 'g' },
        { name: 'Fat', eaten: totalFat, goal: macroGoals.fat || 65, color: 'from-rose-400 to-rose-500', unit: 'g' },
        { name: 'Sugar', eaten: totalSugar, goal: macroGoals.sugar || 35, color: 'from-amber-400 to-amber-500', unit: 'g' },
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
        <div className="bg-white border border-gray-100 border-gray-200 rounded-3xl p-5 shadow-sm transition-all flex flex-col md:flex-row items-center gap-8 relative">
            
            {/* Top Right Goal Customize Button */}
            {onUpdateGoals && (
                <button
                    onClick={() => {
                        setTempGoals(macroGoals);
                        setIsEditingGoals(true);
                    }}
                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100/80 text-gray-400 hover:text-gray-700 transition-colors btn-press"
                    title="Customize Daily Macro Goals"
                >
                    <Settings2 size={16} />
                </button>
            )}

            {/* Circular Gauge */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="relative w-40 h-40 rounded-full border-8 border-gray-100 shadow-inner flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-8 border-transparent" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}>
                        <div 
                            className="absolute inset-0 rounded-full border-8 border-emerald-400 opacity-90 transition-all duration-1000"
                            style={{ clipPath: `inset(${Math.max(0, 100 - progressPercentage)}% 0 0 0)` }}
                        />
                    </div>
                    <div className="flex flex-col items-center">
                        <Flame size={24} className="text-emerald-500 mb-1" />
                        <span className="text-3xl font-black text-gray-900 drop-shadow-sm">{caloriesLeft}</span>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kcal Left</span>
                    </div>
                </div>
            </div>

            {/* Macro Bars */}
            <div className="flex-1 w-full space-y-3.5">
                {macros.map(m => {
                    const percent = Math.min(100, Math.round((m.eaten / m.goal) * 100));
                    return (
                        <div key={m.name} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300">
                                <span>{m.name}</span>
                                <span className="text-gray-900 drop-shadow-sm">{m.eaten}{m.unit} / {m.goal}{m.unit}</span>
                            </div>
                            <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden shadow-inner border border-gray-100 dark:border-slate-800">
                                <div 
                                    className={`bg-gradient-to-r ${m.color} h-full rounded-full transition-all duration-500 ease-out shadow-sm`} 
                                    style={{ width: `${percent}%` }} 
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Goal Customization Modal */}
            {isEditingGoals && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900 dark:text-white">Set Target Goals</h3>
                            <button
                                onClick={() => setIsEditingGoals(false)}
                                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 dark:text-gray-500"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveGoals} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Calorie Target (kcal)</label>
                                <input
                                    type="number"
                                    value={tempGoals.calories}
                                    onChange={(e) => setTempGoals({ ...tempGoals, calories: Number(e.target.value) })}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-blue-600 mb-1">Protein (g)</label>
                                    <input
                                        type="number"
                                        value={tempGoals.protein}
                                        onChange={(e) => setTempGoals({ ...tempGoals, protein: Number(e.target.value) })}
                                        className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-orange-600 mb-1">Carbs (g)</label>
                                    <input
                                        type="number"
                                        value={tempGoals.carbs}
                                        onChange={(e) => setTempGoals({ ...tempGoals, carbs: Number(e.target.value) })}
                                        className="w-full bg-orange-50/50 border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-rose-600 mb-1">Fat (g)</label>
                                    <input
                                        type="number"
                                        value={tempGoals.fat}
                                        onChange={(e) => setTempGoals({ ...tempGoals, fat: Number(e.target.value) })}
                                        className="w-full bg-rose-50/50 border border-rose-200 rounded-xl px-3 py-2 text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-amber-600 mb-1">Sugar (g)</label>
                                    <input
                                        type="number"
                                        value={tempGoals.sugar}
                                        onChange={(e) => setTempGoals({ ...tempGoals, sugar: Number(e.target.value) })}
                                        className="w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditingGoals(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md"
                                >
                                    Save Goals
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
