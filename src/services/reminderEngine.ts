import { supabase } from '@/lib/supabase/client';

export interface ReminderConfig {
    days?: number[]; // 0=Sunday, 1=Monday...
    time?: string; // HH:mm
    repeat?: boolean;
    frequency?: 'once' | 'hourly' | 'daily' | 'custom';
    sound?: boolean;
    vibration?: boolean;
    silent_mode?: boolean;
    smart_detection?: boolean; // Checks logs before firing
    snooze_duration?: number; // minutes
    skip_once?: boolean;
    notification_style?: 'banner' | 'modal' | 'silent';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface ReminderPreference {
    id: string;
    user_id: string;
    type: string;
    is_enabled: boolean;
    config: ReminderConfig;
}

export async function getReminderPreferences(): Promise<ReminderPreference[]> {
    const { data, error } = await supabase
        .from('reminder_preferences')
        .select('*');

    if (error) {
        console.error('Error fetching reminders:', error);
        return [];
    }

    return data as ReminderPreference[];
}

export async function updateReminderPreference(type: string, is_enabled: boolean, config: ReminderConfig): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return false;

    // UPSERT
    const { error } = await supabase
        .from('reminder_preferences')
        .upsert({
            user_id: userData.user.id,
            type,
            is_enabled,
            config,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, type' });

    if (error) {
        console.error('Error updating reminder:', error);
        return false;
    }

    return true;
}

/**
 * Checks if a reminder is valid to fire based on day of week and smart detection
 */
export async function evaluateReminder(pref: ReminderPreference, currentDate: Date = new Date()): Promise<boolean> {
    if (!pref.is_enabled) return false;

    // Check Day of Week
    if (pref.config.days && pref.config.days.length > 0) {
        const currentDay = currentDate.getDay();
        if (!pref.config.days.includes(currentDay)) {
            return false;
        }
    }

    // Skip once logic
    if (pref.config.skip_once) {
        // Reset skip_once and return false
        await updateReminderPreference(pref.type, pref.is_enabled, { ...pref.config, skip_once: false });
        return false;
    }

    // Smart Detection
    if (pref.config.smart_detection) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        switch (pref.type) {
            case 'water':
                // Ideally check local daily_logs for water target met
                const { data: waterLog } = await supabase.from('daily_logs').select('water_ml').eq('date', dateStr).single();
                // If they've reached say 2000ml (just a placeholder check), skip reminder
                if (waterLog && (waterLog.water_ml || 0) >= 2000) return false;
                break;
            case 'workout':
                const { data: workoutLog } = await supabase.from('daily_logs').select('workout_completed').eq('date', dateStr).single();
                if (workoutLog?.workout_completed) return false;
                break;
            case 'sleep':
                // Check if they already logged sleep for today
                const { data: sleepLog } = await supabase.from('daily_logs').select('sleep_hrs').eq('date', dateStr).single();
                if (sleepLog && (sleepLog.sleep_hrs || 0) > 0) return false;
                break;
            case 'mood':
                const { data: moodLog } = await supabase.from('daily_logs').select('mood_rating').eq('date', dateStr).single();
                if (moodLog && moodLog.mood_rating) return false;
                break;
            case 'weight':
                const { data: weightLog } = await supabase.from('daily_logs').select('weight_kg').eq('date', dateStr).single();
                if (weightLog && weightLog.weight_kg) return false;
                break;
        }
    }

    return true;
}
