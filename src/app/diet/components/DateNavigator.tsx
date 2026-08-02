'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, RotateCcw } from 'lucide-react';
import { formatDateKey, getDisplayDateString } from '../services/dietStorage';

interface DateNavigatorProps {
    currentDateKey: string;
    onDateChange: (newDateKey: string) => void;
}

export default function DateNavigator({ currentDateKey, onDateChange }: DateNavigatorProps) {
    const todayKey = formatDateKey(new Date());
    const isToday = currentDateKey === todayKey;

    const navigateDay = (offset: number) => {
        const [year, month, day] = currentDateKey.split('-').map(Number);
        const current = new Date(year, month - 1, day);
        current.setDate(current.getDate() + offset);
        onDateChange(formatDateKey(current));
    };

    return (
        <div className="flex items-center justify-between gap-2">
            <button
                onClick={() => navigateDay(-1)}
                className="p-1.5 rounded-full hover:bg-surface-container/80 text-on-surface-variant hover:text-on-surface transition-colors btn-press"
                title="Previous Day"
            >
                <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-2 relative">
                <label className="flex items-center gap-1.5 text-xs font-black text-on-surface uppercase tracking-wider cursor-pointer hover:text-cyan-700 transition-colors bg-surface-container-low px-3 py-1.5 rounded-full border border-surface-variant shadow-sm">
                    <Calendar size={14} className="text-white" />
                    <span>{getDisplayDateString(currentDateKey)}</span>
                    <input
                        type="date"
                        value={currentDateKey}
                        onChange={(e) => {
                            if (e.target.value) {
                                onDateChange(e.target.value);
                            }
                        }}
                        className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                    />
                </label>

                {!isToday && (
                    <button
                        onClick={() => onDateChange(todayKey)}
                        className="flex items-center gap-1 text-[10px] font-black text-cyan-700 bg-cyan-100/70 hover:bg-cyan-100 px-2.5 py-1 rounded-full border border-white/10 shadow-sm transition-all btn-press"
                        title="Jump to Today"
                    >
                        <RotateCcw size={10} /> Today
                    </button>
                )}
            </div>

            <button
                onClick={() => navigateDay(1)}
                className="p-1.5 rounded-full hover:bg-surface-container/80 text-on-surface-variant hover:text-on-surface transition-colors btn-press"
                title="Next Day"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
}
