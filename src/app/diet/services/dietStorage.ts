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
        portion: '1 serving',
        calories: row.calories,
        protein: Number(row.protein),
        carbs: Number(row.carbs),
        fat: Number(row.fat),
        sugar: Number(row.sugar),
        icon: '🍽️'
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

export const getMacroGoals = async (): Promise<MacroGoals> => {
    const defaultGoals = { calories: 2200, protein: 140, carbs: 220, fat: 65, sugar: 35 };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return defaultGoals;

    const { data } = await supabase.from('profiles').select('target_config, calorie_goal').eq('id', user.id).single();
    if (data) {
        const config = data.target_config || {};
        return {
            calories: data.calorie_goal || 2200,
            protein: config.protein || 140,
            carbs: config.carbs || 220,
            fat: config.fat || 65,
            sugar: config.sugar || 35
        };
    }
    return defaultGoals;
};

export const saveMacroGoals = async (goals: MacroGoals): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { calories, ...macrosOnly } = goals;
    await supabase.from('profiles').upsert({
        id: user.id,
        calorie_goal: calories,
        target_config: macrosOnly
    }, { onConflict: 'id' });

    if (typeof window !== 'undefined') {
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
