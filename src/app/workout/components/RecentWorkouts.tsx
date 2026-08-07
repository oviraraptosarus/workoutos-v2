'use client';

import React from 'react';
import { Clock, TrendingUp, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export default function RecentWorkouts() {
    const { t } = useLanguage();
    const [pastWorkouts, setPastWorkouts] = React.useState<any[]>([]);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const { user } = useAuth();

    const loadWorkouts = React.useCallback(async () => {
        if (!user) return;
        
        const { data } = await supabase
            .from('workout_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (data) {
            const mapped = data.map(d => {
                const metadata = d.exercises?.find((e: any) => e.type === 'metadata') || {};
                
                const customName = metadata.custom_name || d.custom_name;
                const durationMins = metadata.duration_minutes || d.duration_minutes;
                const caloriesBurned = metadata.calories_burned || d.calories_burned;

                const title = customName || d.session_type;
                const durStr = durationMins ? `${durationMins} min` : (metadata.duration || 'Completed');
                const extraMetric = metadata.metric_value ? ` • ${metadata.metric_value} ${metadata.metric_label || ''}` : '';
                const dur = durStr + extraMetric;
                const cal = caloriesBurned ? `${caloriesBurned} kcal burned` : (metadata.volume || 'Check logs');

                return {
                    id: d.id,
                    name: title,
                    date: d.date,
                    duration: dur,
                    volume: cal,
                    cals_burned_raw: caloriesBurned || 0,
                    session_type: d.session_type,
                    steps_added: metadata.steps_added || 0
                };
            });
            setPastWorkouts(mapped);
        }
    }, [user]);

    React.useEffect(() => {
        loadWorkouts();
        window.addEventListener('workout_os_recent_workouts_updated', loadWorkouts);
        return () => window.removeEventListener('workout_os_recent_workouts_updated', loadWorkouts);
    }, [loadWorkouts]);

    const handleDelete = async (e: React.MouseEvent, workoutId: string, dateKey: string, calsToRemove: number) => {
        e.stopPropagation();
        if (!user) return;
        if (!confirm('Are you sure you want to delete this session?')) return;

        setIsDeleting(workoutId);
        try {
            // Delete the workout
            await supabase.from('workout_logs').delete().eq('id', workoutId);

            // Find the workout in local state to know if it's steps
            const workout = pastWorkouts.find(w => w.id === workoutId);

            // Subtract calories and/or steps from daily_logs if applicable
            if (workout) {
                const { data: currentLog } = await supabase
                    .from('daily_logs')
                    .select('activity_burned, steps')
                    .eq('user_id', user.id)
                    .eq('date', dateKey)
                    .maybeSingle();
                
                let currentBurned = currentLog?.activity_burned || 0;
                let currentSteps = currentLog?.steps || 0;

                let updates: any = {};
                if (calsToRemove > 0) {
                    updates.activity_burned = Math.max(0, currentBurned - calsToRemove);
                }
                
                if (workout.session_type === 'Steps' && workout.steps_added > 0) {
                    updates.steps = Math.max(0, currentSteps - workout.steps_added);
                }

                if (Object.keys(updates).length > 0) {
                    await supabase
                        .from('daily_logs')
                        .upsert({
                            user_id: user.id,
                            date: dateKey,
                            ...updates
                        }, { onConflict: 'user_id,date' });
                }
            }

            window.dispatchEvent(new Event('workout_os_recent_workouts_updated'));
            window.dispatchEvent(new Event('workout_os_activity_updated'));
            window.dispatchEvent(new Event('workout_os_refresh'));
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('Error deleting workout:', error);
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="bg-surface-container-low border border-surface-variant rounded-2xl p-4 sm:p-5 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider ml-1 mb-4 flex items-center gap-2">{t('workout.pastSessions')}</h3>
            
            <div className="space-y-3">
                {pastWorkouts.length === 0 ? (
                    <div className="py-6 text-center text-on-surface-variant">
                        <p className="text-xs font-medium">{t('workout.noRecent')}</p>
                        <p className="text-[10px] mt-1">{t('workout.completeToSee')}</p>
                    </div>
                ) : (
                    pastWorkouts.map(workout => (
                        <div key={workout.id} className="group relative p-4 rounded-2xl bg-surface-container-lowest border border-surface-variant transition-colors shadow-sm hover:bg-surface-container cursor-pointer overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-black text-on-surface drop-shadow-sm truncate pr-16">{workout.name}</h4>
                                <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full border border-surface-variant shadow-sm shrink-0">
                                    {workout.date}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs font-bold text-on-surface-variant">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={14} className="text-secondary" />
                                    <span>{workout.duration}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <TrendingUp size={14} className="text-primary" />
                                    <span>{workout.volume}</span>
                                </div>
                            </div>

                            <button 
                                onClick={(e) => handleDelete(e, workout.id, workout.date, workout.cals_burned_raw)}
                                disabled={isDeleting === workout.id}
                                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-error-container text-on-error-container hover:bg-error hover:text-white transition-all transform ${isDeleting === workout.id ? 'opacity-50 cursor-not-allowed' : 'opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'}`}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
