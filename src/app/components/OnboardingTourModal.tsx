'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, X, Compass, ChevronRight } from 'lucide-react';

const ONBOARDING_KEY = 'workout_os_onboarding_completed_v1';

export interface TutorialStep {
    targetId: string;
    title: string;
    coachMessage: string;
    actionHint: string;
    icon: string;
    requiredPath: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        targetId: 'tour-add-food',
        title: 'Task 1: Log Your First Food Item',
        coachMessage: 'Welcome! Tap the "+" button next to Breakfast to log a meal or pick a preset!',
        actionHint: 'Tap "+" next to Breakfast',
        icon: '🍳',
        requiredPath: '/diet',
    },
    {
        targetId: 'tour-water-page-add',
        title: 'Task 2: Track Hydration Intake',
        coachMessage: 'Now on the Hydration page! Tap "+ 250ml" to track 1 glass of water!',
        actionHint: 'Tap "+ 250ml" on Hydration page',
        icon: '💧',
        requiredPath: '/water',
    },
    {
        targetId: 'tour-workout-active-split',
        title: 'Task 3: Log Active Workout Split',
        coachMessage: 'Here is your Workout Tracker! Tap your active workout split to log sets & reps!',
        actionHint: 'Tap your Active Workout Split',
        icon: '🏋️',
        requiredPath: '/workout',
    },
    {
        targetId: 'tour-ai-log',
        title: 'Task 4: Try AI Voice & Text Parser',
        coachMessage: 'Final task! Tap "AI Voice & Text Log" to try natural language voice parsing!',
        actionHint: 'Tap "AI Voice & Text Log"',
        icon: '⚡',
        requiredPath: '/diet',
    },
];

export default function OnboardingTourModal() {
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
    const [isTourActive, setIsTourActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [viewportWidth, setViewportWidth] = useState(800);
    const [viewportHeight, setViewportHeight] = useState(600);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            setViewportWidth(window.innerWidth);
            setViewportHeight(window.innerHeight);
        }

        try {
            const completed = localStorage.getItem(ONBOARDING_KEY);
            if (!completed) {
                setIsWelcomeOpen(true);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    // Smart Multi-Page Route Navigation & Target Positioning
    useEffect(() => {
        if (!isTourActive || isFinished) return;

        const step = TUTORIAL_STEPS[currentStepIndex];
        if (!step) return;

        // Auto-navigate to step's required page if not currently there
        if (pathname !== step.requiredPath) {
            router.push(step.requiredPath);
            return;
        }

        const updateTarget = () => {
            if (typeof window !== 'undefined') {
                setViewportWidth(window.innerWidth);
                setViewportHeight(window.innerHeight);
            }

            const el = document.getElementById(step.targetId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTargetRect(el.getBoundingClientRect());
            } else {
                setTargetRect(null);
            }
        };

        const timer = setTimeout(updateTarget, 300);
        window.addEventListener('resize', updateTarget);
        window.addEventListener('scroll', updateTarget, true);

        const interval = setInterval(updateTarget, 500);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateTarget);
            window.removeEventListener('scroll', updateTarget, true);
            clearInterval(interval);
        };
    }, [isTourActive, currentStepIndex, isFinished, pathname, router]);

    // Handle clicks on target elements to auto-advance tutorial to next page/step
    useEffect(() => {
        if (!isTourActive || isFinished) return;

        const step = TUTORIAL_STEPS[currentStepIndex];
        if (!step || pathname !== step.requiredPath) return;

        const el = document.getElementById(step.targetId);
        if (!el) return;

        const handleTargetClick = () => {
            if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
                const nextStep = TUTORIAL_STEPS[currentStepIndex + 1];
                setCurrentStepIndex((prev) => prev + 1);
                if (nextStep && nextStep.requiredPath !== pathname) {
                    router.push(nextStep.requiredPath);
                }
            } else {
                setIsFinished(true);
                setIsTourActive(false);
                try {
                    localStorage.setItem(ONBOARDING_KEY, 'true');
                } catch (e) {
                    console.error(e);
                }
            }
        };

        el.addEventListener('click', handleTargetClick, { once: true });
        return () => {
            el.removeEventListener('click', handleTargetClick);
        };
    }, [isTourActive, currentStepIndex, isFinished, pathname, router]);

    if (!mounted) return null;

    const currentStep = TUTORIAL_STEPS[currentStepIndex];

    const handleStartTour = () => {
        setIsWelcomeOpen(false);
        setIsTourActive(true);
        setCurrentStepIndex(0);
        if (pathname !== '/diet') {
            router.push('/diet');
        }
    };

    const handleCloseTour = () => {
        setIsTourActive(false);
        setIsWelcomeOpen(false);
        try {
            localStorage.setItem(ONBOARDING_KEY, 'true');
        } catch (e) {
            console.error(e);
        }
    };

    const handleNextStepManual = () => {
        if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
            const nextStep = TUTORIAL_STEPS[currentStepIndex + 1];
            setCurrentStepIndex((prev) => prev + 1);
            if (nextStep && nextStep.requiredPath !== pathname) {
                router.push(nextStep.requiredPath);
            }
        } else {
            setIsFinished(true);
            setIsTourActive(false);
            try {
                localStorage.setItem(ONBOARDING_KEY, 'true');
            } catch (e) {
                console.error(e);
            }
        }
    };

    // Calculate smart adaptive positions for Speech Bubble and Pointer Hand
    let isTargetInTopHalf = true;
    let bubbleTop = 20;
    let bubbleLeft = 16;
    let handTop = 0;
    let handLeft = 0;
    let handIcon = '👆';

    if (targetRect) {
        isTargetInTopHalf = targetRect.top < viewportHeight / 2;

        // On mobile (< 640px), center speech bubble; on desktop, align to target
        const isMobile = viewportWidth < 640;
        const bubbleWidth = isMobile ? viewportWidth - 32 : 300;

        if (isMobile) {
            bubbleLeft = 16;
        } else {
            bubbleLeft = Math.min(
                viewportWidth - bubbleWidth - 20,
                Math.max(20, targetRect.left + targetRect.width / 2 - bubbleWidth / 2)
            );
        }

        if (isTargetInTopHalf) {
            // Position Speech Bubble BELOW the target button
            bubbleTop = Math.min(viewportHeight - 160, targetRect.bottom + 24);
            handTop = targetRect.bottom + 4;
            handLeft = targetRect.left + targetRect.width / 2 - 16;
            handIcon = '👆';
        } else {
            // Position Speech Bubble ABOVE the target button
            bubbleTop = Math.max(10, targetRect.top - 165);
            handTop = targetRect.top - 36;
            handLeft = targetRect.left + targetRect.width / 2 - 16;
            handIcon = '👇';
        }
    }

    const modalJSX = (
        <>
            {/* 1. Welcome Intro Modal */}
            {isWelcomeOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900/95 backdrop-blur-md rounded-3xl w-full max-w-md p-6 shadow-[0_25px_80px_rgba(0,0,0,0.4)] border border-gray-200 text-center flex flex-col items-center relative">
                        <button
                            onClick={handleCloseTour}
                            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-gray-400 dark:text-gray-500"
                        >
                            <X size={18} />
                        </button>

                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-emerald-600 text-white flex items-center justify-center text-3xl shadow-lg mb-3 animate-bounce">
                            🧭
                        </div>

                        <h2 className="text-xl font-black text-gray-900 drop-shadow-sm mb-1">
                            Welcome to Workout OS!
                        </h2>
                        <h3 className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider mb-3">
                            Interactive Multi-Page Guided Tour
                        </h3>

                        <p className="text-xs text-gray-600 font-bold leading-relaxed mb-6 bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
                            We will guide you across Diet, Hydration, and Workout pages! Follow the glowing spotlight and hand pointer (👆) to master each section!
                        </p>

                        <button
                            onClick={handleStartTour}
                            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl btn-press"
                        >
                            Start Multi-Page Guided Tour <Sparkles size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Interactive Multi-Page Spotlight Overlay & Bouncing Pointer Hand */}
            {isTourActive && !isFinished && (
                <div className="fixed inset-0 z-[140] pointer-events-none">
                    {/* Dark Dimmed Backdrop Overlay */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] transition-all duration-300 pointer-events-none" />

                    {/* Spotlight Ring around target element */}
                    {targetRect && (
                        <div
                            className="absolute rounded-2xl border-4 border-yellow-400 shadow-[0_0_35px_12px_rgba(234,179,8,0.9)] animate-pulse pointer-events-none transition-all duration-300 z-[145]"
                            style={{
                                top: targetRect.top - 6,
                                left: targetRect.left - 6,
                                width: targetRect.width + 12,
                                height: targetRect.height + 12,
                            }}
                        />
                    )}

                    {/* Bouncing Hand Pointer pointing cleanly at button */}
                    {targetRect && (
                        <div
                            className="fixed z-[155] text-3xl animate-bounce pointer-events-none drop-shadow-[0_10px_10px_rgba(0,0,0,0.6)] transition-all duration-300"
                            style={{
                                top: handTop,
                                left: handLeft,
                            }}
                        >
                            {handIcon}
                        </div>
                    )}

                    {/* Speech Bubble Card */}
                    {targetRect ? (
                        <div
                            className="fixed z-[150] pointer-events-auto transition-all duration-300"
                            style={{
                                top: bubbleTop,
                                left: bubbleLeft,
                                width: viewportWidth < 640 ? 'calc(100vw - 32px)' : '300px',
                            }}
                        >
                            <div className="bg-white dark:bg-slate-900/95 backdrop-blur-md border-2 border-yellow-400 rounded-3xl p-4 shadow-2xl space-y-2 relative animate-in fade-in duration-200">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-base">{currentStep?.icon}</span>
                                        <span className="text-[11px] font-black text-gray-900 uppercase tracking-wider">
                                            Task {currentStepIndex + 1} of {TUTORIAL_STEPS.length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleCloseTour}
                                        className="text-gray-400 hover:text-gray-600 text-[10px] font-bold"
                                    >
                                        Skip Tour
                                    </button>
                                </div>
                                <p className="text-xs font-bold text-gray-800 leading-snug">
                                    {currentStep?.coachMessage}
                                </p>
                                <div className="flex items-center justify-between gap-1 pt-1">
                                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-xl border border-emerald-200">
                                        {currentStep?.actionHint}
                                    </span>
                                    <button
                                        onClick={handleNextStepManual}
                                        className="text-[10px] font-bold text-cyan-700 hover:underline flex items-center"
                                    >
                                        Next Step <ChevronRight size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Loading / Transition Indicator */
                        <div className="fixed bottom-24 right-4 z-[150] bg-white dark:bg-slate-900/95 backdrop-blur-md border-2 border-yellow-400 rounded-3xl p-4 shadow-2xl w-80 pointer-events-auto animate-in slide-in-from-bottom-5">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                                <div className="flex items-center gap-1.5 text-xs font-black text-gray-900 dark:text-white">
                                    <span>{currentStep?.icon}</span>
                                    <span>{currentStep?.title}</span>
                                </div>
                                <button
                                    onClick={handleCloseTour}
                                    className="text-gray-400 hover:text-gray-600 text-[10px] font-bold"
                                >
                                    Skip Tour
                                </button>
                            </div>
                            <p className="text-xs font-bold text-gray-700 mb-3">
                                Navigating to <span className="text-emerald-600 uppercase font-black">{currentStep?.requiredPath}</span>...
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => router.push(currentStep?.requiredPath || '/diet')}
                                    className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm btn-press"
                                >
                                    Open Page <ChevronRight size={14} />
                                </button>
                                <button
                                    onClick={handleNextStepManual}
                                    className="px-3 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl"
                                >
                                    Skip
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 3. Victory Celebration Modal */}
            {isFinished && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900/95 backdrop-blur-md rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-200 text-center flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-600 flex items-center justify-center text-3xl shadow-lg mb-3 animate-bounce">
                            🏆
                        </div>

                        <h2 className="text-xl font-black text-gray-900 drop-shadow-sm mb-1">
                            Guided Tour Completed!
                        </h2>
                        <h3 className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider mb-3">
                            Workout OS Pioneer Badge Unlocked!
                        </h3>

                        <p className="text-xs text-gray-600 font-bold leading-relaxed mb-6 bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                            Awesome job! You have explored Diet, Hydration, Workouts, and AI features!
                        </p>

                        <button
                            onClick={() => setIsFinished(false)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl btn-press"
                        >
                            Enter Workout OS <Sparkles size={16} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );

    return createPortal(modalJSX, document.body);
}
