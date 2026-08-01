'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, ArrowRight } from 'lucide-react';

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
    const { userProfile, updateUserProfile } = useAuth();

    const [formData, setFormData] = useState({
        fullName: userProfile?.fullName || '',
        dob: userProfile?.dob || '',
        gender: userProfile?.gender || 'male',
        heightCm: userProfile?.heightCm || 170,
        currentWeight: userProfile?.currentWeight || 75,
        targetWeight: userProfile?.targetWeight || 70,
        fitnessGoal: userProfile?.fitnessGoal || 'Build Muscle & Stay Active',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateUserProfile({
            ...userProfile,
            ...formData,
        });
        onComplete();
    };

    const focusNext = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, nextId?: string) => {
        if (e.key === 'Enter' && nextId) {
            e.preventDefault();
            document.getElementById(nextId)?.focus();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-card-white border border-surface-variant rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                        <Sparkles size={20} /> Welcome to Workout OS
                    </h2>
                    <p className="text-sm font-medium text-blue-100">Let's set up your profile to personalize your experience.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <label htmlFor="onboarding-fullname" className="block text-xs font-bold text-on-surface-variant mb-1">Full Name</label>
                        <input
                            id="onboarding-fullname"
                            type="text"
                            required
                            placeholder="Alex Morgan"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            onKeyDown={(e) => focusNext(e, 'onboarding-dob')}
                            className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="onboarding-dob" className="block text-xs font-bold text-on-surface-variant mb-1">Date of Birth</label>
                        <input
                            id="onboarding-dob"
                            type="date"
                            required
                            value={formData.dob}
                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            onKeyDown={(e) => focusNext(e, 'onboarding-gender')}
                            className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="onboarding-gender" className="block text-xs font-bold text-on-surface-variant mb-1">Gender</label>
                            <select
                                id="onboarding-gender"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male'|'female'|'other' })}
                                onKeyDown={(e) => focusNext(e, 'onboarding-height')}
                                className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="onboarding-height" className="block text-xs font-bold text-on-surface-variant mb-1">Height (cm)</label>
                            <input
                                id="onboarding-height"
                                type="number"
                                required
                                value={formData.heightCm || ''}
                                onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                                onKeyDown={(e) => focusNext(e, 'onboarding-currentwt')}
                                className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="onboarding-currentwt" className="block text-xs font-bold text-on-surface-variant mb-1">Current Wt (kg)</label>
                            <input
                                id="onboarding-currentwt"
                                type="number"
                                required
                                value={formData.currentWeight || ''}
                                onChange={(e) => setFormData({ ...formData, currentWeight: Number(e.target.value) })}
                                onKeyDown={(e) => focusNext(e, 'onboarding-targetwt')}
                                className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="onboarding-targetwt" className="block text-xs font-bold text-on-surface-variant mb-1">Target Wt (kg)</label>
                            <input
                                id="onboarding-targetwt"
                                type="number"
                                required
                                value={formData.targetWeight || ''}
                                onChange={(e) => setFormData({ ...formData, targetWeight: Number(e.target.value) })}
                                onKeyDown={(e) => focusNext(e, 'onboarding-goal')}
                                className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="onboarding-goal" className="block text-xs font-bold text-on-surface-variant mb-1">Fitness Primary Goal</label>
                        <select
                            id="onboarding-goal"
                            value={formData.fitnessGoal}
                            onChange={(e) => setFormData({ ...formData, fitnessGoal: e.target.value })}
                            className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="Build Muscle & Stay Active">Build Muscle & Stay Active</option>
                            <option value="Weight Loss & Fat Burn">Weight Loss & Fat Burn</option>
                            <option value="General Health & Conditioning">General Health & Conditioning</option>
                            <option value="Endurance & Athletic Prep">Endurance & Athletic Prep</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-sm flex items-center justify-center gap-2"
                        >
                            Complete Setup <ArrowRight size={16} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
