import { NextResponse } from 'next/server';
import { supabaseAdmin, sendPushNotification } from '@/lib/notifications';

// This would typically be protected by a secret token in production (e.g. VERCEL_CRON_SECRET)
export async function GET(request: Request) {
    try {
        // 1. Fetch profiles that have push subscriptions
        const { data: profiles, error: profileErr } = await supabaseAdmin
            .from('profiles')
            .select('id, timezone, notification_settings(planner_reminders, habit_reminders)')
            .not('timezone', 'is', null);

        if (profileErr || !profiles) {
            console.error(profileErr);
            return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
        }

        let processedCount = 0;

        for (const profile of profiles) {
            const userId = profile.id;
            const settings = Array.isArray(profile.notification_settings) 
                ? profile.notification_settings[0] 
                : profile.notification_settings;
                
            const plannerEnabled = settings?.planner_reminders ?? true;
            
            if (!plannerEnabled) continue;

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

            // 2. Fetch pending tasks for this user
            const { data: pendingTasks, error: taskErr } = await supabaseAdmin
                .from('tasks')
                .select('id, title, full_title, priority')
                .eq('user_id', userId)
                .eq('completed', false)
                .eq('notification_sent', false)
                .or(`reminder_time.lte."${nowIso}",and(due_date.eq."${todayStr}",due_time.lte."${currentTimeStr}")`);

            if (taskErr || !pendingTasks || pendingTasks.length === 0) continue;

            const tasksToMark: string[] = [];

            // 3. Dispatch Push Notifications
            for (const task of pendingTasks) {
                const payload = {
                    title: task.title,
                    description: `Task Due: ${task.full_title || task.title}`,
                    url: '/planner'
                };

                const res = await sendPushNotification(userId, payload);
                if (res.success) {
                    tasksToMark.push(task.id);
                    processedCount++;
                } else if (res.reason === 'No subscriptions found') {
                    // Mark it as sent anyway so we don't infinitely retry a user without subscriptions
                    tasksToMark.push(task.id);
                }
            }

            // 4. Mark tasks as notified
            if (tasksToMark.length > 0) {
                await supabaseAdmin
                    .from('tasks')
                    .update({ notification_sent: true })
                    .in('id', tasksToMark);
            }
        }

        return NextResponse.json({ success: true, processed: processedCount });
    } catch (error: any) {
        console.error('Cron error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
