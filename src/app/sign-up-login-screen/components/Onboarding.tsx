'use client';

import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const SLIDES = [
    {
        title: "Workout Tracking",
        description: "Log workouts, monitor strength, and stay consistent.",
        icon: "fitness_center",
        color: "text-activity-blue",
        bg: "bg-activity-blue/10"
    },
    {
        title: "Nutrition",
        description: "Track calories, macros, hydration, and meals effortlessly.",
        icon: "restaurant",
        color: "text-activity-green",
        bg: "bg-activity-green/10"
    },
    {
        title: "AI Coach (AVA)",
        description: "Get instant coaching, meal suggestions, workout advice, and progress insights.",
        icon: "auto_awesome",
        color: "text-secondary",
        bg: "bg-secondary/10"
    },
    {
        title: "Progress",
        description: "Track your body transformation with weight history and progress photos.",
        icon: "query_stats",
        color: "text-activity-orange",
        bg: "bg-activity-orange/10"
    },
    {
        title: "Everything Together",
        description: "Fitness, planning, budgeting, and AI—all in one ecosystem.",
        icon: "all_inclusive",
        color: "text-on-surface",
        bg: "bg-surface-container-high"
    }
];

interface OnboardingProps {
    onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && currentStep < SLIDES.length - 1) {
            setCurrentStep(s => s + 1);
        }
        if (isRightSwipe && currentStep > 0) {
            setCurrentStep(s => s - 1);
        }
    };

    const nextStep = () => {
        if (currentStep < SLIDES.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            onComplete();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(s => s - 1);
    };

    return (
        <div 
            className="relative min-h-screen flex flex-col bg-background overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div className="absolute top-8 right-6 z-10">
                <button 
                    onClick={onComplete}
                    className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface"
                >
                    Skip
                </button>
            </div>

            <div className="flex-1 relative">
                <div 
                    className="absolute inset-0 flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ transform: `translateX(-${currentStep * 100}%)` }}
                >
                    {SLIDES.map((slide, i) => (
                        <div key={i} className="min-w-full h-full flex flex-col items-center justify-center px-8 text-center pt-12 pb-24">
                            <div className={`w-32 h-32 rounded-3xl ${slide.bg} flex items-center justify-center mb-8 shadow-sm`}>
                                <span className={`material-symbols-outlined text-[64px] ${slide.color}`}>
                                    {slide.icon}
                                </span>
                            </div>
                            <h2 className="font-display-sm text-display-sm font-bold text-on-surface mb-4">
                                {slide.title}
                            </h2>
                            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xs">
                                {slide.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pb-[max(2rem,env(safe-area-inset-bottom))] px-6 pt-4 bg-background z-10 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-8">
                    {SLIDES.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-on-surface' : 'w-1.5 bg-surface-container-high'}`}
                        />
                    ))}
                </div>
                
                <div className="w-full flex items-center justify-between max-w-md mx-auto">
                    <button 
                        onClick={prevStep}
                        className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-opacity ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 bg-surface-container hover:bg-surface-container-high'}`}
                        aria-label="Previous step"
                    >
                        <ArrowLeft size={20} className="text-on-surface" />
                    </button>

                    <button 
                        onClick={nextStep}
                        className="flex-1 ml-4 bg-primary text-on-primary font-label-md text-label-md h-14 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                    >
                        {currentStep === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                        {currentStep === SLIDES.length - 1 ? null : <ArrowRight size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
