import { MealItem, MacroGoals } from '../types';

export const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getDisplayDateString = (dateKey: string): string => {
    const todayKey = formatDateKey(new Date());
    if (dateKey === todayKey) return 'TODAY';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateKey === formatDateKey(yesterday)) return 'YESTERDAY';

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateKey === formatDateKey(tomorrow)) return 'TOMORROW';

    const [year, month, day] = dateKey.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const MEALS_PREFIX = 'workout_os_diet_meals_';
const WATER_PREFIX = 'workout_os_water_ml_';
const GOALS_KEY = 'workout_os_macro_goals_v1';

export const getMealsForDate = (dateKey: string, initialFallback: MealItem[]): MealItem[] => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`${MEALS_PREFIX}${dateKey}`);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {}
        }
    }
    return initialFallback || [];
};

export const saveMealsForDate = (dateKey: string, meals: MealItem[]): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(`${MEALS_PREFIX}${dateKey}`, JSON.stringify(meals));
        
        // Always update the nutrition summary key so NutritionCard stays in sync
        const totalCals = meals.reduce((acc, m) => acc + (m.calories || 0), 0);
        localStorage.setItem(`workout_os_nutrition_${dateKey}`, totalCals.toString());
        
        window.dispatchEvent(new Event('storage'));
    }
};

export const getWaterForDate = (dateKey: string): number => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`${WATER_PREFIX}${dateKey}`);
        if (saved) return parseInt(saved, 10);
    }
    return 0;
};

export const saveWaterForDate = (dateKey: string, amount: number): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(`${WATER_PREFIX}${dateKey}`, amount.toString());
        window.dispatchEvent(new Event('storage'));
    }
};

export const getMacroGoals = (): MacroGoals => {
    if (typeof window !== 'undefined') {
        const savedCals = localStorage.getItem('workout_os_calorie_goal');
        const savedMacrosStr = localStorage.getItem('workout_os_macro_goals_v1');
        
        let cals = savedCals ? parseInt(savedCals, 10) : 2200;
        let macros = { protein: 140, carbs: 220, fat: 65, sugar: 35 };
        
        if (savedMacrosStr) {
            try {
                const parsed = JSON.parse(savedMacrosStr);
                macros = { ...macros, ...parsed };
            } catch (e) {}
        }
        
        return { calories: cals, ...macros };
    }
    return { calories: 2200, protein: 140, carbs: 220, fat: 65, sugar: 35 };
};

export const saveMacroGoals = (goals: MacroGoals): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('workout_os_calorie_goal', goals.calories.toString());
        const { calories, ...macrosOnly } = goals;
        localStorage.setItem('workout_os_macro_goals_v1', JSON.stringify(macrosOnly));
        window.dispatchEvent(new Event('storage'));
    }
};

export const exportDailySummaryText = (dateKey: string, meals: MealItem[], waterMl: number): string => {
    const totalCal = meals.reduce((a, b) => a + (b.calories || 0), 0);
    const totalP = meals.reduce((a, b) => a + (b.protein || 0), 0);
    const totalC = meals.reduce((a, b) => a + (b.carbs || 0), 0);
    const totalF = meals.reduce((a, b) => a + (b.fat || 0), 0);

    let text = `📊 Workout OS - Diet Summary (${getDisplayDateString(dateKey)})\n`;
    text += `🔥 Calories: ${totalCal} kcal | P: ${totalP}g | C: ${totalC}g | F: ${totalF}g\n`;
    text += `💧 Hydration: ${waterMl} ml\n\n`;
    text += `Logged Meals:\n`;

    if (meals.length === 0) {
        text += `  • No meals logged.\n`;
    } else {
        meals.forEach((m) => {
            text += `  • [${m.category}] ${m.icon || ''} ${m.name} (${m.portion}) - ${m.calories} kcal (P:${m.protein}g C:${m.carbs}g F:${m.fat}g)\n`;
        });
    }

    return text;
};
