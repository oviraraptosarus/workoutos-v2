import React, { useState, useEffect } from 'react';
import { Bell, Clock, Calendar as CalendarIcon, Repeat, ChevronLeft, CalendarDays, Sunset, ArrowRight } from 'lucide-react';

interface TaskReminderPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { date: string | null, time: string | null, recurrence: string }) => void;
    initialDate?: string | null;
    initialTime?: string | null;
    initialRecurrence?: string;
}

export default function TaskReminderPopover({
    isOpen,
    onClose,
    onSave,
    initialDate,
    initialTime,
    initialRecurrence
}: TaskReminderPopoverProps) {
    const [view, setView] = useState<'quick' | 'custom'>('quick');
    const [date, setDate] = useState<string>('');
    const [time, setTime] = useState<string>('');
    const [recurrence, setRecurrence] = useState<string>('none');
    const [isRepeatDropdownOpen, setIsRepeatDropdownOpen] = useState(false);

    const repeatOptions = [
        { value: 'none', label: 'Does not repeat' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' }
    ];

    useEffect(() => {
        if (isOpen) {
            setView('quick');
            setDate(initialDate || new Date().toLocaleDateString('en-CA'));
            setTime(initialTime || '08:00');
            setRecurrence(initialRecurrence || 'none');
        }
    }, [isOpen, initialDate, initialTime, initialRecurrence]);

    if (!isOpen) return null;

    const handleQuickPick = (type: 'later_today' | 'tomorrow' | 'next_week') => {
        const now = new Date();
        let targetDate = new Date();
        let targetTime = '08:00';

        if (type === 'later_today') {
            targetTime = '20:00';
        } else if (type === 'tomorrow') {
            targetDate.setDate(now.getDate() + 1);
            targetTime = '08:00';
        } else if (type === 'next_week') {
            // Find next Monday
            targetDate.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
            targetTime = '08:00';
        }

        onSave({
            date: targetDate.toLocaleDateString('en-CA'),
            time: targetTime,
            recurrence: 'none'
        });
        onClose();
    };

    const handleCustomSave = () => {
        onSave({ date, time, recurrence });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.5)] w-full max-w-xs rounded-2xl relative z-10 animate-in zoom-in-95 duration-200">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                {view === 'quick' ? (
                    <div className="flex flex-col py-2">
                        <button type="button" onClick={() => handleQuickPick('later_today')} className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors active:bg-white/10 text-left">
                            <div className="flex items-center gap-3">
                                <Sunset size={18} className="text-on-surface-variant" />
                                <span className="text-on-surface font-medium text-sm">Later today</span>
                            </div>
                            <span className="text-xs text-on-surface-variant font-medium">8:00 PM</span>
                        </button>
                        
                        <button type="button" onClick={() => handleQuickPick('tomorrow')} className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors active:bg-white/10 text-left">
                            <div className="flex items-center gap-3">
                                <Clock size={18} className="text-on-surface-variant" />
                                <span className="text-on-surface font-medium text-sm">Tomorrow</span>
                            </div>
                            <span className="text-xs text-on-surface-variant font-medium">8:00 AM</span>
                        </button>
                        
                        <button type="button" onClick={() => handleQuickPick('next_week')} className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors active:bg-white/10 text-left">
                            <div className="flex items-center gap-3">
                                <CalendarDays size={18} className="text-on-surface-variant" />
                                <span className="text-on-surface font-medium text-sm">Next week</span>
                            </div>
                            <span className="text-xs text-on-surface-variant font-medium">Mon, 8:00 AM</span>
                        </button>
                        
                        <div className="h-px bg-white/10 my-2 mx-4"></div>
                        
                        <button type="button" onClick={() => setView('custom')} className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors active:bg-white/10 text-left">
                            <div className="flex items-center gap-3">
                                <CalendarIcon size={18} className="text-on-surface-variant" />
                                <span className="text-on-surface font-medium text-sm">Pick date &amp; time</span>
                            </div>
                            <ArrowRight size={16} className="text-on-surface-variant" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <button type="button" onClick={() => setView('quick')} className="p-1 rounded-full hover:bg-white/10 active:scale-95 transition-all text-on-surface-variant">
                                <ChevronLeft size={20} />
                            </button>
                            <h3 className="text-base font-bold text-on-surface">Pick date &amp; time</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1.5 block px-1">Date</label>
                                <input 
                                    type="date" 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff] transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1.5 block px-1">Time</label>
                                <input 
                                    type="time" 
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff] transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1.5 block px-1">Repeat</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsRepeatDropdownOpen(!isRepeatDropdownOpen)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff] transition-all flex items-center justify-between text-left"
                                    >
                                        <span>{repeatOptions.find(o => o.value === recurrence)?.label}</span>
                                        <Repeat size={16} className="text-on-surface-variant" />
                                    </button>
                                    
                                    {isRepeatDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsRepeatDropdownOpen(false)}></div>
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#2c2c2e] border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                                {repeatOptions.map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setRecurrence(opt.value);
                                                            setIsRepeatDropdownOpen(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm text-on-surface hover:bg-[#0a84ff]/20 active:bg-[#0a84ff]/30 transition-colors border-b border-white/5 last:border-0"
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="pt-4 flex justify-end">
                                <button 
                                    type="button"
                                    onClick={handleCustomSave}
                                    className="px-6 py-2.5 bg-[#0a84ff] text-white text-sm font-bold rounded-full hover:bg-[#007aff] active:scale-95 transition-all shadow-[0_4px_12px_rgba(10,132,255,0.3)]"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
