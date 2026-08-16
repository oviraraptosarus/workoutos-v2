'use client';

import React, { useEffect, useState } from 'react';
import { X, Droplets, Dumbbell, Target, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDailySnapshot } from '@/hooks/useDailySnapshot';
import clsx from 'clsx';
import QUOTES from '@/data/quotes.json';

interface DailyBriefingModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'morning' | 'evening';
}

export default function DailyBriefingModal({ isOpen, onClose, mode }: DailyBriefingModalProps) {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [dailyQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    const { snapshot } = useDailySnapshot();

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setCurrentSlide(0);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isVisible) return null;

    const isMorning = mode === 'morning';
    const name = user?.user_metadata?.full_name?.split(' ')[0] || 'Coach';

    const handleNext = () => {
        if (currentSlide < 3) {
            setCurrentSlide(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    };

    const completedTasks = snapshot.plannerState.completed;
    const waterMet = snapshot.waterProgress.current >= snapshot.waterProgress.target;
    const caloriesMet = snapshot.caloriesProgress.current >= snapshot.caloriesProgress.target * 0.8;
    const workoutDone = !!snapshot.workoutName;

    const accomplishments: string[] = [];
    if (completedTasks > 0) accomplishments.push(`Crushed ${completedTasks} task${completedTasks > 1 ? 's' : ''}`);
    if (workoutDone) accomplishments.push(`Completed ${snapshot.workoutName}`);
    if (waterMet) accomplishments.push('Hit hydration target');
    if (caloriesMet) accomplishments.push('Stayed on track with diet');

    const bottlenecks: string[] = [];
    if (!waterMet) bottlenecks.push('Fell short on hydration. Drink more water.');
    if (snapshot.sleepProgress.current < snapshot.sleepProgress.target) bottlenecks.push('Sleep was suboptimal. Prioritize recovery.');
    if (completedTasks === 0 && snapshot.plannerState.total > 0) bottlenecks.push('Execution rate was low. Focus on one task at a time.');

    const cleanQuote = dailyQuote.text.replace(/^"+|"+$/g, '').replace(/^'|'$/g, '');

    // ─── SLIDE 0: Full-screen quote (matches screenshot) ───────────────────────
    if (currentSlide === 0) {
        return (
            <div
                className={clsx(
                    'fixed inset-0 z-[99999] flex flex-col items-center justify-center',
                    'bg-background transition-opacity duration-300',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={handleNext}
            >
                {/* Close button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Content */}
                <div className="max-w-md px-10 text-center space-y-5 select-none">
                    {/* Quotation mark icon — matches screenshot */}
                    <div
                        className="text-[56px] font-black leading-none mx-auto w-fit"
                        style={{ color: 'rgba(128,128,128,0.5)', fontFamily: 'Georgia, serif', lineHeight: 1 }}
                    >
                        &#8220;&#8221;
                    </div>

                    <p className="font-black text-on-surface leading-snug tracking-tight"
                        style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)' }}>
                        &ldquo;{cleanQuote}&rdquo;
                    </p>

                    <p className="text-xs font-bold tracking-[0.2em] uppercase text-on-surface-variant">
                        &mdash;&nbsp;{dailyQuote.author.replace(/^[—\-\s]+/, '')}
                    </p>
                </div>

                {/* Tap-to-continue hint */}
                <p className="absolute bottom-10 text-[11px] font-semibold tracking-widest uppercase text-on-surface-variant opacity-40">
                    Tap anywhere to continue
                </p>
            </div>
        );
    }

    // ─── SLIDES 1–3: Stats panel (compact modal) ────────────────────────────────
    return (
        <div className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={onClose} />

            <div className={`relative w-full max-w-lg bg-surface border border-white/10 rounded-[32px] overflow-hidden shadow-2xl transition-all duration-500 delay-100 ${isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-12 scale-95 opacity-0'}`}>

                {/* Header tint */}
                <div className={`absolute top-0 left-0 w-full h-48 ${isMorning ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/5' : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/5'} blur-2xl pointer-events-none`} />

                {/* Progress dots */}
                <div className="absolute top-4 left-6 right-6 flex gap-2 z-50">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                            <div className={clsx('h-full rounded-full transition-all duration-300', i <= currentSlide ? (isMorning ? 'bg-amber-500' : 'bg-indigo-400') : 'bg-transparent')} />
                        </div>
                    ))}
                </div>

                <div className="relative p-6 sm:p-8 pt-12 min-h-[420px] flex flex-col">
                    <button onClick={onClose} className="absolute top-10 right-6 w-8 h-8 rounded-full bg-surface-container-high/50 hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors z-50">
                        <X size={16} />
                    </button>

                    <div className="flex-1 flex flex-col justify-center">
                        {currentSlide === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-emerald-500/20 text-emerald-500 border border-emerald-500/20">
                                    <CheckCircle2 size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-on-surface tracking-tight mb-4">Execution Review</h2>
                                {accomplishments.length > 0 ? (
                                    <div className="space-y-3">
                                        {accomplishments.map((acc, idx) => (
                                            <div key={idx} className="flex items-start gap-3 bg-surface-container-low p-3 rounded-xl border border-white/5">
                                                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                                <span className="text-sm font-semibold text-on-surface">{acc}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-on-surface-variant font-medium">No major executions logged yet. Today is the day to change that.</p>
                                )}
                            </div>
                        )}

                        {currentSlide === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-red-500/20 text-red-500 border border-red-500/20">
                                    <AlertTriangle size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-on-surface tracking-tight mb-4">Bottlenecks</h2>
                                {bottlenecks.length > 0 ? (
                                    <div className="space-y-3">
                                        {bottlenecks.map((btn, idx) => (
                                            <div key={idx} className="flex items-start gap-3 bg-surface-container-low p-3 rounded-xl border border-white/5">
                                                <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                                <span className="text-sm font-semibold text-on-surface">{btn}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-on-surface-variant font-medium">You are operating at peak efficiency. No critical bottlenecks detected.</p>
                                )}
                            </div>
                        )}

                        {currentSlide === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isMorning ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'}`}>
                                    <Target size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-on-surface tracking-tight mb-4">{isMorning ? "Today's Battle Plan" : "Tomorrow's Targets"}</h2>
                                <div className="space-y-3">
                                    <div className="bg-surface-container-low border border-white/5 rounded-2xl p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0"><Droplets size={16} /></div>
                                        <div>
                                            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Hydration</div>
                                            <div className="text-sm font-bold text-on-surface">Drink {snapshot.waterProgress.target}ml</div>
                                        </div>
                                    </div>
                                    <div className="bg-surface-container-low border border-white/5 rounded-2xl p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0"><Dumbbell size={16} /></div>
                                        <div>
                                            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Workout</div>
                                            <div className="text-sm font-bold text-on-surface">{snapshot.workoutName || 'Rest Day / TBD'}</div>
                                        </div>
                                    </div>
                                    <div className="bg-surface-container-low border border-white/5 rounded-2xl p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"><Target size={16} /></div>
                                        <div>
                                            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Diet</div>
                                            <div className="text-sm font-bold text-on-surface">{snapshot.caloriesProgress.target} kcal • {snapshot.proteinProgress.target}g Protein</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
                        <button onClick={handlePrev} className={clsx('text-sm font-bold text-on-surface-variant px-4 py-2 hover:text-white transition-colors', currentSlide <= 1 && 'invisible')}>
                            Back
                        </button>
                        <button onClick={handleNext} className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all ${isMorning ? 'bg-amber-500 text-amber-950 shadow-amber-500/20' : 'bg-indigo-500 text-white shadow-indigo-500/20'}`}>
                            {currentSlide === 3 ? "Let's Go!" : 'Next'}
                            {currentSlide < 3 && <ArrowRight size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
