'use client';

import React from 'react';
import { Dumbbell, Plus } from 'lucide-react';

export default function WorkoutHeader({ onStartEmpty }: { onStartEmpty?: () => void }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 drop-shadow-sm">
                    <Dumbbell className="text-blue-500" size={24} /> Workout Tracker
                </h1>
                <p className="text-sm text-gray-600 font-bold mt-0.5">Plan, track, and crush your fitness goals</p>
            </div>
            <button 
                onClick={onStartEmpty}
                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm btn-press"
            >
                <Plus size={16} /> Start Empty Workout
            </button>
        </div>
    );
}
