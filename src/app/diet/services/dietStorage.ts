import { MealItem, MacroGoals, MealCategory } from '../types';
import { supabase } from '@/lib/supabase/client';
import { XPService } from '@/lib/xpService';

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
        fiber: 0,
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
    
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workout_os_diet_updated'));
        window.dispatchEvent(new Event('storage'));
    }
};

export interface WaterLogItem {
    id: number;
    amount: number;
    time: string;
    type: string;
}

export const getWaterDataForDate = async (dateKey: string): Promise<{ totalMl: number; logs: WaterLogItem[] }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { totalMl: 0, logs: [] };

    const { data } = await supabase
        .from('daily_logs')
        .select('water_ml_total, water_logs')
        .eq('user_id', user.id)
        .eq('date', dateKey)
        .maybeSingle();

    const totalMl = data?.water_ml_total || 0;
    let rawLogs: WaterLogItem[] = Array.isArray(data?.water_logs) ? data.water_logs : [];

    // Reconcile: If totalMl > 0 but logs array is empty (e.g. legacy or quick add), create a fallback log item
    if (totalMl > 0 && rawLogs.length === 0) {
        rawLogs = [{
            id: Date.now(),
            amount: totalMl,
            time: 'Recorded',
            type: 'Total Intake'
        }];
    }

    // Ensure all log IDs are unique
    const seenIds = new Set<number>();
    const logs: WaterLogItem[] = rawLogs.map((item, idx) => {
        let uniqueId = item.id || (Date.now() + idx);
        while (seenIds.has(uniqueId)) {
            uniqueId += Math.floor(Math.random() * 1000) + 1;
        }
        seenIds.add(uniqueId);
        return { ...item, id: uniqueId };
    });

    return { totalMl, logs };
};

export const getWaterForDate = async (dateKey: string): Promise<number> => {
    const data = await getWaterDataForDate(dateKey);
    return data.totalMl;
};

export const saveWaterForDate = async (dateKey: string, amount: number): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { logs } = await getWaterDataForDate(dateKey);
    
    // Create new log entry if amount increased
    const existingTotal = logs.reduce((sum, item) => sum + item.amount, 0);
    let updatedLogs = [...logs];

    if (amount > existingTotal) {
        const added = amount - existingTotal;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        updatedLogs.unshift({
            id: Date.now() + Math.floor(Math.random() * 1000),
            amount: added,
            time: timeStr,
            type: 'Quick Add'
        });
    } else if (amount === 0) {
        updatedLogs = [];
    }

    await supabase.from('daily_logs').upsert(
        { user_id: user.id, date: dateKey, water_ml_total: amount, water_logs: updatedLogs },
        { onConflict: 'user_id,date' }
    );
    
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workout_os_water_updated'));
        window.dispatchEvent(new Event('storage'));
    }
};

export const addWaterLog = async (dateKey: string, amount: number, type: string = 'Quick Add'): Promise<{ totalMl: number; logs: WaterLogItem[] }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { totalMl: 0, logs: [] };

    const current = await getWaterDataForDate(dateKey);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newLog: WaterLogItem = {
        id: Date.now() + Math.floor(Math.random() * 10000),
        amount,
        time: timeStr,
        type
    };

    const newLogs = [newLog, ...current.logs];
    const newTotal = current.totalMl + amount;

    await supabase.from('daily_logs').upsert(
        { user_id: user.id, date: dateKey, water_ml_total: newTotal, water_logs: newLogs },
        { onConflict: 'user_id,date' }
    );

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workout_os_water_updated'));
        window.dispatchEvent(new Event('storage'));
    }

    // Check if water goal is met
    const { data: profile } = await supabase.from('profiles').select('water_goal_ml').eq('id', user.id).maybeSingle();
    const waterGoal = profile?.water_goal_ml || 3000;
    
    if (newTotal >= waterGoal) {
        await XPService.awardXP(
            user.id,
            'daily_water_goal',
            15,
            `water_goal_met_${dateKey}`,
            { date: dateKey, total: newTotal, goal: waterGoal }
        );
    }

    return { totalMl: newTotal, logs: newLogs };
};

export const deleteWaterLog = async (dateKey: string, logId: number): Promise<{ totalMl: number; logs: WaterLogItem[] }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { totalMl: 0, logs: [] };

    const current = await getWaterDataForDate(dateKey);
    const target = current.logs.find(l => l.id === logId);
    
    const newLogs = current.logs.filter(l => l.id !== logId);
    const amountToRemove = target ? target.amount : 0;
    const newTotal = Math.max(0, current.totalMl - amountToRemove);

    await supabase.from('daily_logs').upsert(
        { user_id: user.id, date: dateKey, water_ml_total: newTotal, water_logs: newLogs },
        { onConflict: 'user_id,date' }
    );

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workout_os_water_updated'));
        window.dispatchEvent(new Event('storage'));
    }

    return { totalMl: newTotal, logs: newLogs };
};

export const resetWaterForDate = async (dateKey: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('daily_logs').upsert(
        { user_id: user.id, date: dateKey, water_ml_total: 0, water_logs: [] },
        { onConflict: 'user_id,date' }
    );

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workout_os_water_updated'));
        window.dispatchEvent(new Event('storage'));
    }
};

export const getActivityBurnedForDate = async (dateKey: string): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    const { data } = await supabase.from('daily_logs').select('activity_burned').eq('user_id', user.id).eq('date', dateKey).maybeSingle();
    return data?.activity_burned || 0;
};

export const saveActivityBurnedForDate = async (dateKey: string, amount: number): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('daily_logs').upsert({ user_id: user.id, date: dateKey, activity_burned: amount }, { onConflict: 'user_id,date' });
    
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
    }
};

export const getMacroGoals = async (): Promise<MacroGoals> => {
    const defaultGoals = { calories: 2200, protein: 140, carbs: 220, fat: 65, sugar: 35, fiber: 25 };
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
            sugar: config.sugar || 35,
            fiber: config.fiber || 25
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

export const getWeeklyDeficitAggregation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { cumulativeDeficit: 0, estimatedWeightLossKg: 0, daysTracked: 0 };

    const { data: profile } = await supabase.from('profiles').select('calorie_goal').eq('id', user.id).maybeSingle();
    const tdeeGoal = profile?.calorie_goal || 2200;

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6); // Last 7 days including today
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: logs } = await supabase
        .from('daily_logs')
        .select('date, nutrition_macros, activity_burned')
        .eq('user_id', user.id)
        .gte('date', dateStr);

    if (!logs || logs.length === 0) return { cumulativeDeficit: 0, estimatedWeightLossKg: 0, daysTracked: 0 };

    let totalDeficit = 0;
    logs.forEach(log => {
        const caloriesConsumed = log.nutrition_macros?.calories || 0;
        const burned = log.activity_burned || 0;
        const net = Math.max(0, caloriesConsumed - burned);
        totalDeficit += (net - tdeeGoal);
    });

    return {
        cumulativeDeficit: totalDeficit,
        // Using totalDeficit directly. If totalDeficit is -3500 (deficit), they lost weight.
        estimatedWeightLossKg: -(totalDeficit / 7700), 
        daysTracked: logs.length
    };
};
