'use client';

import React, { useState } from 'react';
import { HeartPulse, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { MealItem } from '../types';

interface MicronutrientDrawerProps {
    meals: MealItem[];
}

export default function MicronutrientDrawer({ meals }: MicronutrientDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Calculate estimated micronutrients from logged meals
    const totalCalories = meals.reduce((a, b) => a + (b.calories || 0), 0);
    const estimatedFiber = Math.round((totalCalories / 100) * 1.6); // ~1.6g per 100 kcal
    const estimatedSodium = Math.round((totalCalories / 100) * 95); // ~95mg per 100 kcal
    const estimatedPotassium = Math.round((totalCalories / 100) * 140); // ~140mg per 100 kcal
    const estimatedIron = Math.round((totalCalories / 100) * 0.7); // ~0.7mg per 100 kcal

    const micros = [
        { name: 'Dietary Fiber', current: estimatedFiber, goal: 30, unit: 'g', color: 'bg-white' },
        { name: 'Sodium Intake', current: estimatedSodium, goal: 2300, unit: 'mg', color: 'bg-white', isLimit: true },
        { name: 'Potassium', current: estimatedPotassium, goal: 3500, unit: 'mg', color: 'bg-white' },
        { name: 'Iron', current: estimatedIron, goal: 18, unit: 'mg', color: 'bg-white' },
    ];

    return (
        <div className="bg-card-white border border-surface-variant rounded-2xl p-5 shadow-sm transition-all">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between cursor-pointer select-none"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-2xl bg-white/10 text-white border border-white/20/20 shadow-sm">
                        <HeartPulse size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-on-surface drop-shadow-sm">
                            Micronutrients & Health Targets
                        </h3>
                        <p className="text-[11px] font-bold text-on-surface-variant dark:text-on-surface-variant dark:text-on-surface-variant">
                            Fiber, sodium, potassium, and essential mineral targets
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant dark:text-on-surface-variant dark:text-on-surface-variant">
                    <span>{isOpen ? 'Collapse' : 'Expand Details'}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {isOpen && (
                <div className="mt-4 pt-4 border-t border-surface-variant/80 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
                    {micros.map((m) => {
                        const percent = Math.min(100, Math.round((m.current / m.goal) * 100));

                        return (
                            <div key={m.name} className="space-y-1.5 p-3 rounded-2xl bg-surface-container border border-surface-variant shadow-sm">
                                <div className="flex justify-between text-xs font-bold text-on-surface-variant dark:text-on-surface-variant">
                                    <span>{m.name}</span>
                                    <span className="text-on-surface tabular-nums">
                                        {m.current} {m.unit} / {m.goal} {m.unit}
                                    </span>
                                </div>
                                <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden shadow-inner border border-surface-variant ">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ease-out ${m.color}`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
