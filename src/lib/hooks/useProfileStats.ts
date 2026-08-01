'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfileStats {
    /** Consecutive days with activity, counting back from today (or yesterday if today is not yet logged). */
    currentStreak: number;
    /** Longest run of consecutive active days on record. */
    bestStreak: number;
    /** 1 + one level per full week of logged days. */
    level: number;
    /** Distinct days with any logged activity. */
    daysLogged: number;
    /** Days still needed to reach the next level. */
    daysToNextLevel: number;
    loading: boolean;
}

const DAYS_PER_LEVEL = 7;

/** Local YYYY-MM-DD. Avoids toISOString(), which shifts the date for users behind UTC. */
function toLocalKey(d: Date): string {
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
}

function dayDiff(aKey: string, bKey: string): number {
    const [ay, am, ad] = aKey.split('-').map(Number);
    const [by, bm, bd] = bKey.split('-').map(Number);
    const a = Date.UTC(ay, am - 1, ad);
    const b = Date.UTC(by, bm - 1, bd);
    return Math.round((a - b) / 86_400_000);
}

/**
 * Derives streak/level from real logged rows.
 *
 * A "Rank" percentile is deliberately absent: RLS scopes every table to the
 * current user, so cross-user ranking is not computable client-side. Best
 * streak is shown instead — self-relative and honest.
 */
export function useProfileStats(): ProfileStats {
    const { user } = useAuth();
    const [stats, setStats] = useState<Omit<ProfileStats, 'loading'>>({
        currentStreak: 0,
        bestStreak: 0,
        level: 1,
        daysLogged: 0,
        daysToNextLevel: DAYS_PER_LEVEL,
    });
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        const [daily, workouts] = await Promise.all([
            supabase
                .from('daily_logs')
                .select('date, water_ml_total, sleep_hours, weight_kg, mood_rating, steps')
                .eq('user_id', user.id),
            supabase
                .from('workout_logs')
                .select('date')
                .eq('user_id', user.id),
        ]);

        const active = new Set<string>();

        // A daily_logs row can exist with all-zero columns (e.g. created by an
        // unrelated upsert), so require at least one real signal before counting it.
        for (const row of daily.data ?? []) {
            const hasSignal =
                (row.water_ml_total ?? 0) > 0 ||
                (row.sleep_hours ?? 0) > 0 ||
                (row.weight_kg ?? 0) > 0 ||
                (row.mood_rating ?? 0) > 0 ||
                (row.steps ?? 0) > 0;
            if (hasSignal && row.date) active.add(row.date);
        }
        for (const row of workouts.data ?? []) {
            if (row.date) active.add(row.date);
        }

        const keys = [...active].sort().reverse(); // newest first
        const daysLogged = keys.length;

        // Current streak: allow today to be unlogged so the streak does not
        // read as broken before the user has logged anything today.
        let currentStreak = 0;
        if (keys.length) {
            const today = toLocalKey(new Date());
            const gap = dayDiff(today, keys[0]);
            if (gap <= 1) {
                currentStreak = 1;
                for (let i = 1; i < keys.length; i++) {
                    if (dayDiff(keys[i - 1], keys[i]) === 1) currentStreak++;
                    else break;
                }
            }
        }

        let bestStreak = 0;
        let run = 0;
        for (let i = 0; i < keys.length; i++) {
            if (i === 0 || dayDiff(keys[i - 1], keys[i]) === 1) run++;
            else run = 1;
            if (run > bestStreak) bestStreak = run;
        }

        const level = 1 + Math.floor(daysLogged / DAYS_PER_LEVEL);
        const daysToNextLevel = DAYS_PER_LEVEL - (daysLogged % DAYS_PER_LEVEL);

        setStats({
            currentStreak,
            bestStreak: Math.max(bestStreak, currentStreak),
            level,
            daysLogged,
            daysToNextLevel,
        });
        setLoading(false);
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    // Keep in sync with the same events the rest of the app broadcasts on write.
    useEffect(() => {
        const onChange = () => load();
        const events = [
            'storage',
            'workout_os_water_updated',
            'workout_os_diet_updated',
            'workout_os_recent_workouts_updated',
        ];
        events.forEach((e) => window.addEventListener(e, onChange));
        return () => events.forEach((e) => window.removeEventListener(e, onChange));
    }, [load]);

    return { ...stats, loading };
}
