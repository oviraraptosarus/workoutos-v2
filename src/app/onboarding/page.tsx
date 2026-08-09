'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import IOSDatePicker from '@/app/components/IOSDatePicker';

const quotes = [
    { text: '"Tell me, what is it you plan to do with your one wild and precious life?"', subtext: "— Mary Oliver" },
    { text: '"You could leave life right now. Let that determine what you do and say and think."', subtext: "— Marcus Aurelius" },
    { text: '"Amateurs sit and wait for inspiration, the rest of us just get up and go to work."', subtext: "— Stephen King" },
    { text: '"We suffer more often in imagination than in reality."', subtext: "— Seneca" },
    { text: '"Don\'t stop when you\'re tired. Stop when you\'re done."', subtext: "— David Goggins" }
];

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [quote, setQuote] = useState(quotes[0]);
    const [dob, setDob] = useState(new Date(2000, 0, 1));
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, []);

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

            await supabase
                .from('profiles')
                .update({ 
                    dob: dob.toISOString().split('T')[0],
                    accepted_terms: true,
                    accepted_privacy: true,
                    // If under 18, we might set a flag here, or we calculate it dynamically elsewhere.
                })
                .eq('id', user.id);

            localStorage.setItem('workout_os_onboarded', 'true');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error saving onboarding data', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (step === 0) {
        return (
            <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 cursor-pointer" onClick={() => setStep(1)}>
                <div className="max-w-md text-center animate-in fade-in duration-1000">
                    <p className="font-display-md text-2xl leading-relaxed mb-4">{quote.text}</p>
                    <p className="text-on-surface-variant text-sm font-semibold">{quote.subtext}</p>
                    <div className="mt-12 text-on-surface-variant/50 text-xs tracking-widest uppercase animate-pulse">Tap anywhere to begin</div>
                </div>
            </div>
        );
    }

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
