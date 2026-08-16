import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { useAppBadge } from '@/lib/hooks/useAppBadge';

export interface DailySnapshot {
    isEmpty: boolean;
    completionPercentage: number;
    waterProgress: { current: number; target: number };
    caloriesProgress: { current: number; target: number };
    proteinProgress: { current: number; target: number };
    sleepProgress: { current: number; target: number };
    burnProgress: { current: number; target: number };
    workoutName: string | null;
    missingActivity: string | null;
    plannerState: { total: number; completed: number };
    streak: number;
    momentumScore: number;
    nextReminder: string | null;
    aiInsight: { title: string; description: string } | null;
    immediateAction: { title: string; description: string; actionType: string } | null;
    loading: boolean;
    timestamp: number; // for debugging
    isRestDay: boolean;
}

export function useDailySnapshot() {
    const { user, userProfile } = useAuth();
    const { selectedDate } = useDate();
    const { setBadge } = useAppBadge();
    const [snapshot, setSnapshot] = useState<DailySnapshot>({
        isEmpty: true,
        completionPercentage: 0,
        waterProgress: { current: 0, target: 3000 },
        caloriesProgress: { current: 0, target: 2000 },
        proteinProgress: { current: 0, target: 150 },
        sleepProgress: { current: 0, target: 8 },
        burnProgress: { current: 0, target: 500 },
        workoutName: null,
        missingActivity: null,
        plannerState: { total: 0, completed: 0 },
        streak: 0,
        momentumScore: 0,
        nextReminder: null,
        aiInsight: null,
        immediateAction: null,
        loading: true,
        timestamp: Date.now(),
        isRestDay: false,
    });

    const fetchSnapshot = useCallback(async () => {
        if (!user) return;
        
        const dateKey = selectedDate || new Date().toLocaleDateString('en-CA');
        
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const thirtyDaysAgoStr = thirtyDaysAgo.toLocaleDateString('en-CA');

            const [
                { data: logs },
                { data: meals },
                { data: workouts },
                { data: tasks },
                { data: pastLogs },
                { data: pastWorkouts },
                { data: reminders }
            ] = await Promise.all([
                supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('date', dateKey).maybeSingle(),
                supabase.from('meal_entries').select('calories, protein').eq('user_id', user.id).eq('date', dateKey),
                supabase.from('workout_logs').select('session_type, completed').eq('user_id', user.id).eq('date', dateKey),
                supabase.from('tasks').select('completed').eq('user_id', user.id).eq('date', dateKey),
                supabase.from('daily_logs').select('date, water_ml_total, sleep_hours, reflection, activity_burned').eq('user_id', user.id).gte('date', thirtyDaysAgoStr).order('date', { ascending: false }),
                supabase.from('workout_logs').select('date').eq('user_id', user.id).gte('date', thirtyDaysAgoStr).order('date', { ascending: false }),
                supabase.from('command_center_items').select('title, due_at').eq('user_id', user.id).eq('category', 'Reminder').eq('status', 'active').not('due_at', 'is', null).order('due_at', { ascending: true }).limit(1)
            ]);

            const isRestDay = logs?.is_rest_day || false;
            const waterCurrent = logs?.water_ml_total || 0;
            const waterTarget = userProfile?.waterGoalMl || 3000;
            const sleepCurrent = logs?.sleep_hours || 0;
            const sleepTarget = userProfile?.sleepGoal || 8;
            
            const caloriesCurrent = meals?.reduce((acc: number, m: any) => acc + (m.calories || 0), 0) || 0;
            const proteinCurrent = meals?.reduce((acc: number, m: any) => acc + (m.protein || 0), 0) || 0;
            const caloriesTarget = userProfile?.calorieGoal || 2000;
            const proteinTarget = (userProfile as any)?.proteinGoal || 150;

            const burnCurrent = logs?.activity_burned || 0;
            const burnTarget = (userProfile as any)?.daily_burn_goal || 500;

            const totalTasks = tasks?.length || 0;
            const completedTasks = tasks?.filter(t => t.completed).length || 0;

            const workoutToday = workouts?.[0] || null;
            const workoutName = workoutToday ? (workoutToday.session_type || 'Workout') : null;

            const isEmpty = 
                waterCurrent === 0 && 
                sleepCurrent === 0 && 
                caloriesCurrent === 0 && 
                burnCurrent === 0 &&
                !workoutToday && 
                completedTasks === 0 &&
                !logs?.reflection;

            let possiblePoints = 0;
            let earnedPoints = 0;

            possiblePoints += 1;
            if (waterCurrent >= waterTarget) earnedPoints += 1;

            possiblePoints += 1;
            if (sleepCurrent >= sleepTarget) earnedPoints += 1;

            possiblePoints += 1;
            if (caloriesCurrent > 0) earnedPoints += 1;

            possiblePoints += 1;
            if (workoutToday?.completed) earnedPoints += 1;
            
            possiblePoints += 1;
            if (burnCurrent >= burnTarget) earnedPoints += 1;

            if (totalTasks > 0) {
                possiblePoints += 1;
                if (completedTasks === totalTasks) earnedPoints += 1;
            }

            possiblePoints += 1;
            if (logs?.reflection) earnedPoints += 1;

            const completionPercentage = possiblePoints > 0 ? Math.round((earnedPoints / possiblePoints) * 100) : 0;

            let missingActivity = null;
            if (!workoutToday) missingActivity = 'No workout logged today';
            else if (waterCurrent < waterTarget) missingActivity = `Only ${waterCurrent}ml / ${waterTarget}ml water`;
            else if (sleepCurrent < sleepTarget) missingActivity = `Only ${sleepCurrent}h / ${sleepTarget}h sleep`;
            else if (burnCurrent < burnTarget) missingActivity = `Burned ${burnCurrent} / ${burnTarget} kcal`;
            else if (!logs?.reflection) missingActivity = 'Journal reflection not filled';
            else if (totalTasks > completedTasks) missingActivity = `${totalTasks - completedTasks} pending planner tasks`;

            // Calculate Streak
            // A streak day is any day with water > 0, sleep > 0, reflection, or a workout
            const activeDates = new Set<string>();
            pastLogs?.forEach(log => {
                if ((log.water_ml_total || 0) > 0 || (log.sleep_hours || 0) > 0 || log.reflection || (log.activity_burned || 0) > 0) {
                    activeDates.add(log.date);
                }
            });
            pastWorkouts?.forEach(w => activeDates.add(w.date));
            
            let streakCount = 0;
            let checkDate = new Date(); // Start checking from today
            
            for (let i = 0; i < 30; i++) {
                const dStr = checkDate.toLocaleDateString('en-CA');
                if (activeDates.has(dStr)) {
                    streakCount++;
                } else if (i === 0) {
                    // It's okay if today is missed (maybe they haven't logged yet), check yesterday
                } else {
                    break; // Missed a day in the past, streak is broken
                }
                checkDate.setDate(checkDate.getDate() - 1);
            }

            // Momentum Score (0-100)
            // Weighs today's completion (50%) and the streak (50%)
            const streakFactor = Math.min(streakCount / 7, 1); // Cap at 7 days
            const momentumScore = Math.round((completionPercentage * 0.5) + (streakFactor * 100 * 0.5));

            // Next Reminder
            const nextReminder = reminders?.[0] ? `${reminders[0].title} (${new Date(reminders[0].due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : null;

            // AI Insight
            let aiInsight = null;
            if (isEmpty) {
                aiInsight = { title: 'Log more activity to unlock personalized insights', description: "We need a bit more data to find patterns in your routine." };
            } else if (waterCurrent < waterTarget) {
                aiInsight = { title: 'Hydration Deficit', description: `You're ${waterTarget - waterCurrent}ml away from your daily goal. Proper hydration boosts recovery.` };
            } else if (sleepCurrent > 0 && sleepCurrent < sleepTarget) {
                aiInsight = { title: 'Recovery Alert', description: `You missed your sleep target by ${sleepTarget - sleepCurrent} hours. Try to get to bed early tonight.` };
            } else if (workoutToday) {
                aiInsight = { title: 'Momentum Building', description: 'Great job logging your workout today. Nutrition and sleep are the next pillars to focus on.' };
            } else {
                aiInsight = { title: 'On Track', description: 'You are hitting your targets today. Keep up the great work!' };
            }

            // Immediate Action
            let immediateAction = null;
            if (totalTasks > completedTasks) {
                immediateAction = { title: 'Pending Tasks', description: `You have ${totalTasks - completedTasks} incomplete planner tasks.`, actionType: 'PLANNER' };
            } else if (!workoutToday) {
                immediateAction = { title: 'No workout logged', description: 'Ready to crush a session today?', actionType: 'WORKOUT' };
            } else if (waterCurrent < waterTarget) {
                immediateAction = { title: 'Drink Water', description: 'Your hydration is low. Log some water now.', actionType: 'WATER' };
            } else if (!logs?.reflection) {
                immediateAction = { title: 'Daily Reflection', description: 'Take 2 minutes to reflect on your day.', actionType: 'JOURNAL' };
            }

            setSnapshot({
                isEmpty,
                completionPercentage,
                waterProgress: { current: waterCurrent, target: waterTarget },
                caloriesProgress: { current: caloriesCurrent, target: caloriesTarget },
                proteinProgress: { current: proteinCurrent, target: proteinTarget },
                sleepProgress: { current: sleepCurrent, target: sleepTarget },
                burnProgress: { current: burnCurrent, target: burnTarget },
                workoutName,
                missingActivity,
                plannerState: { total: totalTasks, completed: completedTasks },
                streak: streakCount,
                momentumScore,
                nextReminder,
                aiInsight,
                immediateAction,
                loading: false,
                timestamp: Date.now(),
                isRestDay,
            });
            
        } catch (err) {
            console.error("Failed to fetch daily snapshot:", err);
            setSnapshot(prev => ({ ...prev, loading: false }));
        }
    }, [user, userProfile, selectedDate]);

    useEffect(() => {
        fetchSnapshot();
        const handleRefresh = () => fetchSnapshot();
        window.addEventListener('workout_os_refresh', handleRefresh);
        window.addEventListener('workout_os_tasks_updated', handleRefresh);
        window.addEventListener('workout_os_activity_updated', handleRefresh);
        window.addEventListener('workout_os_recent_workouts_updated', handleRefresh);
        return () => {
            window.removeEventListener('workout_os_refresh', handleRefresh);
            window.removeEventListener('workout_os_tasks_updated', handleRefresh);
            window.removeEventListener('workout_os_activity_updated', handleRefresh);
            window.removeEventListener('workout_os_recent_workouts_updated', handleRefresh);
        };
    }, [fetchSnapshot]);

    useEffect(() => {
        const uncompleted = snapshot.plannerState.total - snapshot.plannerState.completed;
        setBadge(uncompleted > 0 ? uncompleted : 0);
    }, [snapshot.plannerState, setBadge]);

    return { snapshot, refreshSnapshot: fetchSnapshot };
}

