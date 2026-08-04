import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCommandCenterEngine() {
    const { userProfile, user } = useAuth();
    const hasRunRef = useRef(false);

    useEffect(() => {
        // Run only once per session/mount for logged in users
        if (!user || !userProfile || hasRunRef.current) return;
        
        const runEngine = async () => {
            hasRunRef.current = true;
            try {
                // 1. Fetch notification settings to see if AI Insights are enabled
                const { data: settings } = await supabase
                    .from('notification_settings')
                    .select('ai_insights')
                    .eq('user_id', user.id)
                    .maybeSingle();
                
                if (settings?.ai_insights === false) return; // User disabled insights

                // 2. We will analyze the last 7 days of logs
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const dateStr = sevenDaysAgo.toISOString().split('T')[0];

                const { data: recentLogs } = await supabase
                    .from('daily_logs')
                    .select('date, sleep_hours, water_ml_total, weight_kg')
                    .eq('user_id', user.id)
                    .gte('date', dateStr)
                    .order('date', { ascending: false });

                const newInsights: Record<string, unknown>[] = [];

                if (recentLogs && recentLogs.length > 0) {
                    // Check for inconsistent sleep (e.g., < 6 hours on multiple days)
                    const shortSleepDays = recentLogs.filter(l => l.sleep_hours && l.sleep_hours < 6);
                    if (shortSleepDays.length >= 2) {
                        newInsights.push({
                            user_id: user.id,
                            title: 'Inconsistent Sleep Detected',
                            description: `You've had under 6 hours of sleep on multiple days this week. Rest is crucial for ${userProfile.fitnessGoal}. Try prioritizing an earlier bedtime tonight.`,
                            category: 'AI Insight',
                            priority: 'medium',
                            icon: 'moon',
                            source_module: 'Sleep',
                            action_type: 'OPEN_SLEEP',
                        });
                    }

                    // Check for water intake
                    const lowWaterDays = recentLogs.filter(l => l.water_ml_total < (userProfile.waterGoalMl * 0.5));
                    if (lowWaterDays.length >= 3) {
                        newInsights.push({
                            user_id: user.id,
                            title: 'Dehydration Risk',
                            description: 'You missed your water goal by over 50% for 3 days recently. Staying hydrated boosts energy and recovery.',
                            category: 'Health Alert',
                            priority: 'high',
                            icon: 'droplets',
                            source_module: 'Water',
                            action_type: 'OPEN_WATER',
                        });
                    }
                } else if (recentLogs && recentLogs.length === 0) {
                    // No logs at all? Recommend starting
                    newInsights.push({
                        user_id: user.id,
                        title: 'Kickstart Your Journey',
                        description: 'You haven\'t logged anything recently. Tracking your meals or workouts is the first step to hitting your goals!',
                        category: 'Immediate Action',
                        priority: 'high',
                        icon: 'rocket',
                        source_module: 'Planner',
                        action_type: 'OPEN_PLANNER',
                    });
                }

                if (newInsights.length > 0) {
                    // Check if similar insights already exist to avoid spamming
                    const { data: existing } = await supabase
                        .from('command_center_items')
                        .select('title')
                        .eq('user_id', user.id)
                        .eq('status', 'active');
                    
                    const existingTitles = new Set((existing || []).map(e => e.title));
                    const uniqueInsights = newInsights.filter(ins => !existingTitles.has(ins.title));

                    if (uniqueInsights.length > 0) {
                        await supabase.from('command_center_items').insert(uniqueInsights);
                    }
                }

            } catch (error) {
                console.error("Error in Command Center Engine", error);
            }
        };

        runEngine();
    }, [user, userProfile]);
}
