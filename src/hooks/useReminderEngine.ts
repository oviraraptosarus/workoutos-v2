import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useReminderEngine() {
    const { userProfile, user } = useAuth();
    useEffect(() => {
        if (!user || !userProfile) return;
        
        const runEngine = async () => {
            try {
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const currentTimeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); // 24hr format
                const currentDay = now.getDay();

                // 1. Fetch configs from reminder_preferences
                const { data: configs } = await supabase
                    .from('reminder_preferences')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('is_enabled', true);
                    
                // Fetch Notification Settings toggles (from profile/page.tsx)
                const { data: notifSettings } = await supabase
                    .from('notification_settings')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                const plannerEnabled = notifSettings ? notifSettings.planner_reminders : true;
                const habitEnabled = notifSettings ? notifSettings.habit_reminders : true;

                const newAlerts: any[] = [];
                const tasksToMarkNotified: string[] = [];
                
                // 2. Fetch pending tasks that have reminders due (if enabled)
                if (plannerEnabled) {
                    const { data: pendingTasks } = await supabase
                        .from('tasks')
                        .select('id, title, full_title, priority, reminder_time, due_time, due_date')
                        .eq('user_id', user.id)
                        .eq('completed', false)
                        .eq('notification_sent', false)
                        .or('reminder_time.lte.' + now.toISOString() + ',and(due_date.eq.' + todayStr + ',due_time.lte.' + currentTimeStr + ')');

                    if (pendingTasks && pendingTasks.length > 0) {
                        for (const pt of pendingTasks) {
                            newAlerts.push({
                                user_id: user.id,
                                title: pt.title,
                                description: `Task Due: ${pt.full_title || pt.title}`,
                                category: 'Reminder',
                                priority: pt.priority === 'high' ? 'high' : 'medium',
                                icon: 'check-square',
                                source_module: 'Planner',
                                action_type: 'OPEN_PLANNER',
                                status: 'active'
                            });
                            tasksToMarkNotified.push(pt.id);
                        }
                    }
                }

                // 3. Fetch existing command center items to prevent duplicates and handle escalation
                const { data: existing } = await supabase
                    .from('command_center_items')
                    .select('id, title, category, source_module, created_at, description, status, action_type')
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .gte('created_at', `${todayStr}T00:00:00Z`);

                const existingTitles = new Set((existing || []).map(e => e.title));
                
                // Escalation Engine: Escalate reminders ignored for > 60 minutes
                if (existing && existing.length > 0) {
                    for (const item of existing) {
                        const itemTime = new Date(item.created_at).getTime();
                        const minsPassed = (now.getTime() - itemTime) / 60000;
                        if (minsPassed > 60 && !item.title.includes('🚨')) {
                            // Escalate!
                            await supabase.from('command_center_items').update({
                                title: `🚨 Escalate: ${item.title}`,
                                priority: 'high'
                            }).eq('id', item.id);
                            
                            // Re-notify with urgency
                            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                                const showNotification = () => {
                                    let navUrl = '/';
                                    if (item.action_type === 'OPEN_PLANNER') navUrl = '/planner';
                                    else if (item.action_type === 'OPEN_WATER') navUrl = '/diet';
                                    else if (item.action_type === 'OPEN_SLEEP') navUrl = '/sleep';

                                    const options = {
                                        body: `You haven't addressed this yet: ${item.description}`,
                                        icon: '/logo.png',
                                        badge: '/logo.png',
                                        data: navUrl,
                                        tag: `escalate-${item.id}`
                                    };
                                    if ('serviceWorker' in navigator) {
                                        navigator.serviceWorker.ready.then(reg => reg.showNotification(`🚨 ${item.title}`, options));
                                    }
                                };
                                showNotification();
                            }
                        }
                    }
                }

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
                    if (type === 'Water') {
                        const { data } = await supabase
                            .from('daily_logs')
                            .select('water_ml_total')
                            .eq('user_id', user.id)
                            .eq('date', todayStr)
                            .maybeSingle();
                        return !data || data.water_ml_total < (userProfile.waterGoalMl || 3000);
                    }
                    return true;
                };

                // Evaluate smart preferences
                if (configs && configs.length > 0) {
                    for (const pref of configs) {
                        const config = pref.config || {};
                        const days = config.days || [];
                        if (days.length > 0 && !days.includes(currentDay)) continue;

                        const reminderType = pref.type;

                        if (reminderType === 'Water' || reminderType === 'water') {
                            if (config.time && currentTimeStr >= config.time) {
                                const title = 'Time to Hydrate';
                                if (!existingTitles.has(title) && !existingTitles.has(`🚨 Escalate: ${title}`)) {
                                    const missing = await isMissingLog('Water');
                                    if (missing) {
                                        newAlerts.push({
                                            user_id: user.id,
                                            title: title,
                                            description: `Drink some water to hit your ${userProfile.waterGoalMl || 3000}ml goal!`,
                                            category: 'Health Alert',
                                            priority: 'medium',
                                            icon: 'droplets',
                                            source_module: 'Water',
                                            action_type: 'OPEN_WATER',
                                            status: 'active'
                                        });
                                    }
                                }
                            }
                        } else {
                            if (config.time && currentTimeStr >= config.time) {
                                const title = `Reminder: ${reminderType}`;
                                if (!existingTitles.has(title) && !existingTitles.has(`🚨 Escalate: ${title}`)) {
                                    const missing = await isMissingLog(reminderType);
                                    if (missing) {
                                        newAlerts.push({
                                            user_id: user.id,
                                            title: title,
                                            description: `It's past ${config.time}. Don't forget your ${reminderType.toLowerCase()}!`,
                                            category: 'Reminder',
                                            priority: 'medium',
                                            icon: 'bell',
                                            source_module: reminderType,
                                            action_type: `OPEN_APP`,
                                            status: 'active'
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

                if (newAlerts.length > 0) {
                    await supabase.from('command_center_items').insert(newAlerts);
                    
                    if (tasksToMarkNotified.length > 0) {
                        await supabase.from('tasks').update({ notification_sent: true }).in('id', tasksToMarkNotified);
                    }
                    
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

        runEngine();
        const intervalId = setInterval(runEngine, 60000);
        return () => clearInterval(intervalId);
    }, [user, userProfile]);
}
