'use client';

import React from 'react';
import { Clock, TrendingUp } from 'lucide-react';

export default function RecentWorkouts() {
    const [pastWorkouts, setPastWorkouts] = React.useState<any[]>([]);

    React.useEffect(() => {
        const loadWorkouts = () => {
            try {
                const saved = JSON.parse(localStorage.getItem('workout_os_recent_workouts') || '[]');
                if (saved && Array.isArray(saved)) {
                    setPastWorkouts(saved);
                } else {
                    setPastWorkouts([]);
                }
            } catch (e) {
                setPastWorkouts([]);
            }
        };
        loadWorkouts();
        window.addEventListener('storage', loadWorkouts);
        return () => window.removeEventListener('storage', loadWorkouts);
    }, []);

    return (
        <div className="bg-white border border-gray-100 border-gray-200 rounded-3xl p-5 shadow-sm transition-all">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 mb-4">Past Sessions</h3>
            
            <div className="space-y-3">
                {pastWorkouts.length === 0 ? (
                    <div className="py-6 text-center text-gray-400">
                        <p className="text-xs font-medium">No recent sessions.</p>
                        <p className="text-[10px] mt-1">Complete a workout to see your history here.</p>
                    </div>
                ) : (
                    pastWorkouts.map(workout => (
                        <div key={workout.id} className="group p-4 rounded-2xl bg-gray-50 border border-gray-100 transition-colors shadow-sm hover:bg-gray-100 cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-black text-gray-900 drop-shadow-sm">{workout.name}</h4>
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                                    {workout.date}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={14} className="text-blue-500" />
                                    <span>{workout.duration}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <TrendingUp size={14} className="text-emerald-500" />
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
