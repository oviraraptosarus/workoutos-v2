'use client';

import React from 'react';
import { Mic, ScanLine, Sparkles } from 'lucide-react';
import DateNavigator from './DateNavigator';
import { useLanguage } from '@/contexts/LanguageContext';

interface DietGaugeSummaryProps {
    currentDateKey: string;
    onDateChange: (dateKey: string) => void;
    totalCalories: number;
    calorieGoal: number;
    activityBurned?: number;
    weeklyRemaining?: number;
    onOpenAIMealModal?: () => void;
    onOpenBarcodeScanner?: () => void;
}

export default function DietGaugeSummary({
    currentDateKey,
    onDateChange,
    totalCalories,
    calorieGoal,
    activityBurned = 0,
    weeklyRemaining = 42,
    onOpenAIMealModal,
    onOpenBarcodeScanner,
}: DietGaugeSummaryProps) {
    const { t } = useLanguage();
    const caloriesRemaining = calorieGoal - totalCalories;
    const isOverLimit = caloriesRemaining < 0;
    
    // Circular Gauge calculations
    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    const progressPercent = calorieGoal > 0 ? Math.min(100, Math.max(0, (totalCalories / calorieGoal) * 100)) : (totalCalories > 0 ? 100 : 0);
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;
    
    // Determine gauge color based on progress
    let strokeColor = "url(#primaryGradient)";
    if (isOverLimit) {
        strokeColor = "#ef4444"; // Red for over limit
    }

    return (
        <div className="bg-surface-container/30 backdrop-blur-3xl border border-white/10 dark:border-white/5 rounded-[32px] p-6 shadow-[0_20px_40px_rgb(0,0,0,0.06)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.3)] transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] relative overflow-hidden">
            
            {/* Subtle atmospheric glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-[64px] pointer-events-none" />

            {/* Top Toolbar with Date Navigator */}
            <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
                <DateNavigator currentDateKey={currentDateKey} onDateChange={onDateChange} />

                <button
                    onClick={onOpenBarcodeScanner}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all text-on-surface-variant hover:text-on-surface hover:scale-105 active:scale-95"
                    title="Barcode Scanner"
                >
                    <ScanLine size={18} />
                </button>
            </div>

            {/* Main Gauge & Metrics Grid */}
            <div className="grid grid-cols-3 items-center text-center relative z-10 gap-2">
                
                {/* Left Metric: Activity */}
                <div className="flex flex-col items-center justify-center">
                    <span className="text-2xl font-semibold text-on-surface tracking-tight tabular-nums">{activityBurned}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mt-2">{t('diet.gauge.activity')}</span>
                </div>

                {/* Center Metric: Full Circular Gauge */}
                <div className="flex flex-col items-center justify-center relative">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                            <defs>
                                <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="var(--color-primary, #3b82f6)" />
                                    <stop offset="100%" stopColor="var(--color-secondary, #8b5cf6)" />
                                </linearGradient>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="4" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>
                            
                            {/* Background Track Arc */}
                            <circle
                                cx="80"
                                cy="80"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-surface-variant/40"
                            />
                            
                            {/* Dynamic Progress Arc */}
                            <circle
                                cx="80"
                                cy="80"
                                r={radius}
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                                filter={progressPercent > 0 ? "url(#glow)" : ""}
                            />
                        </svg>
                        
                        {/* Gauge Central Values */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                            <span className="text-3xl font-bold tracking-tight text-on-surface tabular-nums leading-none">
                                {Math.abs(caloriesRemaining)}
                            </span>
                            <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mt-2">
                                {isOverLimit ? t('diet.gauge.overLimit') : 'Net Left'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Metric: Consumed */}
                <div className="flex flex-col items-center justify-center">
                    <span className="text-2xl font-semibold text-on-surface tracking-tight tabular-nums">{totalCalories}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mt-2">Consumed</span>
                </div>
            </div>
            
            {/* Daily Goal Label */}
            <div className="text-center mt-6 relative z-10">
                <span className="text-xs font-medium text-on-surface-variant/80">Daily Target: <strong className="text-on-surface">{calorieGoal} kcal</strong></span>
            </div>
        </div>
    );
}
