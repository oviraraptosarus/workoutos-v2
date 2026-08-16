'use client';

import React from 'react';
import { Dumbbell, Plus, Activity } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface WorkoutHeaderProps {
    onStartEmpty?: () => void;
    onLogActivity?: () => void;
}

export default function WorkoutHeader({ onStartEmpty, onLogActivity }: WorkoutHeaderProps) {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-variant">
            <div>
                <h1 className="text-2xl font-black text-on-surface flex items-center gap-2 drop-shadow-sm">
                    <Dumbbell className="text-secondary" size={24} /> Workout Tracker
                </h1>
                <p className="text-sm text-on-surface-variant font-bold mt-0.5">{t('workout.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={onLogActivity}
                    className="flex-1 sm:flex-none items-center justify-center gap-2 bg-secondary hover:bg-secondary-fixed text-on-secondary px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm btn-press flex"
                >
                    <Activity size={16} /> Log Activity
                </button>
                <button 
                    onClick={onStartEmpty}
                    className="flex-1 sm:flex-none items-center justify-center gap-2 bg-secondary hover:bg-secondary-fixed text-on-secondary px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm btn-press flex"
                >
                    <Plus size={16} /> Start Empty Workout
                </button>
            </div>
        </div>
    );
}
