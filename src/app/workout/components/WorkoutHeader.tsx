'use client';

import React from 'react';
import { Dumbbell, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function WorkoutHeader({ onStartEmpty }: { onStartEmpty?: () => void }) {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-variant">
            <div>
                <h1 className="text-2xl font-black text-on-surface flex items-center gap-2 drop-shadow-sm">
                    <Dumbbell className="text-secondary" size={24} /> Workout Tracker
                </h1>
                <p className="text-sm text-on-surface-variant font-bold mt-0.5">{t('workout.subtitle')}</p>
            </div>
            <button 
                onClick={onStartEmpty}
                className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-fixed text-on-secondary px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm btn-press"
            >
                <Plus size={16} /> Start Empty Workout
            </button>
        </div>
    );
}
