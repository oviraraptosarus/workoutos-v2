'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Dumbbell, Droplet, Apple, Moon, IndianRupee, Calendar, ChevronRight } from 'lucide-react';

const ONBOARDING_KEY = 'workout_os_onboarding_completed_v1';

const FEATURES = [
    { icon: <Moon size={18} />, color: 'bg-indigo-100 text-white dark:bg-white/20 dark:text-white', label: 'Sleep', desc: 'Log your nightly rest' },
    { icon: <Droplet size={18} />, color: 'bg-blue-100 text-white dark:bg-white/20 dark:text-white', label: 'Water', desc: 'Track hydration' },
    { icon: <Dumbbell size={18} />, color: 'bg-orange-100 text-white dark:bg-white/20 dark:text-white', label: 'Workout', desc: 'Log sets & reps' },
    { icon: <Apple size={18} />, color: 'bg-green-100 text-white dark:bg-white/20 dark:text-white', label: 'Diet', desc: 'Count calories with AI' },
    { icon: <IndianRupee size={18} />, color: 'bg-purple-100 text-white dark:bg-white/20 dark:text-white', label: 'Budget', desc: 'Track spending' },
    { icon: <Calendar size={18} />, color: 'bg-rose-100 text-white dark:bg-white/20 dark:text-white', label: 'Planner', desc: 'Manage your day' },
];

export default function OnboardingTourModal() {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            const seen = localStorage.getItem(ONBOARDING_KEY);
            if (!seen) {
                setIsOpen(true);
                localStorage.setItem(ONBOARDING_KEY, 'true');
            }
        } catch (e) {
            // localStorage not available
        }
    }, []);

    const handleClose = () => setIsOpen(false);

    if (!mounted || !isOpen) return null;

    const modal = (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card-white rounded-3xl w-full max-w-sm shadow-2xl border border-surface-variant overflow-hidden">
                {/* Header */}
                <div className="p-6 text-center relative border-b border-surface-variant">
                    <button
                        onClick={handleClose}
                        aria-label="Close"
                        className="absolute top-4 right-4 p-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
                    >
                        <X size={16} />
                    </button>
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-[0_8px_24px_rgba(0,0,0,0.16)]">
                        <span className="material-symbols-outlined text-on-primary text-[28px]">vital_signs</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-on-surface">Welcome to Workout OS</h2>
                    <p className="text-on-surface-variant text-xs font-medium mt-1">Your all-in-one fitness &amp; life tracker</p>
                </div>

                {/* Features Grid */}
                <div className="p-5">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">What you can track</p>
                    <div className="grid grid-cols-3 gap-2 mb-5">
                        {FEATURES.map((f) => (
                            <div key={f.label} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-surface-container-low border border-surface-variant">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${f.color}`}>
                                    {f.icon}
                                </div>
                                <span className="text-[10px] font-bold text-on-surface-variant">{f.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-3 mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-secondary flex-shrink-0" />
                            <p className="text-xs text-on-surface font-semibold leading-snug">
                                Use <strong>Ava AI Copilot</strong> on the dashboard to log food, workouts, and water with natural language!
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                    >
                        Get Started <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
