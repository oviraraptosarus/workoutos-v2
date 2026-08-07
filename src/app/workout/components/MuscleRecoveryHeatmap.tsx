'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Activity } from 'lucide-react';

type RecoveryStatus = 'Fresh' | 'Recovering' | 'Fatigued';

const MUSCLE_MAPPING: Record<string, string[]> = {
    'Push Day': ['Chest', 'Shoulders', 'Arms'],
    'Pull Day': ['Back', 'Arms'],
    'Leg Day': ['Legs'],
    'Full Body Core': ['Chest', 'Back', 'Legs', 'Arms', 'Core'],
    'Core Crusher': ['Core'],
    '5x5 Strength': ['Legs', 'Chest', 'Back'],
    'Upper Body Power': ['Chest', 'Shoulders', 'Arms', 'Back'],
};

export default function MuscleRecoveryHeatmap() {
    const { user } = useAuth();
    const [recovery, setRecovery] = useState<Record<string, RecoveryStatus>>({
        Chest: 'Fresh',
        Back: 'Fresh',
        Legs: 'Fresh',
        Arms: 'Fresh',
        Shoulders: 'Fresh',
        Core: 'Fresh'
    });

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const today = new Date();
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(today.getDate() - 3);

            const { data: workouts } = await supabase
                .from('workout_logs')
                .select('date, session_type')
                .eq('user_id', user.id)
                .gte('date', threeDaysAgo.toISOString().split('T')[0])
                .order('date', { ascending: false });

            const newRecovery: Record<string, RecoveryStatus> = {
                Chest: 'Fresh',
                Back: 'Fresh',
                Legs: 'Fresh',
                Arms: 'Fresh',
                Shoulders: 'Fresh',
                Core: 'Fresh'
            };

            if (workouts) {
                const todayStr = today.toISOString().split('T')[0];
                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                workouts.forEach(w => {
                    const muscles = MUSCLE_MAPPING[w.session_type] || [];
                    muscles.forEach(m => {
                        if (w.date === todayStr) {
                            newRecovery[m] = 'Fatigued';
                        } else if (w.date === yesterdayStr && newRecovery[m] !== 'Fatigued') {
                            newRecovery[m] = 'Recovering';
                        }
                    });
                });
            }

            setRecovery(newRecovery);
        };
        
        load();
        const handleUpdate = () => load();
        window.addEventListener('workout_os_recent_workouts_updated', handleUpdate);
        window.addEventListener('workout_os_refresh', handleUpdate);
        return () => {
            window.removeEventListener('workout_os_recent_workouts_updated', handleUpdate);
            window.removeEventListener('workout_os_refresh', handleUpdate);
        };
    }, [user]);

    const getColor = (status: RecoveryStatus) => {
        if (status === 'Fatigued') return 'bg-activity-red/20 text-activity-red border-activity-red/30';
        if (status === 'Recovering') return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
        return 'bg-activity-green/20 text-activity-green border-activity-green/30';
    };

    const getIconColor = (status: RecoveryStatus) => {
        if (status === 'Fatigued') return 'bg-activity-red';
        if (status === 'Recovering') return 'bg-yellow-500';
        return 'bg-activity-green';
    };

    return (
        <div className="bg-surface-container-low border border-surface-variant rounded-2xl p-4 sm:p-5 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2 mb-4">
                <Activity size={16} className="text-tertiary" /> 
                Muscle Recovery
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(recovery).map(([muscle, status]) => (
                    <div key={muscle} className={`flex items-center justify-between p-3 rounded-xl border ${getColor(status)} transition-colors`}>
                        <span className="font-bold text-sm tracking-wide">{muscle}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-black opacity-80 hidden sm:block">{status}</span>
                            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${getIconColor(status)}`} />
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="flex items-center justify-center gap-4 mt-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-activity-green shadow-[0_0_8px_#32d74b]"></div> Fresh</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308]"></div> Recovering</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-activity-red shadow-[0_0_8px_#ff6b6b]"></div> Fatigued</div>
            </div>
        </div>
    );
}
