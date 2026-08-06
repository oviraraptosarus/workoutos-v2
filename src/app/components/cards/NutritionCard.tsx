'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';

interface MacroGoal {
    label: string;
    grams: number;
    goal: number;
    color: string;
}

export default function NutritionCard() {
    const { t } = useLanguage();
    const { userProfile } = useAuth();
    const { selectedDate, isToday } = useDate();
    const [currentCals, setCurrentCals] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [mealName, setMealName] = useState('');
    const [mealCals, setMealCals] = useState('');
    const [goalCals, setGoalCals] = useState(2600);
    const [macros, setMacros] = useState({ protein: 0, carbs: 0, fat: 0 });

    React.useEffect(() => {
        if (!selectedDate) return;
        const loadNutrition = async () => {
            const { getMealsForDate } = await import('@/app/diet/services/dietStorage');
            const meals = await getMealsForDate(selectedDate);
            setCurrentCals(meals.reduce((acc, m) => acc + (m.calories || 0), 0));
            setMacros({
                protein: meals.reduce((acc, m) => acc + (m.protein || 0), 0),
                carbs: meals.reduce((acc, m) => acc + (m.carbs || 0), 0),
                fat: meals.reduce((acc, m) => acc + (m.fat || 0), 0),
            });
            setLoaded(true);
        };

        const loadGoal = () => {
            if (userProfile?.calorieGoal) setGoalCals(userProfile.calorieGoal);
        };

        loadNutrition();
        loadGoal();

        window.addEventListener('storage', loadNutrition);
        window.addEventListener('workout_os_diet_updated', loadNutrition);
        return () => {
            window.removeEventListener('storage', loadNutrition);
            window.removeEventListener('workout_os_diet_updated', loadNutrition);
        };
    }, [selectedDate, isToday, userProfile]);

    const pct = Math.min(currentCals / goalCals, 1);
    const remaining = Math.max(goalCals - currentCals, 0);
    const over = currentCals > goalCals;

    // Ring geometry — centred in the card.
    const SIZE = 132;
    const R = 56;
    const C = 2 * Math.PI * R;

    // Macro targets follow a standard 30/40/30 split of the calorie goal
    // (4 kcal/g protein and carbs, 9 kcal/g fat).
    const macroGoals: MacroGoal[] = [
        { label: 'Protein', grams: macros.protein, goal: Math.round((goalCals * 0.3) / 4), color: 'bg-activity-green' },
        { label: 'Carbs', grams: macros.carbs, goal: Math.round((goalCals * 0.4) / 4), color: 'bg-activity-blue' },
        { label: 'Fats', grams: macros.fat, goal: Math.round((goalCals * 0.3) / 9), color: 'bg-[#f8b47b]' },
    ];

    const handleAddMeal = (e: React.FormEvent) => {
        e.preventDefault();
        const cals = Number(mealCals);
        if (!isNaN(cals) && cals > 0 && selectedDate) {
            import('@/app/diet/services/dietStorage').then(async ({ getMealsForDate, saveMealsForDate }) => {
                const meals = await getMealsForDate(selectedDate);
                meals.push({
                    id: Date.now().toString(),
                    name: mealName.trim() || 'Quick Log',
                    category: 'Snacks',
                    portion: '1 serving',
                    calories: cals,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    sugar: 0,
                    fiber: 0,
                    icon: '⚡'
                });
                await saveMealsForDate(selectedDate, meals);
                window.dispatchEvent(new Event('storage'));
                window.dispatchEvent(new Event('workout_os_diet_updated'));
                setIsLogging(false);
                setMealName('');
                setMealCals('');
            });
        }
    };

    return (
        <div className="bg-card-white dark:bg-surface-container-lowest rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/5 flex flex-col h-full relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">restaurant</span>
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Nutrition</span>
                </div>
                <Link href="/diet" aria-label="Nutrition details" className="text-on-surface-variant/50 active:scale-90 transition-transform">
                    <ChevronRight size={18} />
                </Link>
            </div>

            {isLogging ? (
                <form onSubmit={handleAddMeal} className="flex-1 flex flex-col gap-2 animate-fade-in">
                    <input
                        type="text"
                        placeholder="Meal name"
                        value={mealName}
                        onChange={(e) => setMealName(e.target.value)}
                        className="w-full bg-surface-container border-none rounded-2xl px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                        autoFocus
                    />
                    <div className="relative">
                        <input
                            type="number"
                            inputMode="numeric"
                            placeholder="Calories"
                            value={mealCals}
                            onChange={(e) => setMealCals(e.target.value)}
                            className="w-full bg-surface-container border-none rounded-2xl px-4 py-3 pr-14 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-sm text-label-sm text-on-surface-variant">kcal</span>
                    </div>
                    <div className="flex gap-2 mt-auto pt-1">
                        <button type="button" onClick={() => setIsLogging(false)} className="flex-1 bg-surface-container text-on-surface font-label-md text-label-md py-3 rounded-full active:scale-95 transition-transform">
                            Cancel
                        </button>
                        <button type="submit" disabled={!mealCals} className="flex-1 bg-primary text-on-primary font-label-md text-label-md py-3 rounded-full disabled:opacity-40 active:scale-95 transition-transform">
                            Save
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    {/* Centred calorie ring */}
                    <div className="flex flex-col items-center">
                        <div className="relative" style={{ width: SIZE, height: SIZE }}>
                            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" aria-hidden="true">
                                <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" strokeWidth="10" className="stroke-surface-container" />
                                <circle
                                    cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" strokeWidth="10" strokeLinecap="round"
                                    className={over ? 'stroke-activity-red' : 'stroke-on-tertiary-container'}
                                    strokeDasharray={C}
                                    strokeDashoffset={loaded ? C * (1 - pct) : C}
                                    style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.32,0.72,0,1)' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="font-display-lg text-headline-lg font-bold text-on-surface tabular-nums leading-none">
                                    {loaded ? currentCals.toLocaleString() : (
                                        <div className="h-8 w-16 bg-surface-variant/50 animate-pulse rounded-md inline-block"></div>
                                    )}
                                </span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                                    of {goalCals.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <p className="font-label-md text-label-md text-on-surface mt-2">
                            {over
                                ? `${(currentCals - goalCals).toLocaleString()} kcal over`
                                : remaining === 0 ? 'Goal met' : `${remaining.toLocaleString()} ${t('dash.kcalLeft')}`}
                        </p>

                        {isToday && (
                            <button
                                onClick={() => setIsLogging(true)}
                                className="mt-3 flex items-center gap-1.5 bg-primary text-on-primary font-label-md text-label-md px-5 py-2.5 rounded-full active:scale-95 transition-transform"
                            >
                                <Plus size={15} /> Log meal
                            </button>
                        )}
                    </div>

                    {/* Macro bars */}
                    <div className="mt-4 pt-4 border-t border-surface-variant space-y-2.5">
                        {macroGoals.map((m) => (
                            <div key={m.label} className="flex items-center gap-3">
                                <span className="w-14 font-label-sm text-label-sm text-on-surface-variant shrink-0">{m.label}</span>
                                <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${m.color}`}
                                        style={{
                                            width: loaded ? `${Math.min((m.grams / Math.max(m.goal, 1)) * 100, 100)}%` : '0%',
                                            transition: 'width 900ms cubic-bezier(0.32,0.72,0,1)',
                                        }}
                                    />
                                </div>
                                <span className="w-16 text-right font-label-sm text-label-sm text-on-surface tabular-nums shrink-0">
                                    {Math.round(m.grams)}/{m.goal}g
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
