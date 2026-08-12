'use client';

import React from 'react';
import { ScanLine, ChevronLeft, ChevronRight } from 'lucide-react';
import DateNavigator from './DateNavigator';
import { useLanguage } from '@/contexts/LanguageContext';

interface DietGaugeSummaryProps {
    currentDateKey: string;
    onDateChange: (dateKey: string) => void;
    totalCalories: number;
    calorieGoal: number;
    activityBurned?: number;
    weeklyRemaining?: number;
    onOpenBarcodeScanner?: () => void;
}

export default function DietGaugeSummary({
    currentDateKey,
    onDateChange,
    totalCalories,
    calorieGoal,
    activityBurned = 0,
    onOpenBarcodeScanner,
}: DietGaugeSummaryProps) {
    const { t } = useLanguage();
    const caloriesRemaining = calorieGoal - totalCalories;
    const isOverLimit = caloriesRemaining < 0;
    
    // Progress calculation
    const progressPercent = calorieGoal > 0 ? Math.min(100, Math.max(0, (totalCalories / calorieGoal) * 100)) : (totalCalories > 0 ? 100 : 0);

    return (
        <div className="bg-surface-container-lowest border border-surface-variant rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all">
            
            {/* Top Toolbar */}
            <div className="flex items-center justify-between mb-8">
                <DateNavigator currentDateKey={currentDateKey} onDateChange={onDateChange} />

                <button
                    onClick={onOpenBarcodeScanner}
                    className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-all text-on-surface-variant hover:text-on-surface hover:scale-105 active:scale-95"
                    title="Barcode Scanner"
                >
                    <ScanLine size={18} />
                </button>
            </div>

            {/* Apple-style layout: Big numbers, clean horizontal bar */}
            <div className="flex flex-col items-center justify-center mb-8">
                <span className="text-[12px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2">
                    {isOverLimit ? 'Over Limit' : 'Net Left'}
                </span>
                <div className="flex items-baseline gap-2">
                    <span className="text-6xl sm:text-7xl font-bold tracking-tighter text-on-surface">
                        {Math.abs(caloriesRemaining)}
                    </span>
                </div>
                <span className="text-xs font-semibold text-on-surface-variant mt-2">
                    Daily Target: <strong className="text-on-surface">{calorieGoal} kcal</strong>
                </span>
            </div>

            {/* Thick Progress Bar */}
            <div className="w-full h-4 bg-surface-container rounded-full overflow-hidden mb-6 flex">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${isOverLimit ? 'bg-red-500' : 'bg-primary'}`}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Bottom Stats */}
            <div className="grid grid-cols-2 gap-4 divide-x divide-surface-variant/50">
                <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Consumed</span>
                    <span className="text-xl font-bold text-on-surface tabular-nums">{totalCalories}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">{t('diet.gauge.activity')}</span>
                    <span className="text-xl font-bold text-on-surface tabular-nums">{activityBurned}</span>
                </div>
            </div>
            
        </div>
    );
}
