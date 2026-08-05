'use client';

import React, { useEffect, useState } from 'react';
import { X, Sun, Moon, Droplets, Dumbbell, Zap, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DailyBriefingModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'morning' | 'evening';
}

export default function DailyBriefingModal({ isOpen, onClose, mode }: DailyBriefingModalProps) {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isVisible) return null;

    const isMorning = mode === 'morning';
    const title = isMorning ? 'Good Morning, ' : 'Evening Wrap-Up, ';
    const name = user?.user_metadata?.full_name?.split(' ')[0] || 'Coach';

    return (
        <div className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={onClose} />
            
            <div className={`relative w-full max-w-lg bg-surface border border-white/10 rounded-[32px] overflow-hidden shadow-2xl transition-all duration-500 delay-100 ${isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-12 scale-95 opacity-0'}`}>
                
                {/* Header Background */}
                <div className={`absolute top-0 left-0 w-full h-48 ${isMorning ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/5' : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/5'} blur-2xl pointer-events-none`} />

                <div className="relative p-6 sm:p-8">
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-container-high/50 hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${isMorning ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'}`}>
                        {isMorning ? <Sun size={32} /> : <Moon size={32} />}
                    </div>

                    <h2 className="text-3xl font-black text-on-surface tracking-tight mb-2">
                        {title}
                        <span className={isMorning ? 'text-amber-500' : 'text-indigo-400'}>{name}</span>
                    </h2>
                    
                    <p className="text-on-surface-variant font-medium leading-relaxed mb-8">
                        {isMorning 
                            ? "You've got a solid day ahead. Here is your personalized battle plan to hit your targets today." 
                            : "Great work today. Let's review your progress and get ready to recharge for tomorrow."}
                    </p>

                    <div className="space-y-3">
                        {isMorning ? (
                            <>
                                <div className="bg-surface-container-low border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                        <Droplets size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Hydration Target</div>
                                        <div className="text-base font-bold text-on-surface">Drink 3000ml of water</div>
                                    </div>
                                </div>
                                <div className="bg-surface-container-low border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                                        <Dumbbell size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Today's Workout</div>
                                        <div className="text-base font-bold text-on-surface">Push Day (Chest & Triceps)</div>
                                    </div>
                                </div>
                                <div className="bg-surface-container-low border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                        <Target size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Diet Target</div>
                                        <div className="text-base font-bold text-on-surface">2200 kcal • 160g Protein</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-surface-container-low border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                        <Target size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Completion Rate</div>
                                        <div className="text-base font-bold text-on-surface">85% of goals hit today</div>
                                    </div>
                                </div>
                                <div className="bg-surface-container-low border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                                        <Dumbbell size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Workout Logged</div>
                                        <div className="text-base font-bold text-on-surface">Push Day Completed 🔥</div>
                                    </div>
                                </div>
                                <div className="bg-surface-container-low border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                                        <Zap size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Missed Habit</div>
                                        <div className="text-base font-bold text-on-surface">Only 1500ml / 3000ml water</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-8">
                        <button 
                            onClick={onClose}
                            className={`w-full font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg ${isMorning ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-indigo-500 text-white hover:bg-indigo-400'}`}
                        >
                            {isMorning ? "Let's Go!" : "Close Wrap-Up"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
