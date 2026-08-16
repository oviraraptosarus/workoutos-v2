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
            const timer = setTimeout(() => setIsVisible(false), 400);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isVisible) return null;

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

    // ─── SLIDE 0: Full-screen minimal quote ────────────────────────────────────
    if (currentSlide === 0) {
        return (
            <div
                className={clsx(
                    'fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background',
                    'transition-opacity duration-400',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={handleNext}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors active:scale-95"
                >
                    <X size={16} />
                </button>

                <div className="max-w-md px-10 text-center space-y-5 select-none animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-[48px] font-black leading-none mx-auto w-fit" style={{ color: 'rgba(128,128,128,0.4)', fontFamily: 'Georgia, serif' }}>
                        &#8220;&#8221;
                    </div>
                    <p className="font-black text-on-surface leading-snug tracking-tight" style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.65rem)' }}>
                        &ldquo;{cleanQuote}&rdquo;
                    </p>
                    <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-on-surface-variant">
                        &mdash;&nbsp;{dailyQuote.author.replace(/^[—\-\s]+/, '')}
                    </p>
                </div>

                <p className="absolute bottom-10 text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant opacity-30 animate-in fade-in duration-1000 delay-700">
                    Tap anywhere to continue
                </p>
            </div>
        );
    }

    // ─── SLIDES 1–3: Premium glass stats modal ──────────────────────────────────
    const SLIDE_META = [
        { label: 'Review',    icon: CheckCircle2,   color: 'text-[#30d158]',  bg: 'bg-[#30d158]/10' },
        { label: 'Gaps',      icon: AlertTriangle,  color: 'text-[#ff453a]',  bg: 'bg-[#ff453a]/10' },
        { label: 'Targets',   icon: Target,         color: 'text-[#0a84ff]',  bg: 'bg-[#0a84ff]/10' },
    ];
    const meta = SLIDE_META[currentSlide - 1];
    const SlideIcon = meta.icon;

    const slideLabels = ['Execution Review', 'Bottlenecks', mode === 'morning' ? "Today's Battle Plan" : "Tomorrow's Targets"];

    return (
        <div className={clsx(
            'fixed inset-0 z-[99999] flex items-end sm:items-center justify-center sm:p-6',
            'transition-all duration-300',
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}>
            {/* Scrim */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />

            {/* Card — floats on top of scrim */}
            <div className={clsx(
                'relative w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] overflow-hidden',
                'bg-card-white border border-white/10 dark:border-white/8',
                'shadow-[0_-8px_60px_rgba(0,0,0,0.35)] sm:shadow-[0_24px_60px_rgba(0,0,0,0.4)]',
                'transition-all duration-500',
                isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            )}>
                {/* Glass inner-light layers per design rules */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                {/* Handle pill (mobile) */}
                <div className="sm:hidden w-10 h-1 bg-on-surface/20 rounded-full mx-auto mt-3 mb-1" />

                {/* Progress bar strip — iOS blue */}
                <div className="flex gap-1.5 px-5 pt-4 pb-0">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[3px] flex-1 bg-on-surface/10 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: i <= currentSlide ? '100%' : '0%', backgroundColor: '#0a84ff' }}
                            />
                        </div>
                    ))}
                </div>

                <div className="relative px-5 pt-5 pb-6">
                    {/* Close */}
                    <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-on-surface/8 hover:bg-on-surface/14 flex items-center justify-center text-on-surface-variant transition-colors active:scale-95">
                        <X size={14} />
                    </button>

                    {/* Floating header (outside card content, per iOS widget rules) */}
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', meta.bg, meta.color)}>
                            <SlideIcon size={16} />
                        </div>
                        <span className="font-black text-base text-on-surface tracking-tight">
                            {slideLabels[currentSlide - 1]}
                        </span>
                    </div>

                    {/* Slide content */}
                    <div className="animate-in fade-in slide-in-from-right-4 duration-400 min-h-[160px]">
                        {currentSlide === 1 && (
                            accomplishments.length > 0 ? (
                                <div className="space-y-2">
                                    {accomplishments.map((acc, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-on-surface/4 rounded-2xl px-4 py-3">
                                            <CheckCircle2 size={15} className="text-[#30d158] shrink-0" />
                                            <span className="text-sm font-semibold text-on-surface">{acc}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-on-surface-variant font-medium leading-relaxed">No major executions logged yet. Today is the day to change that.</p>
                            )
                        )}

                        {currentSlide === 2 && (
                            bottlenecks.length > 0 ? (
                                <div className="space-y-2">
                                    {bottlenecks.map((btn, idx) => (
                                        <div key={idx} className="flex items-start gap-3 bg-on-surface/4 rounded-2xl px-4 py-3">
                                            <AlertTriangle size={15} className="text-[#ff453a] shrink-0 mt-0.5" />
                                            <span className="text-sm font-semibold text-on-surface">{btn}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-on-surface-variant font-medium leading-relaxed">Operating at peak efficiency. No critical bottlenecks detected.</p>
                            )
                        )}

                        {currentSlide === 3 && (
                            <div className="space-y-2">
                                {[
                                    { icon: Droplets, label: 'Hydration', value: `${snapshot.waterProgress.target} ml`, color: 'text-[#0a84ff]', bg: 'bg-[#0a84ff]/10' },
                                    { icon: Dumbbell, label: 'Workout',   value: snapshot.workoutName || 'Rest Day / TBD', color: 'text-[#ff9f0a]', bg: 'bg-[#ff9f0a]/10' },
                                    { icon: Target,   label: 'Diet',      value: `${snapshot.caloriesProgress.target} kcal · ${snapshot.proteinProgress.target}g protein`, color: 'text-[#30d158]', bg: 'bg-[#30d158]/10' },
                                ].map(({ icon: Icon, label, value, color, bg }) => (
                                    <div key={label} className="flex items-center gap-3 bg-on-surface/4 rounded-2xl px-4 py-3">
                                        <div className={clsx('w-7 h-7 rounded-xl flex items-center justify-center shrink-0', bg, color)}>
                                            <Icon size={14} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">{label}</div>
                                            <div className="text-sm font-bold text-on-surface">{value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer nav */}
                    <div className="flex items-center justify-between mt-6">
                        <button
                            onClick={handlePrev}
                            className={clsx(
                                'text-[13px] font-bold text-on-surface-variant px-3 py-1.5 rounded-xl transition-all active:scale-95 hover:bg-on-surface/6',
                                currentSlide <= 1 && 'invisible'
                            )}
                        >
                            Back
                        </button>
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-[13px] text-white active:scale-95 transition-all shadow-[0_4px_20px_rgba(10,132,255,0.35)] hover:shadow-[0_4px_28px_rgba(10,132,255,0.5)]"
                            style={{ backgroundColor: '#0a84ff' }}
                        >
                            {currentSlide === 3 ? "Let's Go" : 'Next'}
                            {currentSlide < 3 && <ArrowRight size={14} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
