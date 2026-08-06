import React, { useState } from 'react';
import { X, Clock, Calendar as CalendarIcon, Sunrise, Sun, Sunset, Moon, CalendarDays } from 'lucide-react';

interface SnoozeSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSnooze: (date: Date) => void;
}

export default function SnoozeSheet({ isOpen, onClose, onSnooze }: SnoozeSheetProps) {
    const [showCustom, setShowCustom] = useState(false);
    const [customDate, setCustomDate] = useState('');
    const [customTime, setCustomTime] = useState('');

    if (!isOpen) return null;

    const handleSnooze = (minutes: number) => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + minutes);
        onSnooze(d);
    };

    const handleSnoozeToTime = (hours: number, mins: number = 0, addDays: number = 0) => {
        const d = new Date();
        d.setDate(d.getDate() + addDays);
        
        if (addDays === 0 && d.getHours() >= hours) {
            d.setDate(d.getDate() + 1);
        }
        
        d.setHours(hours, mins, 0, 0);
        onSnooze(d);
    };

    const handleCustomSnooze = () => {
        if (!customDate || !customTime) return;
        const [year, month, day] = customDate.split('-').map(Number);
        const [hours, mins] = customTime.split(':').map(Number);
        const d = new Date(year, month - 1, day, hours, mins, 0, 0);
        onSnooze(d);
    };

    return (
        <div className="fixed inset-0 z-[99999] flex flex-col justify-end">
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

                {!showCustom ? (
                    <>
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
                            <div className="grid grid-cols-4 gap-2">
                                <button onClick={() => handleSnoozeToTime(8, 0, 1)} className="bg-surface-container hover:bg-surface-container-high transition-colors p-3 rounded-xl flex flex-col items-center gap-1">
                                    <Sunrise size={18} className="text-amber-400" />
                                    <span className="text-[11px] font-semibold">Morning</span>
                                </button>
                                <button onClick={() => handleSnoozeToTime(13, 0, 1)} className="bg-surface-container hover:bg-surface-container-high transition-colors p-3 rounded-xl flex flex-col items-center gap-1">
                                    <Sun size={18} className="text-orange-400" />
                                    <span className="text-[11px] font-semibold">Afternoon</span>
                                </button>
                                <button onClick={() => handleSnoozeToTime(18, 0, 1)} className="bg-surface-container hover:bg-surface-container-high transition-colors p-3 rounded-xl flex flex-col items-center gap-1">
                                    <Sunset size={18} className="text-purple-400" />
                                    <span className="text-[11px] font-semibold">Evening</span>
                                </button>
                                <button onClick={() => setShowCustom(true)} className="bg-surface-container hover:bg-surface-container-high transition-colors p-3 rounded-xl flex flex-col items-center gap-1">
                                    <CalendarDays size={18} className="text-primary" />
                                    <span className="text-[11px] font-semibold">Custom</span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="animate-in fade-in duration-200">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs font-bold text-on-surface-variant mb-1 block">Date</label>
                                <input 
                                    type="date" 
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                    className="w-full bg-surface-container border border-surface-variant/30 rounded-xl p-3 text-sm text-on-surface"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-on-surface-variant mb-1 block">Time</label>
                                <input 
                                    type="time" 
                                    value={customTime}
                                    onChange={(e) => setCustomTime(e.target.value)}
                                    className="w-full bg-surface-container border border-surface-variant/30 rounded-xl p-3 text-sm text-on-surface"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowCustom(false)} className="flex-1 p-3 rounded-xl font-bold text-sm bg-surface-container hover:bg-surface-container-high transition-colors">
                                Back
                            </button>
                            <button 
                                onClick={handleCustomSnooze} 
                                disabled={!customDate || !customTime}
                                className="flex-1 p-3 rounded-xl font-bold text-sm bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                Schedule
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
