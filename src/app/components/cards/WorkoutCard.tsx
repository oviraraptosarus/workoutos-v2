'use client';

import React, { useState, useEffect } from 'react';
import { Dumbbell, CheckCircle2, Circle, Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useDate } from '@/contexts/DateContext';

interface Exercise {
    id: number;
    name: string;
    done: boolean;
}

const STORAGE_KEY = 'workout_os_workout_exercises';

export default function WorkoutCard() {
    const { selectedDate } = useDate();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [customExercise, setCustomExercise] = useState('');

    // Load from localStorage on mount/date change
    useEffect(() => {
        if (!selectedDate) return;
        const saved = localStorage.getItem(`${STORAGE_KEY}_${selectedDate}`);
        if (saved) {
            try { setExercises(JSON.parse(saved)); } catch { setExercises([]); }
        } else {
            setExercises([]); // Fresh day = no exercises pre-loaded
        }
    }, [selectedDate]);

    const save = (updated: Exercise[]) => {
        if (!selectedDate) return;
        localStorage.setItem(`${STORAGE_KEY}_${selectedDate}`, JSON.stringify(updated));
        setExercises(updated);
    };

    const toggleExercise = (id: number) => {
        save(exercises.map(ex => ex.id === id ? { ...ex, done: !ex.done } : ex));
    };

    const addCustomExercise = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customExercise.trim()) return;
        save([...exercises, { id: Date.now(), name: customExercise.trim(), done: false }]);
        setCustomExercise('');
    };

    const done = exercises.filter(ex => ex.done).length;
    const progress = exercises.length > 0 ? (done / exercises.length) * 100 : 0;
    const isCompleted = exercises.length > 0 && progress === 100;

    return (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-800">
                    <div className="p-1.5 rounded-full bg-black/5 shadow-sm border border-gray-100">
                        <Dumbbell size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">WORKOUT</span>
                </div>
                <Link href="/workout" className="flex items-center gap-0.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700">
                    {exercises.length > 0 ? `${done}/${exercises.length}` : 'Log'}
                    <ChevronRight size={13} />
                </Link>
            </div>

            {exercises.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4 gap-2">
                    <p className="text-xs text-gray-400 font-medium">No workout logged yet</p>
                    <Link
                        href="/workout"
                        className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                    >
                        + Start Workout
                    </Link>
                </div>
            ) : (
                <>
                    <div className="mb-2">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${isCompleted ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                            {isCompleted ? '✓ Completed!' : `${Math.round(progress)}% Done`}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[120px] space-y-1.5 mb-3">
                        {exercises.map((ex) => (
                            <button
                                key={ex.id}
                                onClick={() => toggleExercise(ex.id)}
                                className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors ${ex.done ? 'border border-green-200 bg-green-50' : 'border border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <span className={`text-sm font-medium text-left ${ex.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                    {ex.name}
                                </span>
                                {ex.done ? <CheckCircle2 size={17} className="text-green-500 flex-shrink-0" /> : <Circle size={17} className="text-gray-300 flex-shrink-0" />}
                            </button>
                        ))}
                    </div>
                </>
            )}

            <form onSubmit={addCustomExercise} className="mt-auto flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Log an exercise..."
                    value={customExercise}
                    onChange={(e) => setCustomExercise(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-300 transition-colors"
                />
                <button
                    type="submit"
                    disabled={!customExercise.trim()}
                    className="p-1.5 bg-indigo-600 text-white rounded-full disabled:opacity-30 transition-opacity hover:bg-indigo-700"
                >
                    <Plus size={14} strokeWidth={3} />
                </button>
            </form>
        </div>
    );
}
