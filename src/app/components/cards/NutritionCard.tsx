'use client';

import React, { useState } from 'react';
import { Utensils, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';

export default function NutritionCard() {
    const { userProfile } = useAuth();
    const { selectedDate, isToday } = useDate();
    const [currentCals, setCurrentCals] = useState(0);
    const [isLogging, setIsLogging] = useState(false);
    const [mealName, setMealName] = useState('');
    const [mealCals, setMealCals] = useState('');
    const [goalCals, setGoalCals] = useState(2600);
    const [macros, setMacros] = useState({ protein: 0, carbs: 0, fat: 0 });

    React.useEffect(() => {
        if (!selectedDate) return;
        const loadNutrition = async () => {
            import('@/app/diet/services/dietStorage').then(async ({ getMealsForDate }) => {
                const meals = await getMealsForDate(selectedDate);
                const totalCals = meals.reduce((acc, m) => acc + (m.calories || 0), 0);
                const totalP = meals.reduce((acc, m) => acc + (m.protein || 0), 0);
                const totalC = meals.reduce((acc, m) => acc + (m.carbs || 0), 0);
                const totalF = meals.reduce((acc, m) => acc + (m.fat || 0), 0);
                setCurrentCals(totalCals);
                setMacros({ protein: totalP, carbs: totalC, fat: totalF });
            });
        };

        const loadGoal = () => {
            const savedGoal = localStorage.getItem('workout_os_calorie_goal');
            if (savedGoal) setGoalCals(parseInt(savedGoal, 10));
            else if (userProfile?.calorieGoal) setGoalCals(userProfile.calorieGoal);
        };
        
        loadNutrition();
        loadGoal();
        
        window.addEventListener('storage', loadNutrition);
        window.addEventListener('workout_os_diet_updated', loadNutrition);
        window.addEventListener('storage', loadGoal);
        return () => {
            window.removeEventListener('storage', loadNutrition);
            window.removeEventListener('workout_os_diet_updated', loadNutrition);
            window.removeEventListener('storage', loadGoal);
        };
    }, [selectedDate, isToday, userProfile]);

    const handleEditGoal = () => {
        const newGoal = window.prompt("Enter your daily calorie goal:", goalCals.toString());
        if (newGoal !== null && !isNaN(parseInt(newGoal, 10)) && parseInt(newGoal, 10) > 0) {
            const val = parseInt(newGoal, 10);
            setGoalCals(val);
            localStorage.setItem('workout_os_calorie_goal', val.toString());
            window.dispatchEvent(new Event('storage'));
        }
    };

    const percentage = Math.min((currentCals / goalCals) * 100, 100);

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
                    icon: '⚡'
                });
                await saveMealsForDate(selectedDate, meals);
                // Trigger reload
                window.dispatchEvent(new Event('storage'));
                window.dispatchEvent(new Event('workout_os_diet_updated'));
                setIsLogging(false);
                setMealName('');
                setMealCals('');
            });
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full relative transition-colors">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#fff7ed] dark:bg-orange-900/30 text-[#f97316] flex items-center justify-center">
                        <Utensils size={18} />
                    </div>
                    <span className="text-sm font-bold tracking-wide text-gray-800 dark:text-gray-200">NUTRITION</span>
                </div>
                <span 
                    onClick={handleEditGoal}
                    className="text-[13px] font-medium text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-700 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    title="Click to edit calorie target"
                >
                    Target: {(goalCals / 1000).toFixed(1)}k kcal
                </span>
            </div>

            <div className="mb-2">
                <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-[42px] font-black text-[#0f172a] dark:text-white tracking-tight leading-none">{currentCals.toLocaleString()}</span>
                    <span 
                        onClick={handleEditGoal}
                        className="text-sm text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-[#f97316] transition-colors hover:underline"
                        title="Click to edit calorie target"
                    >
                        / {goalCals.toLocaleString()} kcal
                    </span>
                </div>
                <div className="w-full bg-[#f1f1f1] h-2.5 rounded-full overflow-hidden">
                    <div 
                        className="bg-[#f97316] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }} 
                    />
                </div>
            </div>

            {/* Blurred Macros & Floating Button */}
            <div className="mt-auto relative pt-6">
                <div className="grid grid-cols-3 gap-2 text-center pb-2">
                    <div>
                        <span className="text-gray-400 block text-[11px] font-medium">Protein</span>
                        <span className="font-bold text-[#f97316]">{macros.protein}g</span>
                    </div>
                    <div>
                        <span className="text-gray-400 block text-[11px] font-medium">Carbs</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{macros.carbs}g</span>
                    </div>
                    <div>
                        <span className="text-gray-400 block text-[11px] font-medium">Fats</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{macros.fat}g</span>
                    </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-center pt-2 px-4">
                    {isLogging ? (
                        <form onSubmit={handleAddMeal} className="bg-gray-50 dark:bg-slate-800/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 w-full animate-in zoom-in duration-300">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Quick Log</h4>
                            <div className="space-y-2 mb-3">
                                <input 
                                    type="text"
                                    placeholder="Meal (e.g. Chicken Rice)"
                                    value={mealName}
                                    onChange={(e) => setMealName(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#f97316]"
                                    autoFocus
                                />
                                <div className="relative">
                                    <input 
                                        type="number"
                                        placeholder="Calories"
                                        value={mealCals}
                                        onChange={(e) => setMealCals(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#f97316]"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">kcal</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setIsLogging(false)} className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold py-2 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                                <button type="submit" disabled={!mealCals} className="flex-1 bg-[#f97316] text-white font-bold py-2 rounded-xl text-sm hover:bg-[#ea580c] transition-colors disabled:opacity-50">Save</button>
                            </div>
                        </form>
                    ) : (
                        <button 
                            onClick={() => setIsLogging(true)}
                            disabled={!isToday}
                            className={`${isToday ? 'bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 dark:text-gray-500'} text-[15px] font-bold px-6 py-2.5 rounded-full transition-colors flex items-center gap-1.5 btn-press`}
                        >
                            <Plus size={18} strokeWidth={3} />
                            {isToday ? 'Log Meal' : 'Historical Data'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
