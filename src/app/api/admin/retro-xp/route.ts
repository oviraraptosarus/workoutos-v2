import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { XPService } from '@/lib/xpService';

export async function GET(req: Request) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    let totalAwarded = 0;
    let eventsCount = 0;

    // 1. Fetch old workouts
    const { data: workouts } = await supabase
        .from('completed_workouts')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: true });

    if (workouts) {
        for (const workout of workouts) {
            let baseAmount = 50;
            if (workout.duration_minutes >= 60) baseAmount += 20;
            else if (workout.duration_minutes >= 45) baseAmount += 10;

            const res = await XPService.awardXP(
                userId,
                'workout_completed',
                baseAmount,
                workout.id,
                { duration: workout.duration_minutes }
            );
            if (res?.awarded) {
                totalAwarded += res.xpAwarded;
                eventsCount++;
            }
        }
    }

    // 2. Fetch old diet logs
    const { data: dietLogs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId);

    if (dietLogs) {
        for (const log of dietLogs) {
            // Give 15 XP for any day with water > 2000ml
            if (log.water_ml_total && log.water_ml_total >= 2000) {
                const res = await XPService.awardXP(
                    userId,
                    'daily_water_goal',
                    15,
                    `water_goal_met_${log.date}`,
                    { date: log.date, total: log.water_ml_total }
                );
                if (res?.awarded) {
                    totalAwarded += res.xpAwarded;
                    eventsCount++;
                }
            }
        }
    }

    // Return the summary
    const { data: profile } = await supabase.from('profiles').select('xp, level').eq('id', userId).single();

    return NextResponse.json({
        message: 'Retroactive XP applied',
        eventsProcessed: eventsCount,
        xpAwarded: totalAwarded,
        newTotalXp: profile?.xp,
        newLevel: profile?.level
    });
}
