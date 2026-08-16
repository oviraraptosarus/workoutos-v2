'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, ChevronLeft, Check, Sparkles } from 'lucide-react';

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
    const { updateUserProfile } = useAuth();
    
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [goal, setGoal] = useState('Build Muscle');
    const [currentWeight, setCurrentWeight] = useState<number | ''>(75);
    const [targetWeight, setTargetWeight] = useState<number | ''>(70);
    const [heightCm, setHeightCm] = useState<number | ''>(170);
    const [age, setAge] = useState<number | ''>(25);
    const [gender, setGender] = useState<'male'|'female'|'other'>('male');
    const [activityLevel, setActivityLevel] = useState('sedentary');

    if (!isOpen) return null;

    const saveProfile = async () => {
        setIsSubmitting(true);
        try {
            // Calculate an approximate DOB from age
            const dob = new Date();
            dob.setFullYear(dob.getFullYear() - (Number(age) || 25));
            const dobString = dob.toLocaleDateString('en-CA');

            await updateUserProfile({
                fitnessGoal: goal || 'Build Muscle',
                currentWeight: Number(currentWeight) || 75,
                targetWeight: Number(targetWeight) || 70,
                heightCm: Number(heightCm) || 170,
                dob: dobString,
                gender: gender || 'male',
                activityLevel: activityLevel || 'sedentary',
                accepted_terms: true,
                accepted_privacy: true,
                terms_version: 'v2.0',
                privacy_version: 'v2.0',
                onboarding_completed: true,
                accepted_at: new Date().toISOString()
            } as any);
            
            onComplete();
        } catch (error: any) {
            console.error("Failed to save profile", error);
            if (typeof window !== 'undefined') alert("Failed to save profile: " + (error.message || JSON.stringify(error)));
            setIsSubmitting(false);
            setStep(0); // reset on error to let them try again
        }
    };

    const nextStep = () => {
        if (step === 7) {
            setStep(8);
            saveProfile();
        } else {
            setStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        setStep(prev => Math.max(0, prev - 1));
    };

    // Generic large input rendering
    const renderNumberInput = (value: number | '', setter: (v: number | '') => void, unit: string) => (
        <div className="flex flex-col items-center justify-center flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-baseline gap-2">
                    <input
                        type="number"
                        autoFocus
                        value={value}
                        onChange={(e) => setter(e.target.value === '' ? '' : Number(e.target.value))}
                        onKeyDown={(e) => e.key === 'Enter' && value !== '' && nextStep()}
                        className="w-24 bg-transparent text-center font-display-md text-4xl font-bold text-on-surface focus:outline-none placeholder:text-surface-variant"
                        placeholder="0"
                    />
                <span className="font-label-lg text-xl text-on-surface-variant">{unit}</span>
            </div>
        </div>
    );

    // Generic list selection rendering
    const renderList = (options: {id: string, label: string}[], currentVal: string, setter: (v: string) => void) => (
        <div className="w-full flex flex-col gap-2 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {options.map(opt => {
                const active = currentVal === opt.id;
                return (
                    <button
                        key={opt.id}
                        onClick={() => {
                            setter(opt.id);
                            setTimeout(nextStep, 150); // Auto advance for premium feel
                        }}
                        className={`relative w-full p-4 text-left rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                            active 
                            ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]' 
                            : 'border-surface-variant hover:border-on-surface-variant/30 bg-surface-container-lowest'
                        }`}
                    >
                        <div className="flex justify-between items-center relative z-10">
                            <span className={`font-bold text-base ${active ? 'text-primary' : 'text-on-surface'}`}>
                                {opt.label}
                            </span>
                            {active && <Check className="text-primary" size={18} />}
                        </div>
                    </button>
                )
            })}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl transition-all duration-300 px-4">
            <div className="w-full max-w-md h-[100dvh] overflow-y-auto flex flex-col py-6 relative no-scrollbar">
                
                {/* Header / Back Button */}
                {step > 0 && step < 8 && (
                    <button 
                        onClick={prevStep}
                        className="absolute top-8 left-6 p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                )}

                <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-16 w-full">
                    
                    {step === 0 && (
                        <div className="text-center animate-in zoom-in-95 fade-in duration-700 w-full flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)] overflow-hidden">
                                <img src="/logo.png" alt="Workout OS Logo" className="w-full h-full object-cover" />
                            </div>
                            <h1 className="font-display-md text-2xl font-bold text-on-surface mb-3">Welcome to Workout OS</h1>
                            <p className="text-on-surface-variant text-base mb-8">Let's personalize your experience.</p>
                            
                            <button 
                                onClick={() => {
                                    setStep(8);
                                    saveProfile();
                                }}
                                className="text-primary font-bold hover:underline"
                            >
                                Skip Onboarding
                            </button>
                        </div>
                    )}

                    {step === 1 && (
                        <>
                            <h2 className="font-display-lg text-2xl font-bold text-on-surface w-full text-center mb-2">What's your goal?</h2>
                            {renderList([
                                { id: 'Lose Fat', label: 'Lose Fat' },
                                { id: 'Build Muscle', label: 'Build Muscle' },
                                { id: 'Recomposition', label: 'Recomposition' },
                                { id: 'Maintain', label: 'Maintain' },
                                { id: 'Athletic Performance', label: 'Athletic Performance' }
                            ], goal, setGoal)}
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <h2 className="font-display-lg text-2xl font-bold text-on-surface w-full text-center">What's your current weight?</h2>
                            {renderNumberInput(currentWeight, setCurrentWeight, 'kg')}
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <h2 className="font-display-lg text-2xl font-bold text-on-surface w-full text-center">Target weight?</h2>
                            {renderNumberInput(targetWeight, setTargetWeight, 'kg')}
                        </>
                    )}

                    {step === 4 && (
                        <>
                            <h2 className="font-display-lg text-2xl font-bold text-on-surface w-full text-center">Height?</h2>
                            {renderNumberInput(heightCm, setHeightCm, 'cm')}
                        </>
                    )}

                    {step === 5 && (
                        <>
                            <h2 className="font-display-lg text-2xl font-bold text-on-surface w-full text-center">Age?</h2>
                            {renderNumberInput(age, setAge, 'years')}
                        </>
                    )}

                    {step === 6 && (
                        <>
                            <h2 className="font-display-lg text-2xl font-bold text-on-surface w-full text-center mb-2">Gender?</h2>
                            {renderList([
                                { id: 'male', label: 'Male' },
                                { id: 'female', label: 'Female' },
                                { id: 'other', label: 'Other' }
                            ], gender, (v) => setGender(v as any))}
                        </>
                    )}

                    {step === 7 && (
                        <>
                            <h2 className="font-display-lg text-2xl font-bold text-on-surface w-full text-center mb-2">Activity Level</h2>
                            {renderList([
                                { id: 'sedentary', label: 'Sedentary (Office job, little exercise)' },
                                { id: 'light', label: 'Light (Light exercise 1-3 days/week)' },
                                { id: 'moderate', label: 'Moderate (Moderate exercise 3-5 days/week)' },
                                { id: 'active', label: 'Active (Hard exercise 6-7 days/week)' },
                                { id: 'athlete', label: 'Athlete (Very hard exercise & physical job)' }
                            ], activityLevel, setActivityLevel)}
                        </>
                    )}

                    {step === 8 && (
                        <div className="text-center animate-pulse w-full flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8"></div>
                            <h2 className="font-display-lg text-2xl font-bold text-on-surface">Done.</h2>
                            <p className="text-on-surface-variant mt-2">Building your Fitness Engine...</p>
                        </div>
                    )}
                </div>

                {/* Sticky Bottom Next Button for numeric inputs or Welcome */}
                {((step === 0) || (step >= 2 && step <= 5)) && (
                    <div className="absolute bottom-8 left-0 right-0 px-6">
                        <button
                            onClick={nextStep}
                            className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(var(--primary-rgb),0.3)] flex items-center justify-center gap-2 active:scale-95 text-lg"
                        >
                            {step === 0 ? 'Continue' : 'Next'} <ArrowRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

