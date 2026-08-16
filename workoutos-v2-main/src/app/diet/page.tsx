'use client';

import React, { useState, useEffect } from 'react';
import { ScanLine } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import DietGaugeSummary from './components/DietGaugeSummary';
import MealPlanCarousel from './components/MealPlanCarousel';
import TDEEDeficitCard from './components/TDEEDeficitCard';
import MacroRings from './components/MacroRings';
import MealLogger from './components/MealLogger';
import WaterTracker from './components/WaterTracker';
import MicronutrientDrawer from './components/MicronutrientDrawer';
import EditFoodModal from './components/EditFoodModal';
import MealPlanDetailsModal from './components/MealPlanDetailsModal';
import RecipeGroupBuilderModal from './components/RecipeGroupBuilderModal';
import GeminiBarcodeScannerModal from '@/app/components/GeminiBarcodeScannerModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRewardSystem } from '@/lib/hooks/useRewardSystem';
import { MealItem, MealCategory, MacroGoals } from './types';
import {
    formatDateKey,
    getMealsForDate,
    saveMealsForDate,
    getWaterForDate,
    saveWaterForDate,
    getMacroGoals,
    saveMacroGoals,
    exportDailySummaryText,
} from './services/dietStorage';

const INITIAL_MEALS: MealItem[] = [];

export default function DietPage() {
    const [currentDateKey, setCurrentDateKey] = useState<string>('');
    const [meals, setMeals] = useState<MealItem[]>([]);
    const [macroGoals, setMacroGoals] = useState<MacroGoals>({
        calories: 2200,
        protein: 140,
        carbs: 220,
        fat: 65,
        sugar: 35,
        fiber: 25,
    });

    // Modals visibility state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPlanDetailsOpen, setIsPlanDetailsOpen] = useState(false);
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);

    const [editingMeal, setEditingMeal] = useState<MealItem | null>(null);
    const [modalDefaultCategory, setModalDefaultCategory] = useState<MealCategory>('Breakfast');
    const [isLoaded, setIsLoaded] = useState(false);
    const [activityBurned, setActivityBurned] = useState(0);

    const { userProfile } = useAuth();
    const { t } = useLanguage();
    const { triggerSuccess } = useRewardSystem();

    // Initial load of macro goals and listen for global settings changes
    useEffect(() => {
        const loadGoals = async () => {
            const localGoals = await getMacroGoals();
            if (userProfile?.calorieGoal) {
                localGoals.calories = userProfile.calorieGoal;
            }
            setMacroGoals(localGoals);
        };
        loadGoals();
        
        window.addEventListener('storage', loadGoals);
        return () => window.removeEventListener('storage', loadGoals);
    }, [userProfile?.calorieGoal]);

    // Initialize date to prevent hydration error
    useEffect(() => {
        setCurrentDateKey(formatDateKey(new Date()));
    }, []);

    // Synchronize meals whenever currentDateKey changes
    useEffect(() => {
        if (!currentDateKey) return;
        setIsLoaded(false);
        const load = async () => {
            const dbMeals = await getMealsForDate(currentDateKey);
            setMeals(dbMeals);
            // Real activity burn for the day, not a hardcoded value.
            const { getActivityBurnedForDate } = await import('./services/dietStorage');
            setActivityBurned(await getActivityBurnedForDate(currentDateKey));
            setIsLoaded(true);
        };
        load();

        window.addEventListener('storage', load);
        window.addEventListener('workout_os_diet_updated', load);
        return () => {
            window.removeEventListener('storage', load);
            window.removeEventListener('workout_os_diet_updated', load);
        };
    }, [currentDateKey]);

    // Save meals for selected currentDateKey whenever state updates


    const handleUpdateGoals = async (newGoals: MacroGoals) => {
        setMacroGoals(newGoals);
        await saveMacroGoals(newGoals);
    };

    const handleOpenAddModal = (category: MealCategory) => {
        setEditingMeal(null);
        setModalDefaultCategory(category);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (meal: MealItem) => {
        setEditingMeal(meal);
        setModalDefaultCategory(meal.category);
        setIsModalOpen(true);
    };

    const handleSaveMeal = async (mealData: Omit<MealItem, 'id'> & { id?: string }) => {
        let newMeals;
        if (mealData.id) {
            newMeals = meals.map((m) => (m.id === mealData.id ? ({ ...m, ...mealData } as MealItem) : m));
        } else {
            const newMeal: MealItem = {
                ...mealData,
                id: Date.now().toString() + Math.random().toString().slice(2, 5),
            };
            newMeals = [...meals, newMeal];
        }
        setMeals(newMeals);
        await saveMealsForDate(currentDateKey, newMeals);
        triggerSuccess();
    };

    const handleAddBatchMeals = async (batchMeals: Omit<MealItem, 'id'>[]) => {
        const newItems: MealItem[] = batchMeals.map((m, idx) => ({
            ...m,
            id: Date.now().toString() + idx.toString(),
        }));
        const newMeals = [...meals, ...newItems];
        setMeals(newMeals);
        await saveMealsForDate(currentDateKey, newMeals);
        triggerSuccess();
    };

    const handleApplyWaterIntake = async (amountMl: number) => {
        const currentWater = await getWaterForDate(currentDateKey);
        saveWaterForDate(currentDateKey, currentWater + amountMl);
    };

    const handleDeleteMeal = async (id: string) => {
        const newMeals = meals.filter((m) => m.id !== id);
        setMeals(newMeals);
        await saveMealsForDate(currentDateKey, newMeals);
    };

    const handleCopyYesterdayMeals = async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = formatDateKey(yesterday);
        const yesterdayMeals = await getMealsForDate(yesterdayKey);

        const copied = (yesterdayMeals.length > 0 ? yesterdayMeals : INITIAL_MEALS).map((m) => ({
            ...m,
            id: Date.now().toString() + Math.random().toString().slice(2, 6),
        }));

        const newMeals = [...meals, ...copied];
        setMeals(newMeals);
        await saveMealsForDate(currentDateKey, newMeals);
        triggerSuccess();
    };

    const handleExportSummaryText = async () => {
        const waterMl = await getWaterForDate(currentDateKey);
        const summaryText = exportDailySummaryText(currentDateKey, meals, waterMl);
        navigator.clipboard.writeText(summaryText);
    };

    const handleOpenPlanDetails = () => {
        setIsPlanDetailsOpen(true);
    };

    React.useEffect(() => {
        const handleQuickLog = async (e: any) => {
            const planId = e.detail;
            
            // Map plan to a generic logged meal
            const planMap: Record<string, any> = {
                '1': { name: 'Morning Plan - Eggs & Toast', category: 'Breakfast', calories: 320, protein: 16, carbs: 26, fat: 18 },
                '2': { name: 'Lunch Plan - Quinoa Bowl', category: 'Lunch', calories: 440, protein: 26, carbs: 52, fat: 14 },
                '3': { name: 'Dinner Plan - Broccoli Curry', category: 'Dinner', calories: 380, protein: 22, carbs: 34, fat: 16 },
                '4': { name: 'Snack Plan - Oat Bites', category: 'Snacks', calories: 180, protein: 10, carbs: 22, fat: 6 },
            };

            const mealData = planMap[planId] || { name: 'Custom Meal Plan', category: 'Snacks', calories: 200, protein: 10, carbs: 20, fat: 5 };
            
            await handleSaveMeal({
                ...mealData,
                portion: '1 serving',
                unit: 'serving',
                sugar: 2,
                fiber: 5
            });
        };

        window.addEventListener('workout_os_quick_log_meal_plan', handleQuickLog);
        return () => window.removeEventListener('workout_os_quick_log_meal_plan', handleQuickLog);
    }, [meals, currentDateKey]);

    // Calculate aggregated totals
    const totalCalories = meals.reduce((acc, m) => acc + (m.calories || 0), 0);
    const totalProtein = meals.reduce((acc, m) => acc + (m.protein || 0), 0);
    const totalCarbs = meals.reduce((acc, m) => acc + (m.carbs || 0), 0);
    const totalFat = meals.reduce((acc, m) => acc + (m.fat || 0), 0);
    const totalSugar = meals.reduce((acc, m) => acc + (m.sugar || 0), 0);
    const totalFiber = meals.reduce((acc, m) => acc + (m.fiber || 0), 0);

    // Dynamic TDEE Calculation (Mifflin-St Jeor)
    const calculateTDEE = () => {
        let weight = userProfile?.currentWeight || 75;

        const height = userProfile?.heightCm || 170;
        let age = 25;
        if (userProfile?.dob) {
            const birthDate = new Date(userProfile.dob);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
        }

        let bmr = (10 * weight) + (6.25 * height) - (5 * age);
        if (userProfile?.gender === 'female') {
            bmr -= 161;
        } else {
            bmr += 5; // male or other
        }

        // Base Sedentary TDEE (Activity burn is handled separately in the UI)
        return Math.round(bmr * 1.2);
    };

    const dynamicTDEE = calculateTDEE();

    if (!currentDateKey) return null; // Avoid render until hydration

    return (
        <AppLayout>
            <div className="space-y-6 pb-12">
                <div className="flex items-center justify-between mb-3 px-1 mt-6">
                    <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                        <ScanLine size={20} className="text-[#0a84ff]" /> Metabolic Core
                    </h2>
                    <span className="font-label-sm text-[11px] text-on-surface-variant/70 uppercase tracking-wider hidden sm:block">
                        Nutrition Intelligence
                    </span>
                </div>

                {/* Top Gauge & Metrics Summary */}
                <DietGaugeSummary
                    currentDateKey={currentDateKey}
                    onDateChange={setCurrentDateKey}
                    totalCalories={totalCalories}
                    calorieGoal={macroGoals.calories}
                    activityBurned={activityBurned}
                    weeklyRemaining={Math.max(macroGoals.calories - totalCalories + activityBurned, 0)}
                    onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
                />

                {/* TDEE & Net Energy Deficit Balance Card */}
                <TDEEDeficitCard
                    totalCalories={totalCalories}
                    activityBurned={activityBurned}
                    tdeeGoal={dynamicTDEE}
                />

                {/* YOUR MEAL PLAN Carousel Card */}
                <MealPlanCarousel onOpenDetails={handleOpenPlanDetails} />

                {/* Dynamic Macro & Calorie Ring Progress */}
                <MacroRings
                    totalCalories={totalCalories}
                    totalProtein={totalProtein}
                    totalCarbs={totalCarbs}
                    totalFat={totalFat}
                    totalSugar={totalSugar}
                    totalFiber={totalFiber}
                    macroGoals={macroGoals}
                    onUpdateGoals={handleUpdateGoals}
                />

                {/* Interactive Meal Logger (Breakfast, Lunch, Dinner, Snacks) */}
                <MealLogger
                    meals={meals}
                    onAddMealClick={handleOpenAddModal}
                    onEditMealClick={handleOpenEditModal}
                    onDeleteMeal={handleDeleteMeal}
                    onCopyYesterdayMeals={handleCopyYesterdayMeals}
                    onExportSummaryText={handleExportSummaryText}
                    onOpenRecipeModal={() => setIsRecipeModalOpen(true)}
                />

                {/* Hydration / Water Tracker */}
                <WaterTracker currentDateKey={currentDateKey} />

                {/* Micronutrient & Health Target Breakdown Drawer */}
                <MicronutrientDrawer meals={meals} />

                {/* Add / Modify Food Item Modal */}
                <EditFoodModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveMeal}
                    onDelete={handleDeleteMeal}
                    initialData={editingMeal}
                    defaultCategory={modalDefaultCategory}
                />

                {/* 5-Day Structured Meal Plan Details Modal */}
                <MealPlanDetailsModal
                    isOpen={isPlanDetailsOpen}
                    onClose={() => setIsPlanDetailsOpen(false)}
                    onLogMeal={handleSaveMeal}
                />

                {/* Saved Recipe & Meal Combo Builder Modal */}
                <RecipeGroupBuilderModal
                    isOpen={isRecipeModalOpen}
                    onClose={() => setIsRecipeModalOpen(false)}
                    onLogRecipe={handleAddBatchMeals}
                />

                {/* Gemini Barcode & Nutrition Scanner Modal */}
                <GeminiBarcodeScannerModal
                    isOpen={isBarcodeScannerOpen}
                    onClose={() => setIsBarcodeScannerOpen(false)}
                    onLogMeal={handleSaveMeal}
                />
            </div>
        </AppLayout>
    );
}
