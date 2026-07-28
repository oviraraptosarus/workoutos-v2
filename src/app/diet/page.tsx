'use client';

import React, { useState, useEffect } from 'react';
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
import RawDataAITransformerModal from '@/app/components/RawDataAITransformerModal';
import GeminiBarcodeScannerModal from '@/app/components/GeminiBarcodeScannerModal';
import { useAuth } from '@/contexts/AuthContext';
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
    const [currentDateKey, setCurrentDateKey] = useState<string>(formatDateKey(new Date()));
    const [meals, setMeals] = useState<MealItem[]>([]);
    const [macroGoals, setMacroGoals] = useState<MacroGoals>({
        calories: 2200,
        protein: 140,
        carbs: 220,
        fat: 65,
        sugar: 35,
    });

    // Modals visibility state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPlanDetailsOpen, setIsPlanDetailsOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);

    const [editingMeal, setEditingMeal] = useState<MealItem | null>(null);
    const [modalDefaultCategory, setModalDefaultCategory] = useState<MealCategory>('Breakfast');
    const [isLoaded, setIsLoaded] = useState(false);

    const { userProfile } = useAuth();

    // Initial load of macro goals and listen for global settings changes
    useEffect(() => {
        const loadGoals = () => {
            const localGoals = getMacroGoals();
            if (userProfile?.calorieGoal) {
                localGoals.calories = userProfile.calorieGoal;
            }
            setMacroGoals(localGoals);
        };
        loadGoals();
        
        window.addEventListener('storage', loadGoals);
        return () => window.removeEventListener('storage', loadGoals);
    }, [userProfile?.calorieGoal]);

    // Synchronize meals whenever currentDateKey changes
    useEffect(() => {
        setIsLoaded(false);
        const load = async () => {
            const dbMeals = await getMealsForDate(currentDateKey);
            setMeals(dbMeals);
            setIsLoaded(true);
        };
        load();
    }, [currentDateKey]);

    // Save meals for selected currentDateKey whenever state updates
    useEffect(() => {
        if (isLoaded) {
            saveMealsForDate(currentDateKey, meals);
        }
    }, [meals, currentDateKey, isLoaded]);

    const handleUpdateGoals = (newGoals: MacroGoals) => {
        setMacroGoals(newGoals);
        saveMacroGoals(newGoals);
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

    const handleSaveMeal = (mealData: Omit<MealItem, 'id'> & { id?: string }) => {
        if (mealData.id) {
            setMeals((prev) =>
                prev.map((m) => (m.id === mealData.id ? ({ ...m, ...mealData } as MealItem) : m))
            );
        } else {
            const newMeal: MealItem = {
                ...mealData,
                id: Date.now().toString() + Math.random().toString().slice(2, 5),
            };
            setMeals((prev) => [...prev, newMeal]);
        }
    };

    const handleAddBatchMeals = (batchMeals: Omit<MealItem, 'id'>[]) => {
        const newItems: MealItem[] = batchMeals.map((m, idx) => ({
            ...m,
            id: Date.now().toString() + idx.toString(),
        }));
        setMeals((prev) => [...prev, ...newItems]);
    };

    const handleApplyWaterIntake = (amountMl: number) => {
        const currentWater = getWaterForDate(currentDateKey);
        saveWaterForDate(currentDateKey, currentWater + amountMl);
    };

    const handleDeleteMeal = (id: string) => {
        setMeals((prev) => prev.filter((m) => m.id !== id));
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

        setMeals((prev) => [...prev, ...copied]);
    };

    const handleExportSummaryText = () => {
        const waterMl = getWaterForDate(currentDateKey);
        const summaryText = exportDailySummaryText(currentDateKey, meals, waterMl);
        navigator.clipboard.writeText(summaryText);
    };

    const handleOpenAIModal = () => {
        setIsAIModalOpen(true);
    };

    const handleOpenPlanDetails = () => {
        setIsPlanDetailsOpen(true);
    };

    // Calculate aggregated totals
    const totalCalories = meals.reduce((acc, m) => acc + (m.calories || 0), 0);
    const totalProtein = meals.reduce((acc, m) => acc + (m.protein || 0), 0);
    const totalCarbs = meals.reduce((acc, m) => acc + (m.carbs || 0), 0);
    const totalFat = meals.reduce((acc, m) => acc + (m.fat || 0), 0);
    const totalSugar = meals.reduce((acc, m) => acc + (m.sugar || 0), 0);

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

    return (
        <AppLayout>
            <div className="space-y-6 pb-12">
                <div className="pb-2 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 drop-shadow-sm">
                            Diet & Nutrition
                        </h1>
                        <p className="hidden sm:block text-sm text-gray-600 font-bold mt-0.5">
                            Track your meals, macros, calories, and hydration
                        </p>
                    </div>
                </div>

                {/* Top Gauge & Metrics Summary matching screenshot */}
                <DietGaugeSummary
                    currentDateKey={currentDateKey}
                    onDateChange={setCurrentDateKey}
                    totalCalories={totalCalories}
                    calorieGoal={macroGoals.calories}
                    activityBurned={180}
                    weeklyRemaining={42}
                    onOpenAIMealModal={handleOpenAIModal}
                    onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
                />

                {/* TDEE & Net Energy Deficit Balance Card */}
                <TDEEDeficitCard
                    totalCalories={totalCalories}
                    activityBurned={180}
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

                {/* Universal Raw Data AI Transformer Modal */}
                <RawDataAITransformerModal
                    isOpen={isAIModalOpen}
                    onClose={() => setIsAIModalOpen(false)}
                    onApplyDietMeals={handleAddBatchMeals}
                    onApplyWater={handleApplyWaterIntake}
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
