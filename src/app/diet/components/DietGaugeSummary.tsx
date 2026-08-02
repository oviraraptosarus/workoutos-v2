'use client';

import React from 'react';
import { Mic, ScanLine, Sparkles } from 'lucide-react';
import DateNavigator from './DateNavigator';

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
    const caloriesRemaining = calorieGoal - totalCalories;
    const isOverLimit = caloriesRemaining < 0;
    
    // Gauge calculations
    const radius = 90;
    const circumference = Math.PI * radius; // half circle
    const progressPercent = calorieGoal > 0 ? Math.min(100, Math.max(0, (totalCalories / calorieGoal) * 100)) : (totalCalories > 0 ? 100 : 0);
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;
    
    // Determine gauge color based on progress
    let strokeColor = "url(#gaugeGradient)";
    if (isOverLimit) {
        strokeColor = "#ef4444"; // Red for over limit
    } else if (progressPercent > 85) {
        strokeColor = "#f59e0b"; // Amber if close
    }

    return (
        <div className="bg-card-white backdrop-blur-xl border border-surface-variant rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden">
            {/* Top Toolbar with Date Navigator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-variant/60 mb-4">
                <div className="w-full flex justify-center sm:justify-start sm:w-auto">
                    <DateNavigator currentDateKey={currentDateKey} onDateChange={onDateChange} />
                </div>

                <div className="flex items-center justify-center w-full sm:w-auto gap-2 text-on-surface-variant dark:text-on-surface-variant shrink-0">
                    <button
                        onClick={onOpenBarcodeScanner}
                        className="p-1.5 rounded-full hover:bg-surface-container dark:bg-surface-container-high/80 transition-colors text-on-surface-variant btn-press"
                        title="Barcode Scanner"
                    >
                        <ScanLine size={18} />
                    </button>
                </div>
            </div>

            {/* Main Gauge & Metrics Grid */}
            <div className="grid grid-cols-3 items-center text-center">
                {/* Left Metric: Activity */}
                <div className="flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-purple-900 tracking-tight drop-shadow-sm">{activityBurned}</span>
                    <span className="text-[10px] font-extrabold text-activity-purple tracking-widest uppercase mt-1">ACTIVITY</span>
                    <span className="text-[9px] text-on-surface-variant font-bold mt-0.5">kcal burned</span>
                </div>

                {/* Center Metric: Upward Arch Gauge */}
                <div className="flex flex-col items-center justify-center relative">
                    <div className="relative w-44 h-24 flex items-center justify-center">
                        <svg className="w-44 h-28 overflow-visible" viewBox="0 0 200 110">
                            {/* Background Track Arc */}
                            <path
                                d="M 10,100 A 90,90 0 0,1 190,100"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="12"
                                strokeLinecap="round"
                            />
                            {/* Dynamic Progress Arc */}
                            <path
                                d="M 10,100 A 90,90 0 0,1 190,100"
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-1000 ease-out"
                            />
                            <defs>
                                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#0ea5e9" />
                                    <stop offset="50%" stopColor="#14b8a6" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                            </defs>
                        </svg>
                        {/* Gauge Central Values (Centered inside the dome) */}
                        <div className="absolute top-10 flex flex-col items-center">
                            <span className={`text-3xl font-bold tracking-tight drop-shadow-sm leading-none ${isOverLimit ? 'text-activity-red' : 'text-activity-blue'}`}>
                                {Math.abs(caloriesRemaining)}
                            </span>
                        </div>
                    </div>
                    
                    {/* Gauge Label below the arch with ample spacing */}
                    <span className={`text-[10px] font-extrabold tracking-widest uppercase mt-2 ${isOverLimit ? 'text-activity-red' : 'text-activity-blue'}`}>
                        {isOverLimit ? 'OVER LIMIT' : 'DAILY REMAINING'}
                    </span>

                    {/* Scale Anchors (0 and goal) */}
                    <div className="w-full max-w-[140px] flex justify-between text-[10px] font-bold text-on-surface-variant px-1 mt-1">
                        <span>0</span>
                        <span>{calorieGoal} kcal</span>
                    </div>
                </div>

                {/* Right Metric: Net calories left after activity */}
                <div className="flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-activity-blue tracking-tight tabular-nums">{weeklyRemaining}</span>
                    <span className="text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mt-1">NET LEFT</span>
                    <span className="text-[9px] text-on-surface-variant font-bold mt-0.5">kcal today</span>
                </div>
            </div>
        </div>
    );
}
