'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Droplets, Dumbbell, Target, CheckCircle2, AlertTriangle, ArrowRight, Moon, Flame, Apple, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDailySnapshot } from '@/hooks/useDailySnapshot';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import QUOTES from '@/data/quotes.json';

interface DailyBriefingModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'morning' | 'evening';
}

interface ProgressItem {
    icon: typeof Droplets;
    label: string;
    current: number;
    target: number;
    unit: string;
    met: boolean;
    color: string;
    displayValue?: string;
}

interface Bottleneck {
    text: string;
    severity: 'critical' | 'warning';
}

// Slide map:
//  0 → Full-screen quote
//  1 → Full-screen greeting (new)
//  2 → Execution Review   (glass modal)
//  3 → Bottlenecks        (glass modal)
//  4 → Targets            (glass modal)
const TOTAL_GLASS_SLIDES = 3; // slides 2-4
const LAST_SLIDE = 4;

export default function DailyBriefingModal({ isOpen, onClose, mode }: DailyBriefingModalProps) {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [dailyQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    const { snapshot } = useDailySnapshot();

    // Swipe gesture refs
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);

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
        if (currentSlide < LAST_SLIDE) {
            setCurrentSlide(prev => prev + 1);
        } else {
            onClose();
            router.push(mode === 'morning' ? '/workout' : '/sleep');
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
    };

    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
        if (Math.abs(deltaX) > 50 && deltaY < 100) {
            if (deltaX < 0) handleNext();
            else handlePrev();
        }
    };

    // ─── Shared data ────────────────────────────────────────────────────────────
    const completedTasks = snapshot.plannerState.completed;
    const totalTasks = snapshot.plannerState.total;
    const waterMet = snapshot.waterProgress.current >= snapshot.waterProgress.target;
    const caloriesMet = snapshot.caloriesProgress.current >= snapshot.caloriesProgress.target * 0.8;
    const workoutDone = !!snapshot.workoutName;

    const progressItems: ProgressItem[] = [
        {
            icon: Droplets,
            label: 'Hydration',
            current: snapshot.waterProgress.current,
            target: snapshot.waterProgress.target,
            unit: 'ml',
            met: waterMet,
            color: '#0a84ff',
        },
        {
            icon: Dumbbell,
            label: 'Workout',
            current: workoutDone ? 1 : 0,
            target: 1,
            unit: '',
            met: workoutDone,
            color: '#ff9f0a',
            displayValue: workoutDone ? (snapshot.workoutName || 'Completed') : 'Not logged',
        },
        {
            icon: Apple,
            label: 'Nutrition',
            current: snapshot.caloriesProgress.current,
            target: snapshot.caloriesProgress.target,
            unit: 'kcal',
            met: caloriesMet,
            color: '#30d158',
        },
    ];

    if (totalTasks > 0) {
        progressItems.push({
            icon: CheckCircle2,
            label: 'Tasks',
            current: completedTasks,
            target: totalTasks,
            unit: '',
            met: completedTasks >= totalTasks,
            color: '#bf5af2',
            displayValue: `${completedTasks}/${totalTasks} done`,
        });
    }

    const bottlenecks: Bottleneck[] = [];
    if (!workoutDone && !snapshot.isRestDay) {
        bottlenecks.push({ text: 'No workout logged today.', severity: 'critical' });
    }
    if (!waterMet) {
        bottlenecks.push({
            text: `Fell short on hydration (${snapshot.waterProgress.current.toLocaleString()}/${snapshot.waterProgress.target.toLocaleString()} ml).`,
            severity: 'warning',
        });
    }
    if (snapshot.sleepProgress.current > 0 && snapshot.sleepProgress.current < snapshot.sleepProgress.target) {
        bottlenecks.push({
            text: `Sleep was suboptimal (${snapshot.sleepProgress.current}/${snapshot.sleepProgress.target}h). Prioritize recovery.`,
            severity: 'warning',
        });
    }
    if (completedTasks === 0 && totalTasks > 0) {
        bottlenecks.push({
            text: `Execution rate was low (0/${totalTasks} tasks). Focus on one at a time.`,
            severity: 'critical',
        });
    } else if (completedTasks > 0 && completedTasks < totalTasks) {
        bottlenecks.push({
            text: `${totalTasks - completedTasks} task${totalTasks - completedTasks > 1 ? 's' : ''} still pending.`,
            severity: 'warning',
        });
    }
    if (!caloriesMet && snapshot.caloriesProgress.current > 0) {
        bottlenecks.push({ text: 'Under calorie target. Eat a balanced meal.', severity: 'warning' });
    }

    // Greeting data
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const greetingEmoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const firstName = userProfile?.fullName?.split(' ')[0] || '';
    const modeTagline = mode === 'morning' ? "Let's make today count." : "Time to review and reset.";
    const cleanQuote = dailyQuote.text.replace(/^"+|"+$/g, '').replace(/^'|'$/g, '');

    // Mode-aware labels for glass slides (index = currentSlide - 2)
    const slideLabels = [
        mode === 'morning' ? "Yesterday's Recap" : 'Execution Review',
        'Bottlenecks',
        mode === 'morning' ? "Today's Battle Plan" : "Tomorrow's Targets",
    ];

    // ─── SLIDE 0: Full-screen quote ─────────────────────────────────────────────
    if (currentSlide === 0) {
        return (
            <div
                className={clsx(
                    'fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background',
                    'transition-opacity duration-400',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={handleNext}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
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

    // ─── SLIDE 1: Full-screen greeting ──────────────────────────────────────────
    if (currentSlide === 1) {
        return (
            <div
                className={clsx(
                    'fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background',
                    'transition-opacity duration-400',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={handleNext}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors active:scale-95"
                >
                    <X size={16} />
                </button>

                <div className="max-w-sm px-10 text-center space-y-6 select-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Time */}
                    <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-on-surface-variant/50">
                        {timeStr}
                    </p>

                    {/* Emoji + Greeting */}
                    <div className="space-y-2">
                        <div className="text-5xl">{greetingEmoji}</div>
                        <h1 className="font-black text-on-surface tracking-tight" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)' }}>
                            {greeting}{firstName ? `,` : ''}
                            {firstName && <><br />{firstName}.</>}
                        </h1>
                        <p className="text-sm font-medium text-on-surface-variant mt-1">{modeTagline}</p>
                    </div>

                    {/* Streak + Momentum pills */}
                    {(snapshot.streak > 0 || snapshot.momentumScore > 0) && (
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                            {snapshot.streak > 0 && (
                                <div className="flex items-center gap-1.5 bg-[#ff9f0a]/10 border border-[#ff9f0a]/20 rounded-full px-3.5 py-1.5">
                                    <Flame size={12} className="text-[#ff9f0a]" />
                                    <span className="text-[11px] font-bold text-[#ff9f0a]">{snapshot.streak}-day streak</span>
                                </div>
                            )}
                            {snapshot.momentumScore > 0 && (
                                <div className="flex items-center gap-1.5 bg-[#0a84ff]/10 border border-[#0a84ff]/20 rounded-full px-3.5 py-1.5">
                                    <Zap size={12} className="text-[#0a84ff]" />
                                    <span className="text-[11px] font-bold text-[#0a84ff]">{snapshot.momentumScore}% momentum</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <p className="absolute bottom-10 text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant opacity-30 animate-in fade-in duration-700 delay-500">
                    Tap anywhere to continue
                </p>
            </div>
        );
    }

    // ─── SLIDES 2–4: Premium glass stats modal ──────────────────────────────────
    const SLIDE_META = [
        { icon: CheckCircle2,  color: 'text-[#30d158]',  bg: 'bg-[#30d158]/10' },
        { icon: AlertTriangle, color: 'text-[#ff453a]',  bg: 'bg-[#ff453a]/10' },
        { icon: Target,        color: 'text-[#0a84ff]',  bg: 'bg-[#0a84ff]/10' },
    ];
    // currentSlide is 2, 3, or 4 → index into meta is currentSlide - 2
    const metaIdx = currentSlide - 2;
    const meta = SLIDE_META[metaIdx];
    const SlideIcon = meta.icon;

    return (
        <div
            className={clsx(
                'fixed inset-0 z-[99999] flex items-end sm:items-center justify-center sm:p-6',
                'transition-all duration-300',
                isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Scrim */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />

            {/* Card */}
            <div className={clsx(
                'relative w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] overflow-hidden',
                'bg-card-white border border-white/10 dark:border-white/8',
                'shadow-[0_-8px_60px_rgba(0,0,0,0.35)] sm:shadow-[0_24px_60px_rgba(0,0,0,0.4)]',
                'transition-all duration-500',
                isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            )}>
                {/* Glass inner-light layers */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                {/* Handle pill (mobile) */}
                <div className="sm:hidden w-10 h-1 bg-on-surface/20 rounded-full mx-auto mt-3 mb-1" />

                {/* 3-segment progress bar (tracks slides 2-4) */}
                <div className="flex gap-1.5 px-5 pt-4 pb-0">
                    {[2, 3, 4].map((i) => (
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

                    {/* Floating header */}
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', meta.bg, meta.color)}>
                            <SlideIcon size={16} />
                        </div>
                        <span className="font-black text-base text-on-surface tracking-tight">
                            {slideLabels[metaIdx]}
                        </span>
                    </div>

                    {/* Slide content */}
                    <div className="animate-in fade-in slide-in-from-right-4 duration-400 min-h-[160px]" key={currentSlide}>

                        {/* ── SLIDE 2: Execution Review ── */}
                        {currentSlide === 2 && (
                            <div className="space-y-2.5">
                                {progressItems.map((item) => {
                                    const Icon = item.icon;
                                    const pct = item.target > 0 ? Math.min((item.current / item.target) * 100, 100) : 0;
                                    const displayVal = item.displayValue
                                        || `${item.current.toLocaleString()} / ${item.target.toLocaleString()} ${item.unit}`.trim();

                                    return (
                                        <div key={item.label} className="bg-on-surface/4 rounded-2xl px-4 py-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2.5">
                                                    <Icon size={14} style={{ color: item.color }} />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{item.label}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[12px] font-bold text-on-surface">{displayVal}</span>
                                                    {item.met && <CheckCircle2 size={12} className="text-[#30d158]" />}
                                                </div>
                                            </div>
                                            <div className="h-[3px] bg-on-surface/8 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                                    style={{
                                                        width: `${pct}%`,
                                                        backgroundColor: item.met ? '#30d158' : item.color,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── SLIDE 3: Bottlenecks ── */}
                        {currentSlide === 3 && (
                            bottlenecks.length > 0 ? (
                                <div className="space-y-2">
                                    {bottlenecks.map((b, idx) => {
                                        const isCritical = b.severity === 'critical';
                                        return (
                                            <div
                                                key={idx}
                                                className={clsx(
                                                    'flex items-start gap-3 rounded-2xl px-4 py-3',
                                                    isCritical ? 'bg-[#ff453a]/8' : 'bg-[#ff9f0a]/8'
                                                )}
                                            >
                                                <AlertTriangle
                                                    size={15}
                                                    className={clsx('shrink-0 mt-0.5', isCritical ? 'text-[#ff453a]' : 'text-[#ff9f0a]')}
                                                />
                                                <span className="text-sm font-semibold text-on-surface">{b.text}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="w-10 h-10 rounded-2xl bg-[#30d158]/10 flex items-center justify-center mb-3">
                                        <CheckCircle2 size={20} className="text-[#30d158]" />
                                    </div>
                                    <p className="text-sm font-bold text-on-surface">Peak Efficiency</p>
                                    <p className="text-xs text-on-surface-variant mt-1">No critical bottlenecks detected today.</p>
                                </div>
                            )
                        )}

                        {/* ── SLIDE 4: Targets ── */}
                        {currentSlide === 4 && (
                            <div className="space-y-2">
                                {[
                                    { icon: Droplets, label: 'Hydration', value: `${snapshot.waterProgress.target.toLocaleString()} ml`,                                         color: 'text-[#0a84ff]', bg: 'bg-[#0a84ff]/10' },
                                    { icon: Dumbbell, label: 'Workout',   value: snapshot.workoutName || 'Rest Day / TBD',                                                       color: 'text-[#ff9f0a]', bg: 'bg-[#ff9f0a]/10' },
                                    { icon: Target,   label: 'Diet',      value: `${snapshot.caloriesProgress.target.toLocaleString()} kcal · ${snapshot.proteinProgress.target}g protein`, color: 'text-[#30d158]', bg: 'bg-[#30d158]/10' },
                                    { icon: Moon,     label: 'Sleep',     value: `${snapshot.sleepProgress.target}h target`,                                                     color: 'text-[#bf5af2]', bg: 'bg-[#bf5af2]/10' },
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
                                currentSlide <= 2 && 'invisible'
                            )}
                        >
                            Back
                        </button>
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-[13px] text-white active:scale-95 transition-all shadow-[0_4px_20px_rgba(10,132,255,0.35)] hover:shadow-[0_4px_28px_rgba(10,132,255,0.5)]"
                            style={{ backgroundColor: '#0a84ff' }}
                        >
                            {currentSlide === LAST_SLIDE ? "Let's Go" : 'Next'}
                            {currentSlide < LAST_SLIDE && <ArrowRight size={14} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
