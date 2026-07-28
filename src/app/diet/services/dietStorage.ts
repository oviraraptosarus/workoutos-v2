import { MealItem, MacroGoals, MealCategory } from '../types';
import { supabase } from '@/lib/supabaseClient';

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

export const getMealsForDate = async (dateKey: string): Promise<MealItem[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('meal_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateKey);

    if (error || !data) return [];

    return data.map(row => ({
        id: row.id,
        category: row.meal_slot as MealCategory,
        name: row.name,
        calories: row.calories,
        protein: Number(row.protein),
        carbs: Number(row.carbs),
        fat: Number(row.fat),
        sugar: Number(row.sugar),
        fiber: Number(row.fiber_g_estimate),
        isOffPlan: row.is_off_plan,
        offPlanReason: row.off_plan_reason || undefined
    }));
};

export const saveMealsForDate = async (dateKey: string, meals: MealItem[]): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('meal_entries').delete().eq('user_id', user.id).eq('date', dateKey);

    if (meals.length > 0) {
        const payload = meals.map(m => ({
            user_id: user.id,
            date: dateKey,
            meal_slot: m.category,
            name: m.name,
            calories: m.calories,
            protein: m.protein,
            carbs: m.carbs,
            fat: m.fat,
            sugar: m.sugar,
            fiber_g_estimate: m.fiber,
            is_off_plan: m.isOffPlan || false,
            off_plan_reason: m.offPlanReason || null
        }));
        await supabase.from('meal_entries').insert(payload);
    }
};

export const getWaterForDate = async (dateKey: string): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    const { data } = await supabase.from('daily_logs').select('water_ml_total').eq('user_id', user.id).eq('date', dateKey).maybeSingle();
    return data?.water_ml_total || 0;
};

export const saveWaterForDate = async (dateKey: string, amount: number): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('daily_logs').upsert({ user_id: user.id, date: dateKey, water_ml_total: amount }, { onConflict: 'user_id,date' });
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
