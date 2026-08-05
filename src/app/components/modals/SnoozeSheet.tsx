import React, { useState } from 'react';
import { X, Clock, Calendar as CalendarIcon, Sunrise, Sun, Sunset, Moon } from 'lucide-react';

interface SnoozeSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSnooze: (date: Date) => void;
}

export default function SnoozeSheet({ isOpen, onClose, onSnooze }: SnoozeSheetProps) {
    if (!isOpen) return null;

    const handleSnooze = (minutes: number) => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + minutes);
        onSnooze(d);
    };

    const handleSnoozeToTime = (hours: number, mins: number = 0) => {
        const d = new Date();
        // If it's already past the target hour today, move to tomorrow
        if (d.getHours() >= hours) {
            d.setDate(d.getDate() + 1);
        }
        d.setHours(hours, mins, 0, 0);
        onSnooze(d);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-background border-t border-surface-variant/50 shadow-2xl rounded-t-3xl p-4 sm:p-6 pb-safe animate-in slide-in-from-bottom duration-300">
                
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                        <Clock size={18} className="text-primary" /> Snooze Reminder
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors">
                        <X size={20} className="text-on-surface-variant" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={() => handleSnooze(10)} className="bg-surface-container hover:bg-surface-container-high transition-colors p-3 rounded-xl flex items-center justify-center font-semibold text-sm">
                        10 minutes
                    </button>
                    <button onClick={() => handleSnooze(30)} className="bg-surface-container hover:bg-surface-container-high transition-colors p-3 rounded-xl flex items-center justify-center font-semibold text-sm">
                        30 minutes
                    </button>
                    <button onClick={() => handleSnooze(60)} className="bg-surface-container hover:bg-surface-container-high transition-colors p-3 rounded-xl flex items-center justify-center font-semibold text-sm">
                        1 hour
                    </button>
                    <button onClick={() => handleSnoozeToTime(20)} className="bg-surface-container hover:bg-surface-container-high transition-colors p-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm">
                        <Moon size={16} className="text-indigo-400" /> Tonight
                    </button>
                </div>

                <div className="border-t border-surface-variant/30 pt-4 mb-2">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Tomorrow</p>
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => handleSnoozeToTime(8)} className="bg-surface-container hover:bg-surface-container-high transition-colors p-3 rounded-xl flex flex-col items-center gap-1">
                            <Sunrise size={18} className="text-amber-400" />
                            <span className="text-[11px] font-semibold">Morning</span>
                        </button>
                        <button onClick={() => handleSnoozeToTime(13)} className="bg-surface-container hover:bg-surface-container-high transition-colors p-3 rounded-xl flex flex-col items-center gap-1">
                            <Sun size={18} className="text-orange-400" />
                            <span className="text-[11px] font-semibold">Afternoon</span>
                        </button>
                        <button onClick={() => handleSnoozeToTime(18)} className="bg-surface-container hover:bg-surface-container-high transition-colors p-3 rounded-xl flex flex-col items-center gap-1">
                            <Sunset size={18} className="text-purple-400" />
                            <span className="text-[11px] font-semibold">Evening</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
