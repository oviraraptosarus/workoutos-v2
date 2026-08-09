'use client';

import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Trash2, Edit2, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRewardSystem } from '@/lib/hooks/useRewardSystem';

interface CustomWorkout {
    id: string;
    title: string;
    subtitle: string;
    iconType: string;
    duration: string;
    intensity: string;
    color: string;
    exercises: { name: string; sets: string; youtubeUrl: string }[];
}

interface CustomWorkoutsProps {
    onPlay: (workout: CustomWorkout) => void;
}

export default function CustomWorkouts({ onPlay }: CustomWorkoutsProps) {
    const { t } = useLanguage();
    const { triggerTap, triggerPop, triggerSuccess } = useRewardSystem();
    const [customWorkouts, setCustomWorkouts] = useState<CustomWorkout[]>([]);
    
    useEffect(() => {
        const loadWorkouts = () => {
            const saved = localStorage.getItem('workout_os_custom_workouts');
            if (saved) {
                setCustomWorkouts(JSON.parse(saved));
            } else {
                setCustomWorkouts([]);
            }
        };
        loadWorkouts();
        
        window.addEventListener('storage', loadWorkouts);
        return () => window.removeEventListener('storage', loadWorkouts);
    }, []);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        triggerPop();
        if (confirm('Are you sure you want to delete this custom workout?')) {
            const updated = customWorkouts.filter(w => w.id !== id);
            setCustomWorkouts(updated);
            localStorage.setItem('workout_os_custom_workouts', JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
        }
    };

    return (
        <div className="bg-surface-container/30 backdrop-blur-3xl border border-white/10 dark:border-white/5 p-6 rounded-[32px] shadow-[0_20px_40px_rgb(0,0,0,0.06)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.3)] h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                        <Dumbbell size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-on-surface tracking-tight">
                            My Workouts
                        </h3>
                        <p className="text-xs font-medium text-on-surface-variant">
                            Custom routines & AI suggestions
                        </p>
                    </div>
                </div>
                
                <button 
                    className="p-2 rounded-full bg-surface-container hover:bg-surface-container-highest transition-colors text-on-surface"
                    title="Create New Routine"
                    onClick={() => alert("Custom Routine Builder coming soon in next feature drop!")}
                >
                    <Plus size={18} />
                </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
                {customWorkouts.length === 0 ? (
                    <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center px-4 border-2 border-dashed border-white/5 rounded-2xl">
                        <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center mb-4">
                            <Dumbbell size={24} className="text-on-surface-variant opacity-50" />
                        </div>
                        <h4 className="text-sm font-semibold text-on-surface mb-1">No Custom Workouts</h4>
                        <p className="text-xs text-on-surface-variant mb-4">Create your own routine or ask AI to generate one for you.</p>
                        <button 
                            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-full text-xs font-bold uppercase tracking-wider"
                            onClick={() => window.dispatchEvent(new Event('open-ai-copilot'))}
                        >
                            Ask AI
                        </button>
                    </div>
                ) : (
                    customWorkouts.map((workout) => (
                        <div 
                            key={workout.id}
                            className="bg-surface-container/50 hover:bg-surface-container transition-colors rounded-2xl p-4 cursor-pointer group flex items-center justify-between border border-white/5"
                            onClick={() => {
                                triggerSuccess();
                                onPlay(workout);
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${workout.color}`}>
                                    <Play size={20} className="ml-1 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors">
                                        {workout.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">
                                        <span>{workout.exercises.length} Exercises</span>
                                        <span>•</span>
                                        <span>{workout.duration}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                className="p-2 rounded-full text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                onClick={(e) => handleDelete(workout.id, e)}
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
