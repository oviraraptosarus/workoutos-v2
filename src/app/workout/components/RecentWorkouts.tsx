'use client';

import React from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function RecentWorkouts() {
    const { t } = useLanguage();
    const [pastWorkouts, setPastWorkouts] = React.useState<any[]>([]);

    React.useEffect(() => {
        const loadWorkouts = async () => {
            const { data: { user } } = await supabase.auth.getUser();
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
                    return {
                        id: d.id,
                        name: d.session_type,
                        date: d.date,
                        duration: metadata.duration || 'Completed',
                        volume: metadata.volume || 'Check logs'
                    };
                });
                setPastWorkouts(mapped);
            }
        };
        loadWorkouts();
        window.addEventListener('workout_os_recent_workouts_updated', loadWorkouts);
        return () => window.removeEventListener('workout_os_recent_workouts_updated', loadWorkouts);
    }, []);

    return (
        <div className="bg-surface-container-low border border-surface-variant rounded-[2rem] p-6 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider ml-1 mb-4 flex items-center gap-2">Past Sessions</h3>
            
            <div className="space-y-3">
                {pastWorkouts.length === 0 ? (
                    <div className="py-6 text-center text-on-surface-variant">
                        <p className="text-xs font-medium">No recent sessions.</p>
                        <p className="text-[10px] mt-1">Complete a workout to see your history here.</p>
                    </div>
                ) : (
                    pastWorkouts.map(workout => (
                        <div key={workout.id} className="group p-4 rounded-2xl bg-surface-container-lowest border border-surface-variant transition-colors shadow-sm hover:bg-surface-container cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-black text-on-surface drop-shadow-sm">{workout.name}</h4>
                                <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full border border-surface-variant shadow-sm">
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
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
