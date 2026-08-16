import { NextResponse } from 'next/server';
import { supabaseAdmin, sendPushNotification } from '@/lib/notifications';

// This would typically be protected by a secret token in production (e.g. VERCEL_CRON_SECRET)
export async function GET(request: Request) {
    try {
        // 1. Fetch profiles that have push subscriptions
        const { data: profiles, error: profileErr } = await supabaseAdmin
            .from('profiles')
            .select('id, timezone, notification_settings')
            .not('timezone', 'is', null);

        if (profileErr || !profiles) {
            console.error(profileErr);
            return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
        }

        let processedCount = 0;

        for (const profile of profiles) {
            const userId = profile.id;
            
            // Handle parsing notification_settings (could be JSONB object or string depending on schema)
            let settings = profile.notification_settings;
            if (typeof settings === 'string') {
                try { settings = JSON.parse(settings); } catch (e) { settings = {}; }
            } else if (Array.isArray(settings)) {
                settings = settings[0] || {};
            } else if (!settings) {
                settings = {};
            }
                
            const plannerEnabled = settings.planner_reminders ?? true;
            const habitEnabled = settings.habit_reminders ?? true;
            
            if (!plannerEnabled && !habitEnabled) continue;

            // Compute the user's local current time based on their timezone
            const userTimezone = profile.timezone || 'UTC';
            const formatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: userTimezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

            const parts = formatter.formatToParts(new Date());
            const partMap = parts.reduce((acc: any, part) => {
                acc[part.type] = part.value;
                return acc;
            }, {});
            
            // local strings format
            const todayStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
            let hourStr = partMap.hour;
            if (hourStr === '24') hourStr = '00';
            const currentTimeStr = `${hourStr}:${partMap.minute}`;
            const nowIso = new Date().toISOString();

            const hourInt = parseInt(hourStr, 10);
            let settingsUpdated = false;

            // 2. Fetch pending tasks for this user
            const { data: pendingTasks, error: taskErr } = await supabaseAdmin
                .from('tasks')
                .select('id, title, full_title, priority, notification_sent')
                .eq('user_id', userId)
                .eq('completed', false)
                .or(`reminder_time.lte."${nowIso}",and(due_date.eq."${todayStr}",due_time.lte."${currentTimeStr}"),due_date.lt."${todayStr}"`);

            let sentTaskNagThisHour = false;
            const tasksToMark: string[] = [];

            // 3. Dispatch Push Notifications for Tasks
            if (pendingTasks && pendingTasks.length > 0) {
                const shouldNag = (hourInt % 4 === 0) && (settings.last_task_nag_hour !== hourStr) && (settings.last_task_nag_date !== todayStr || settings.last_task_nag_hour !== hourStr);
                
                for (const task of pendingTasks) {
                    if (!task.notification_sent || shouldNag) {
                        const payload = {
                            title: task.notification_sent ? `⚠️ Overdue Task` : task.title,
                            description: task.notification_sent ? `OVERDUE: ${task.full_title || task.title}` : `Task Due: ${task.full_title || task.title}`,
                            url: '/planner'
                        };

                        const res = await sendPushNotification(userId, payload);
                        if (res.success) {
                            if (!task.notification_sent) tasksToMark.push(task.id);
                            processedCount++;
                            sentTaskNagThisHour = true;
                        } else if (res.reason === 'No subscriptions found') {
                            if (!task.notification_sent) tasksToMark.push(task.id);
                            sentTaskNagThisHour = true; // prevent infinite retries if no sub
                        }
                    }
                }
                
                if (shouldNag && sentTaskNagThisHour) {
                    settings.last_task_nag_hour = hourStr;
                    settings.last_task_nag_date = todayStr;
                    settingsUpdated = true;
                }
            }

            // 4. Mark tasks as initially notified
            if (tasksToMark.length > 0) {
                await supabaseAdmin
                    .from('tasks')
                    .update({ notification_sent: true })
                    .in('id', tasksToMark);
            }

            // 5. Daily Logging Reminders (Persistent Nagging every 2h from 18:00)
            if (habitEnabled) {
                if (hourInt >= 18 && hourInt % 2 === 0) {
                    const lastReminderHour = settings.last_daily_reminder_hour;
                    const lastReminderDate = settings.last_daily_reminder_date;
                    
                    if (lastReminderDate !== todayStr || lastReminderHour !== hourStr) {
                        // Check if they already logged sleep or journal today
                        const { data: dailyLog } = await supabaseAdmin
                            .from('daily_logs')
                            .select('sleep_hours, reflection')
                            .eq('user_id', userId)
                            .eq('date', todayStr)
                            .single();
                        
                        const hasSleep = dailyLog && dailyLog.sleep_hours > 0;
                        const hasJournal = dailyLog && dailyLog.reflection && dailyLog.reflection.length > 5;

                        if (!hasSleep || !hasJournal) {
                            const res = await sendPushNotification(userId, {
                                title: 'End of Day Check-in',
                                description: 'Time to wrap up! Don\'t forget to log your sleep and journal your day.',
                                url: '/planner?tab=reflect'
                            });

                            if (res.success || res.reason === 'No subscriptions found') {
                                settings.last_daily_reminder_date = todayStr;
                                settings.last_daily_reminder_hour = hourStr;
                                settingsUpdated = true;
                                if (res.success) processedCount++;
                            }
                        } else {
                            // Already logged everything, set flag so we stop checking today
                            settings.last_daily_reminder_date = todayStr;
                            settings.last_daily_reminder_hour = '24'; // Won't trigger again today
                            settingsUpdated = true;
                        }
                    }
                }
            }
            
            // 6. Save updated profile settings if needed
            if (settingsUpdated) {
                await supabaseAdmin
                    .from('profiles')
                    .update({ notification_settings: settings })
                    .eq('id', userId);
            }

            // 7. Financial Reminders (Nag once on or after due date starting at 9:00 AM local)
            if (hourInt >= 9) {
                const { data: finReminders } = await supabaseAdmin
                    .from('financial_reminders')
                    .select('id, text, date, notification_sent')
                    .eq('user_id', userId)
                    .eq('completed', false)
                    .eq('notification_sent', false)
                    .not('date', 'is', null)
                    .lte('date', todayStr);

                if (finReminders && finReminders.length > 0) {
                    const finTasksToMark: string[] = [];
                    for (const fin of finReminders) {
                        const res = await sendPushNotification(userId, {
                            title: 'Financial Reminder',
                            description: fin.text,
                            url: '/budget-tracker'
                        });
                        
                        if (res.success || res.reason === 'No subscriptions found') {
                            finTasksToMark.push(fin.id);
                            if (res.success) processedCount++;
                        }
                    }

                    if (finTasksToMark.length > 0) {
                        await supabaseAdmin
                            .from('financial_reminders')
                            .update({ notification_sent: true })
                            .in('id', finTasksToMark);
                    }
                }
            }
        }

        return NextResponse.json({ success: true, processed: processedCount });
    } catch (error: any) {
        console.error('Cron error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
