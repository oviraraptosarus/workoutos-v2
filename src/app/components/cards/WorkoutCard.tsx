'use client';

import React, { useState } from 'react';
import { Dumbbell, Flame, CheckCircle2, Circle, Plus } from 'lucide-react';

export default function WorkoutCard() {
    const [exercises, setExercises] = useState([
        { id: 1, name: 'Bench Press (4x8)', done: false },
        { id: 2, name: 'OHP (3x10)', done: false },
        { id: 3, name: 'Triceps Extension (3x12)', done: false },
    ]);
    const [customExercise, setCustomExercise] = useState('');

    const toggleExercise = (id: number) => {
        setExercises(exercises.map(ex => ex.id === id ? { ...ex, done: !ex.done } : ex));
    };

    const addCustomExercise = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customExercise.trim()) return;
        setExercises([...exercises, { id: Date.now(), name: customExercise, done: true }]);
        setCustomExercise('');
    };

    const progress = exercises.length > 0 ? (exercises.filter(ex => ex.done).length / exercises.length) * 100 : 0;
    const isCompleted = progress === 100;

    return (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                    <div className="p-1.5 rounded-full bg-black/5 shadow-sm border border-gray-100 dark:border-slate-800">
                        <Dumbbell size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">WORKOUT</span>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-colors shadow-sm border ${isCompleted ? 'bg-[#34c759]/20 text-green-800 border-[#34c759]/30' : 'bg-gray-50 text-gray-700 border-gray-100 dark:border-slate-800'}`}>
                    {isCompleted ? 'Completed' : `${Math.round(progress)}% Done`}
                </span>
            </div>

            <div className="mb-3">
                <h4 className="text-base font-bold text-gray-900 drop-shadow-sm">{isCompleted ? 'Great Job!' : 'Push & Upper Body'}</h4>
                <div className="flex items-center gap-2.5 mt-1 text-xs text-gray-600 font-medium">
                    <span className="flex items-center gap-1 text-orange-600">
                        <Flame size={14} /> 480 kcal
                    </span>
                    <span>• 55 mins</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[120px] scrollbar-hide space-y-2 mb-3">
                {exercises.map((ex) => (
                    <button
                        key={ex.id}
                        onClick={() => toggleExercise(ex.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-all shadow-sm ${ex.done ? 'border border-[#34c759]/30 bg-[#34c759]/10' : 'border border-gray-100 bg-gray-50 hover:bg-gray-50 dark:bg-slate-800'}`}
                    >
                        <span className={`text-sm font-medium ${ex.done ? 'text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                            {ex.name}
                        </span>
                        {ex.done ? <CheckCircle2 size={18} className="text-[#34c759]" /> : <Circle size={18} className="text-gray-400 dark:text-gray-500" />}
                    </button>
                ))}
            </div>

            <form onSubmit={addCustomExercise} className="mt-auto flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Log other exercise..."
                    value={customExercise}
                    onChange={(e) => setCustomExercise(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-100 shadow-inner rounded-full px-3 py-1.5 text-xs text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-gray-50 focus:border-[#007aff]/50 transition-colors"
                />
                <button
                    type="submit"
                    disabled={!customExercise.trim()}
                    className="p-1.5 bg-[#007aff]/90 border border-gray-100 text-white rounded-full disabled:opacity-50 transition-opacity shadow-sm btn-press"
                >
                    <Plus size={14} strokeWidth={3} />
                </button>
            </form>
        </div>
    );
}
