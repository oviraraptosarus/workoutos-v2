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
    activityBurned = 180,
    weeklyRemaining = 42,
    onOpenAIMealModal,
    onOpenBarcodeScanner,
}: DietGaugeSummaryProps) {
    const caloriesRemaining = Math.max(0, calorieGoal - totalCalories);
    const progressPercent = Math.min(100, Math.max(0, (totalCalories / calorieGoal) * 100));

    // Semi-circular arch parameters (Radius = 64)
    const radius = 64;
    const circumference = Math.PI * radius; // Approx 201.06
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

    return (
        <div className="bg-white border border-gray-100 border-gray-200 rounded-3xl p-5 shadow-sm transition-all relative overflow-hidden bg-gradient-to-b from-white/80 to-white/50">
            {/* Top Toolbar with Date Navigator */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800/60 mb-4">
                <DateNavigator currentDateKey={currentDateKey} onDateChange={onDateChange} />

                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    {onOpenAIMealModal && (
                        <button
                            id="tour-ai-log"
                            onClick={onOpenAIMealModal}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-sm transition-all btn-press relative z-10"
                            title="AI Voice & Natural Language Meal Logger"
                        >
                            <Sparkles size={14} /> AI Voice & Text Log
                        </button>
                    )}

                    <button
                        onClick={onOpenAIMealModal}
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:bg-slate-800/80 transition-colors text-gray-600 btn-press"
                        title="Voice Search"
                    >
                        <Mic size={18} />
                    </button>
                    <button
                        onClick={onOpenBarcodeScanner}
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:bg-slate-800/80 transition-colors text-gray-600 btn-press"
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
                    <span className="text-2xl font-black text-purple-900 tracking-tight drop-shadow-sm">{activityBurned}</span>
                    <span className="text-[10px] font-extrabold text-purple-600/80 tracking-widest uppercase mt-1">ACTIVITY</span>
                    <span className="text-[9px] text-gray-400 font-bold mt-0.5">kcal burned</span>
                </div>

                {/* Center Metric: Upward Arch Gauge */}
                <div className="flex flex-col items-center justify-center relative">
                    <div className="relative w-44 h-24 flex items-center justify-center">
                        <svg className="w-44 h-28 overflow-visible" viewBox="0 0 160 100">
                            {/* Background Track Arc (Upward Arch) */}
                            <path
                                d="M 16,90 A 64,64 0 0,1 144,90"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="12"
                                strokeLinecap="round"
                            />
                            {/* Dynamic Progress Arc */}
                            <path
                                d="M 16,90 A 64,64 0 0,1 144,90"
                                fill="none"
                                stroke="url(#gaugeGradient)"
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-700 ease-out"
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
                        <div className="absolute top-7 flex flex-col items-center">
                            <span className="text-3xl font-black text-cyan-950 tracking-tight drop-shadow-sm leading-none">
                                {caloriesRemaining}
                            </span>
                        </div>
                    </div>
                    
                    {/* Gauge Label below the arch with ample spacing */}
                    <span className="text-[10px] font-extrabold text-cyan-800/90 tracking-widest uppercase mt-2">
                        DAILY REMAINING
                    </span>

                    {/* Scale Anchors (0 and goal) */}
                    <div className="w-full max-w-[140px] flex justify-between text-[10px] font-bold text-gray-400 px-1 mt-1">
                        <span>0</span>
                        <span>{calorieGoal} kcal</span>
                    </div>
                </div>

                {/* Right Metric: Weekly Remaining */}
                <div className="flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-cyan-900 tracking-tight drop-shadow-sm">{weeklyRemaining}</span>
                    <span className="text-[10px] font-extrabold text-cyan-700/80 tracking-widest uppercase mt-1">WEEKLY REMAINING</span>
                    <span className="text-[9px] text-gray-400 font-bold mt-0.5">points / bites</span>
                </div>
            </div>
        </div>
    );
}
