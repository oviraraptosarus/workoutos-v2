'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useDate } from '@/contexts/DateContext';
import { supabase } from '@/lib/supabaseClient';

interface Exercise {
    id: number;
    name: string;
    done: boolean;
}

const STORAGE_KEY = 'workout_os_workout_exercises';

export default function WorkoutCard() {
    const { selectedDate, isToday } = useDate();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [customExercise, setCustomExercise] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (!selectedDate) return;

        // Prefer the backend row so the dashboard matches /workout and survives
        // a device change; fall back to the local cache for older entries.
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('workout_logs')
                    .select('exercises')
                    .eq('user_id', user.id)
                    .eq('date', selectedDate)
                    .eq('session_type', 'dashboard-quick-log')
                    .maybeSingle();

                if (data?.exercises && Array.isArray(data.exercises) && data.exercises.length) {
                    setExercises(data.exercises as Exercise[]);
                    return;
                }
            }

            const saved = localStorage.getItem(`${STORAGE_KEY}_${selectedDate}`);
            if (saved) {
                try { setExercises(JSON.parse(saved)); } catch { setExercises([]); }
            } else {
                setExercises([]);
            }
        };

        load();
        window.addEventListener('storage', load);
        window.addEventListener('workout_os_recent_workouts_updated', load);
        return () => {
            window.removeEventListener('storage', load);
            window.removeEventListener('workout_os_recent_workouts_updated', load);
        };
    }, [selectedDate]);

    const save = async (updated: Exercise[]) => {
        if (!selectedDate) return;
        setExercises(updated);
        localStorage.setItem(`${STORAGE_KEY}_${selectedDate}`, JSON.stringify(updated));

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const allDone = updated.length > 0 && updated.every((e) => e.done);

        if (updated.length === 0) {
            await supabase
                .from('workout_logs')
                .delete()
                .eq('user_id', user.id)
                .eq('date', selectedDate)
                .eq('session_type', 'dashboard-quick-log');
        } else {
            // No unique constraint on (user_id, date, session_type), so look up
            // the existing row and update it rather than upserting a duplicate.
            const { data: existing } = await supabase
                .from('workout_logs')
                .select('id')
                .eq('user_id', user.id)
                .eq('date', selectedDate)
                .eq('session_type', 'dashboard-quick-log')
                .maybeSingle();

            if (existing?.id) {
                await supabase
                    .from('workout_logs')
                    .update({ exercises: updated, completed: allDone })
                    .eq('id', existing.id);
            } else {
                await supabase.from('workout_logs').insert({
                    user_id: user.id,
                    date: selectedDate,
                    session_type: 'dashboard-quick-log',
                    exercises: updated,
                    completed: allDone,
                });
            }
        }

        window.dispatchEvent(new Event('workout_os_recent_workouts_updated'));
        window.dispatchEvent(new Event('storage'));
    };

    const toggleExercise = (id: number) => {
        save(exercises.map(ex => ex.id === id ? { ...ex, done: !ex.done } : ex));
    };

    const addCustomExercise = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customExercise.trim() || adding) return;
        setAdding(true);
        await save([...exercises, { id: Date.now(), name: customExercise.trim(), done: false }]);
        setCustomExercise('');
        setAdding(false);
    };

    const done = exercises.filter(ex => ex.done).length;
    const progress = exercises.length > 0 ? (done / exercises.length) * 100 : 0;
    const isCompleted = exercises.length > 0 && progress === 100;

    return (
        <div className="bg-card-white dark:bg-surface-container-lowest rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/5 flex flex-col h-full relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">fitness_center</span>
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Workout</span>
                    {isCompleted && (
                        <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-activity-green/10 text-activity-green">
                            Done
                        </span>
                    )}
                </div>
                <Link href="/workout" aria-label="Workout details" className="flex items-center gap-0.5 font-label-sm text-label-sm text-on-surface-variant/50 active:scale-90 transition-transform">
                    {exercises.length > 0 && <span className="tabular-nums">{done}/{exercises.length}</span>}
                    <ChevronRight size={18} />
                </Link>
            </div>

            {exercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-4 mb-2">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high dark:bg-surface-container-high flex items-center justify-center text-on-surface-variant/50 shadow-inner">
                        <span className="material-symbols-outlined text-[24px]">fitness_center</span>
                    </div>
                    <div className="text-center">
                        <p className="font-label-md font-bold text-on-surface">No workouts yet</p>
                        <p className="font-label-sm text-xs text-on-surface-variant mt-0.5 mb-3">Time to crush your goals.</p>
                        <Link
                            href="/workout"
                            className="font-label-md text-xs font-bold text-on-primary bg-primary px-5 py-2.5 rounded-full active:scale-95 transition-transform shadow-sm"
                        >
                            Start your first workout
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden mb-3">
                        <div
                            className="h-full bg-activity-green rounded-full"
                            style={{ width: `${progress}%`, transition: 'width 500ms cubic-bezier(0.32,0.72,0,1)' }}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[132px] space-y-1.5 mb-3 custom-scrollbar">
                        {exercises.map((ex) => (
                            <button
                                key={ex.id}
                                onClick={() => toggleExercise(ex.id)}
                                className={`w-full flex items-center justify-between gap-2 p-3 rounded-2xl transition-all active:scale-[0.98] ${
                                    ex.done ? 'bg-activity-green/10' : 'bg-surface-container-low'
                                }`}
                            >
                                <span className={`font-body-md text-left truncate ${ex.done ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                                    {ex.name}
                                </span>
                                {ex.done
                                    ? <CheckCircle2 size={18} className="text-activity-green shrink-0" />
                                    : <Circle size={18} className="text-on-surface-variant/30 shrink-0" />}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {isToday && (
                <form onSubmit={addCustomExercise} className="mt-auto flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Add exercise..."
                        value={customExercise}
                        onChange={(e) => setCustomExercise(e.target.value)}
                        aria-label="Add an exercise"
                        className="flex-1 min-w-0 bg-surface-container-low rounded-full px-4 py-2.5 font-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
                    />
                    <button
                        type="submit"
                        disabled={!customExercise.trim() || adding}
                        aria-label="Add exercise"
                        className="w-10 h-10 flex items-center justify-center bg-primary text-on-primary rounded-full disabled:opacity-30 active:scale-90 transition-transform shrink-0"
                    >
                        <Plus size={16} strokeWidth={3} />
                    </button>
                </form>
            )}
        </div>
    );
}
