'use client';

import React, { useState } from 'react';
import { Smile, Zap, Coffee, Utensils } from 'lucide-react';

export default function MoodEnergyCard() {
    const [caffeine, setCaffeine] = useState(2);
    const [mood, setMood] = useState(7);
    const [energy, setEnergy] = useState(5);
    const [hunger, setHunger] = useState(0);

    const renderSegments = (value: number, activeColor: string, onChange: (val: number) => void) => {
        return Array.from({ length: 10 }).map((_, i) => (
            <button 
                key={i} 
                onClick={() => onChange(i + 1)}
                className={`h-3 rounded-full flex-1 transition-all duration-300 hover:scale-105 active:scale-95 ${i < value ? activeColor : 'bg-[#f1f1f1] hover:bg-[#e5e5e5]'}`}
            />
        ));
    };

    return (
        <div className="bg-white border border-gray-100 p-6 shadow-sm flex flex-col bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-900 tracking-tight">How are you feeling today?</h3>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 font-medium mb-0.5">Optional</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">7/10</span>
                </div>
            </div>

            <div className="space-y-4 mb-6">
                {/* Mood */}
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
                    <div className="w-20 flex items-center gap-2 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        <Smile size={14} />
                        <span className="text-[11px] font-semibold">Mood</span>
                    </div>
                    <div className="flex-1 flex gap-1">
                        {renderSegments(mood, 'bg-[#f8b47b]', setMood)}
                    </div>
                </div>

                {/* Energy */}
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
                    <div className="w-20 flex items-center gap-2 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        <Zap size={14} />
                        <span className="text-[11px] font-semibold">Energy</span>
                    </div>
                    <div className="flex-1 flex gap-1">
                        {renderSegments(energy, 'bg-[#82a88e]', setEnergy)}
                    </div>
                </div>

                {/* Hunger */}
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
                    <div className="w-20 flex items-center gap-2 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        <Utensils size={14} />
                        <span className="text-[11px] font-semibold">Hunger</span>
                    </div>
                    <div className="flex-1 flex gap-1">
                        {renderSegments(hunger, 'bg-[#d1d5db]', setHunger)}
                    </div>
                    <div className="w-8 text-right text-[11px] font-medium text-gray-400 dark:text-gray-500">
                        —
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        <Coffee size={14} />
                        <span className="text-[11px] font-semibold">Caffeine</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setCaffeine(Math.max(0, caffeine - 1))}
                            className="w-6 h-6 rounded-full bg-[#f4f3f0] hover:bg-[#e6e2da] flex items-center justify-center text-gray-600 transition-colors"
                        >
                            -
                        </button>
                        <span className="text-[13px] font-bold text-gray-900 w-3 text-center">{caffeine}</span>
                        <button 
                            onClick={() => setCaffeine(caffeine + 1)}
                            className="w-6 h-6 rounded-full bg-[#f4f3f0] hover:bg-[#e6e2da] flex items-center justify-center text-gray-600 transition-colors"
                        >
                            +
                        </button>
                        <span className="text-[11px] text-gray-500 font-medium">cups</span>
                    </div>
                </div>

                <button className="bg-[#1f4e38] hover:bg-[#163a2a] text-white text-[11px] font-bold px-5 py-1.5 rounded-full transition-colors shadow-sm btn-press">
                    Save
                </button>
            </div>
        </div>
    );
}
