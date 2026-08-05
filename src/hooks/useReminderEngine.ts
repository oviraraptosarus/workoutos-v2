import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useReminderEngine() {
    const { userProfile, user } = useAuth();
    useEffect(() => {
        if (!user || !userProfile) return;
        
        const runEngine = async () => {
            try {
                // 1. Fetch configs
                const { data: configs } = await supabase
                    .from('smart_reminders_config')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('is_enabled', true);
                
                if (!configs || configs.length === 0) return;

                const now = new Date();
                const currentDay = now.getDay(); // 0-6
                const currentHours = now.getHours();
                const currentMinutes = now.getMinutes();
                const currentTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
                const todayStr = now.toISOString().split('T')[0];

                const newAlerts: any[] = [];

                // 2. Fetch existing command center items to prevent duplicates
                const { data: existing } = await supabase
                    .from('command_center_items')
                    .select('title, category, source_module')
                    .eq('user_id', user.id)
                    .gte('created_at', `${todayStr}T00:00:00Z`);

                const existingTitles = new Set((existing || []).map(e => e.title));

                // Helper to check missing logs
                const isMissingLog = async (type: string) => {
                    if (type === 'Breakfast' || type === 'Lunch' || type === 'Dinner' || type === 'Snacks') {
                        const { data } = await supabase
                            .from('meal_entries')
                            .select('id')
                            .eq('user_id', user.id)
                            .eq('date', todayStr)
                            .ilike('meal_slot', type)
                            .limit(1);
                        return !data || data.length === 0;
                    }
                    if (type === 'Workout') {
                        const { data } = await supabase
                            .from('workout_logs')
                            .select('id')
                            .eq('user_id', user.id)
                            .eq('date', todayStr)
                            .limit(1);
                        return !data || data.length === 0;
                    }
                    if (type === 'Sleep' || type === 'Weight' || type === 'Mood' || type === 'Daily Reflection') {
                        const { data } = await supabase
                            .from('daily_logs')
                            .select('sleep_hours, weight_kg, mood_rating, reflection')
                            .eq('user_id', user.id)
                            .eq('date', todayStr)
                            .maybeSingle();
                        if (!data) return true;
                        if (type === 'Sleep' && !data.sleep_hours) return true;
                        if (type === 'Weight' && !data.weight_kg) return true;
                        if (type === 'Mood' && !data.mood_rating) return true;
                        if (type === 'Daily Reflection' && (!data.reflection || Object.keys(data.reflection).length === 0)) return true;
                        return false;
                    }
                    if (type === 'Progress Photo') {
                        const { data } = await supabase
                            .from('progress_photos')
                            .select('id')
                            .eq('user_id', user.id)
                            .gte('created_at', `${todayStr}T00:00:00Z`)
                            .limit(1);
                        return !data || data.length === 0;
                    }
                    // For Water, Walk, Stretch, Meditation - these are just general reminders 
                    // unless we want to query water logs.
                    if (type === 'Water') {
                        const { data } = await supabase
                            .from('daily_logs')
                            .select('water_ml_total')
                            .eq('user_id', user.id)
                            .eq('date', todayStr)
                            .maybeSingle();
                        // Only remind if they haven't reached goal
                        return !data || data.water_ml_total < (userProfile.waterGoalMl || 3000);
                    }
                    return true; // For others, always fire if time passed
                };

                for (const config of configs) {
                    // Check skip date
                    if (config.skip_next_date === todayStr) continue;
                    
                    // Check recurring days
                    const days = config.recurring_days || [];
                    if (!days.includes(currentDay)) continue;

                    // Water is special (interval based)
                    if (config.reminder_type === 'Water') {
                        if (config.start_time && config.end_time && config.interval_minutes) {
                            if (currentTimeStr >= config.start_time && currentTimeStr <= config.end_time) {
                                // Just a simple logic: Check if we haven't reminded about water in the last interval
                                const { data: lastWater } = await supabase
                                    .from('command_center_items')
                                    .select('created_at')
                                    .eq('user_id', user.id)
                                    .eq('title', 'Time to Hydrate')
                                    .gte('created_at', `${todayStr}T00:00:00Z`)
                                    .order('created_at', { ascending: false })
                                    .limit(1);
                                
                                let shouldRemindWater = true;
                                if (lastWater && lastWater.length > 0) {
                                    const lastTime = new Date(lastWater[0].created_at).getTime();
                                    const minutesSinceLast = (now.getTime() - lastTime) / 60000;
                                    if (minutesSinceLast < config.interval_minutes) {
                                        shouldRemindWater = false;
                                    }
                                }

                                if (shouldRemindWater) {
                                    const missing = await isMissingLog('Water');
                                    if (missing) {
                                        newAlerts.push({
                                            user_id: user.id,
                                            title: 'Time to Hydrate',
                                            description: `Drink some water to hit your ${userProfile.waterGoalMl}ml goal!`,
                                            category: 'Health Alert',
                                            priority: 'medium',
                                            icon: 'droplets',
                                            source_module: 'Water',
                                            action_type: 'OPEN_WATER'
                                        });
                                    }
                                }
                            }
                        }
                    } else {
                        // Regular time-based reminder
                        if (config.time && currentTimeStr >= config.time) {
                            const title = `Log your ${config.reminder_type}`;
                            if (!existingTitles.has(title)) {
                                const missing = await isMissingLog(config.reminder_type);
                                if (missing) {
                                    newAlerts.push({
                                        user_id: user.id,
                                        title: title,
                                        description: `It's past ${config.time}. Don't forget to track your ${config.reminder_type.toLowerCase()}!`,
                                        category: 'Reminder',
                                        priority: 'medium',
                                        icon: 'bell',
                                        source_module: config.reminder_type,
                                        action_type: `OPEN_${config.reminder_type.toUpperCase().replace(' ', '_')}`
                                    });
                                }
                            }
                        }
                    }
                }

                if (newAlerts.length > 0) {
                    await supabase.from('command_center_items').insert(newAlerts);
                    
                    // Trigger Native Notifications
                    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                        newAlerts.forEach(alert => {
                            const showNotification = () => {
                                const options = {
                                    body: alert.description,
                                    icon: '/logo.png',
                                    badge: '/logo.png',
                                    tag: alert.title
                                };
                                if ('serviceWorker' in navigator) {
                                    navigator.serviceWorker.ready.then(reg => {
                                        reg.showNotification(alert.title, options);
                                    }).catch(() => {
                                        new Notification(alert.title, options);
                                    });
                                } else {
                                    new Notification(alert.title, options);
                                }
                            };
                            showNotification();
                        });
                    }
                }

            } catch (error) {
                console.error("Error in Smart Reminder Engine", error);
            }
        };

        // Run immediately, then every 60 seconds
        runEngine();
        const intervalId = setInterval(runEngine, 60000);

        return () => clearInterval(intervalId);
    }, [user, userProfile]);
}
