'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import IOSDatePicker from '@/app/components/IOSDatePicker';



export default function OnboardingPage() {
    const [dob, setDob] = useState(new Date(2000, 0, 1));
    const [isSaving, setIsSaving] = useState(false);
    const { user, updateUserProfile } = useAuth();
    const router = useRouter();

    const handleComplete = async () => {
        if (!user) return;
        setIsSaving(true);
        
        try {
            // Calculate age
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                age--;
            }

            const isUnder18 = age < 18;

            await updateUserProfile({
                dob: dob.toISOString().split('T')[0],
                accepted_terms: true,
                accepted_privacy: true,
            });

            localStorage.setItem('workout_os_onboarded', 'true');
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Error saving onboarding data', error);
            alert("Database Error: " + (error?.message || "Something went wrong") + "\n\nPlease make sure you've run the SQL migration to add the 'dob' column to the 'profiles' table.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-on-surface mb-2">When were you born?</h1>
                    <p className="text-on-surface-variant text-sm px-4">
                        We need this to personalize your targets and ensure we provide age-appropriate features.
                    </p>
                </div>

                <div className="py-8">
                    <IOSDatePicker value={dob} onChange={setDob} />
                </div>

                <button
                    onClick={handleComplete}
                    disabled={isSaving}
                    className="w-full bg-primary text-on-primary font-bold h-14 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                >
                    {isSaving ? <Loader2 className="animate-spin" /> : (
                        <>Complete Setup <ArrowRight size={20} /></>
                    )}
                </button>

                <p className="text-xs text-center text-on-surface-variant px-4">
                    By continuing, you agree to our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
                </p>
            </div>
        </div>
    );
}
