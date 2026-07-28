'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Dumbbell, Droplet, Apple, Moon, IndianRupee, Calendar, ChevronRight } from 'lucide-react';

const ONBOARDING_KEY = 'workout_os_onboarding_completed_v1';

const FEATURES = [
    { icon: <Moon size={18} />, color: 'bg-indigo-100 text-indigo-600', label: 'Sleep', desc: 'Log your nightly rest' },
    { icon: <Droplet size={18} />, color: 'bg-blue-100 text-blue-600', label: 'Water', desc: 'Track hydration' },
    { icon: <Dumbbell size={18} />, color: 'bg-orange-100 text-orange-600', label: 'Workout', desc: 'Log sets & reps' },
    { icon: <Apple size={18} />, color: 'bg-green-100 text-green-600', label: 'Diet', desc: 'Count calories with AI' },
    { icon: <IndianRupee size={18} />, color: 'bg-purple-100 text-purple-600', label: 'Budget', desc: 'Track spending' },
    { icon: <Calendar size={18} />, color: 'bg-rose-100 text-rose-600', label: 'Planner', desc: 'Manage your day' },
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
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white text-center relative">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                        <X size={16} />
                    </button>
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg">
                        💪
                    </div>
                    <h2 className="text-xl font-black tracking-tight">Welcome to Workout OS</h2>
                    <p className="text-emerald-100 text-xs font-medium mt-1">Your all-in-one fitness & life tracker</p>
                </div>

                {/* Features Grid */}
                <div className="p-5">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">What you can track</p>
                    <div className="grid grid-cols-3 gap-2 mb-5">
                        {FEATURES.map((f) => (
                            <div key={f.label} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${f.color}`}>
                                    {f.icon}
                                </div>
                                <span className="text-[10px] font-bold text-gray-700">{f.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-emerald-600 flex-shrink-0" />
                            <p className="text-xs text-emerald-800 font-semibold leading-snug">
                                Use <strong>Nova AI Copilot</strong> on the dashboard to log food, workouts, and water with natural language!
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-3 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-colors"
                    >
                        Get Started <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
