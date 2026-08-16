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

