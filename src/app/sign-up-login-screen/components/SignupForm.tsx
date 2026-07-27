'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles } from 'lucide-react';

export default function SignupForm() {
    const { signUp } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fitnessGoal, setFitnessGoal] = useState('Build Muscle & Stay Active');
    const [currentWeight, setCurrentWeight] = useState('80');
    const [targetWeight, setTargetWeight] = useState('82');
    const [dob, setDob] = useState('');
    const [error, setError] = useState('');

    const focusNext = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, nextId?: string) => {
        if (e.key === 'Enter' && nextId) {
            e.preventDefault();
            document.getElementById(nextId)?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await signUp(email, password, {
                fullName: fullName || email.split('@')[0],
                fitnessGoal,
                currentWeight: Number(currentWeight) || 80,
                targetWeight: Number(targetWeight) || 82,
                dob // Include DOB in metadata
            });
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to sign up');
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 text-xs bg-blue-50 border border-blue-100 rounded-xl text-blue-600 flex items-center gap-1.5 font-semibold">
                <Sparkles size={14} className="shrink-0" />
                <span>Your profile info will be securely cached locally.</span>
            </div>

            {error && <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-semibold">{error}</div>}
            
            <div>
                <label htmlFor="signup-fullname" className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <input
                    id="signup-fullname"
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onKeyDown={(e) => focusNext(e, 'signup-email')}
                    enterKeyHint="next"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div>
                <label htmlFor="signup-email" className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="alex@workoutos.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => focusNext(e, 'signup-dob')}
                    enterKeyHint="next"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div>
                <label htmlFor="signup-dob" className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                    id="signup-dob"
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    onKeyDown={(e) => focusNext(e, 'signup-goal')}
                    enterKeyHint="next"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div>
                <label htmlFor="signup-goal" className="block text-xs font-medium text-gray-700 mb-1">Fitness Primary Goal</label>
                <select
                    id="signup-goal"
                    value={fitnessGoal}
                    onChange={(e) => setFitnessGoal(e.target.value)}
                    onKeyDown={(e) => focusNext(e, 'signup-currentwt')}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                    <option value="Build Muscle & Stay Active">Build Muscle & Stay Active</option>
                    <option value="Weight Loss & Fat Burn">Weight Loss & Fat Burn</option>
                    <option value="General Health & Conditioning">General Health & Conditioning</option>
                    <option value="Endurance & Athletic Prep">Endurance & Athletic Prep</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
                <div>
                    <label htmlFor="signup-currentwt" className="block text-xs font-medium text-gray-700 mb-1">Current Wt (kg)</label>
                    <input
                        id="signup-currentwt"
                        type="number"
                        value={currentWeight}
                        onChange={(e) => setCurrentWeight(e.target.value)}
                        onKeyDown={(e) => focusNext(e, 'signup-targetwt')}
                        enterKeyHint="next"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="signup-targetwt" className="block text-xs font-medium text-gray-700 mb-1">Target Wt (kg)</label>
                    <input
                        id="signup-targetwt"
                        type="number"
                        value={targetWeight}
                        onChange={(e) => setTargetWeight(e.target.value)}
                        onKeyDown={(e) => focusNext(e, 'signup-password')}
                        enterKeyHint="next"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="signup-password" className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <input
                    id="signup-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    enterKeyHint="go"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm shadow-sm mt-1"
            >
                Create Account & Cache Profile
            </button>
        </form>
    );
}
