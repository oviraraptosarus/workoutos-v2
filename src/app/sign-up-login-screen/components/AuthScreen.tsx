'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPassword from './ForgotPassword';
import Onboarding from './Onboarding';

type View = 'splash' | 'decision' | 'welcome' | 'onboarding' | 'login' | 'signup' | 'forgot_password';

const HIGHLIGHTS = (t: any) => [
    { icon: 'monitoring', label: t('auth.highlight1') !== 'auth.highlight1' ? t('auth.highlight1') : 'Workouts, diet, sleep & budget all in one place' },
    { icon: 'auto_awesome', label: t('auth.highlight2') !== 'auth.highlight2' ? t('auth.highlight2') : 'Ava, your AI health companion' },
    { icon: 'lock', label: t('auth.highlight3') !== 'auth.highlight3' ? t('auth.highlight3') : 'Completely private' },
];

export default function AuthScreen() {
    const { t } = useLanguage();
    const [view, setView] = useState<View>('splash');
    
    useEffect(() => {
        // Splash screen duration
        const timer = setTimeout(() => {
            const onboarded = localStorage.getItem('workout_os_onboarded');
            if (onboarded === 'true') {
                setView('welcome');
            } else {
                setView('onboarding');
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const completeOnboarding = () => {
        localStorage.setItem('workout_os_onboarded', 'true');
        setView('signup'); // Typically after onboarding they want to get started
    };

    if (view === 'splash') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-on-surface transition-opacity duration-500">
                <div className="w-24 h-24 rounded-[2rem] bg-black flex items-center justify-center shadow-2xl mb-6 animate-pulse">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-cover rounded-[2rem]" />
                </div>
                <h1 className="font-display-lg text-3xl font-bold tracking-tight">Workout OS</h1>
                <p className="font-body-md text-on-surface-variant mt-2 tracking-wide opacity-80">{t('auth.splash.subtitle') !== 'auth.splash.subtitle' ? t('auth.splash.subtitle') : 'Train smart. Track everything.'}</p>
            </div>
        );
    }

    if (view === 'onboarding') {
        return <Onboarding onComplete={completeOnboarding} />;
    }

    if (view === 'welcome') {
        return (
            <div className="relative min-h-screen flex flex-col px-6 overflow-hidden animate-in fade-in duration-500">
                <div className="pointer-events-none absolute -top-20 -right-12 w-64 h-64 rounded-full bg-secondary/15 blur-3xl" aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-28 -left-16 w-72 h-72 rounded-full bg-activity-green/10 blur-3xl" aria-hidden="true" />

                <div className="relative flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
                    <div className="inline-flex items-center justify-center w-[80px] h-[80px] rounded-[1.375rem] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.2)] mb-6 bg-black">
                        <img src="/logo.png" alt="Workout OS Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight leading-none">
                        {t('auth.welcome.title') !== 'auth.welcome.title' ? t('auth.welcome.title') : 'Your complete fitness OS.'}
                    </h1>
                    <p className="font-body-lg text-on-surface-variant mt-3 max-w-[17rem]">
                        {t('auth.welcome.desc') !== 'auth.welcome.desc' ? t('auth.welcome.desc') : 'Track workouts, nutrition, finances, habits, AI coaching and progress - all in one place.'}
                    </p>

                    <ul className="mt-8 space-y-3 w-full max-w-xs">
                        {HIGHLIGHTS(t).map((h) => (
                            <li key={h.icon} className="flex items-center gap-3 text-left">
                                <span className="w-9 h-9 shrink-0 rounded-xl bg-surface-container flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-secondary" style={{ fontSize: 19 }}>{h.icon}</span>
                                </span>
                                <span className="font-label-md text-label-md text-on-surface-variant">{h.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative max-w-md mx-auto w-full pb-[max(2rem,env(safe-area-inset-bottom))] pt-4 space-y-3">
                    <button
                        onClick={() => setView('signup')}
                        className="w-full bg-primary text-on-primary font-label-md text-label-md py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                    >
                        {t('auth.getStarted') !== 'auth.getStarted' ? t('auth.getStarted') : 'Get Started'} <ArrowRight size={17} />
                    </button>
                    <button
                        onClick={() => setView('login')}
                        className="w-full bg-surface-container text-on-surface font-label-md text-label-md py-4 rounded-2xl transition-transform active:scale-[0.98]"
                    >
                        {t('auth.alreadyHaveAccount') !== 'auth.alreadyHaveAccount' ? t('auth.alreadyHaveAccount') : 'I already have an account'}
                    </button>
                </div>
            </div>
        );
    }

    // Focused Sign In / Sign Up / Forgot Password views
    return (
        <div className="relative min-h-screen flex flex-col px-6 overflow-hidden bg-background">
            <div className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full bg-secondary/10 blur-3xl" aria-hidden="true" />

            <div className="relative pt-6 z-10">
                {view !== 'forgot_password' && (
                    <button
                        onClick={() => setView('welcome')}
                        aria-label="Back"
                        className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors active:scale-90"
                    >
                        <ChevronLeft size={22} />
                    </button>
                )}
            </div>

            <div className="relative flex-1 flex flex-col justify-center max-w-md mx-auto w-full pb-[max(2rem,env(safe-area-inset-bottom))] z-10">
                {view !== 'forgot_password' && (
                    <div className="mb-7 animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.16)] mb-5">
                            <img src="/logo.png" alt="Workout OS Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
                            {view === 'login' ? (t('auth.welcomeBack') !== 'auth.welcomeBack' ? t('auth.welcomeBack') : 'Welcome back') : (t('auth.createAccount') !== 'auth.createAccount' ? t('auth.createAccount') : 'Create your account')}
                        </h1>
                        <p className="font-body-md text-on-surface-variant mt-1.5">
                            {view === 'login' ? (t('auth.loginDesc') !== 'auth.loginDesc' ? t('auth.loginDesc') : 'Sign in to pick up where you left off.') : (t('auth.signupDesc') !== 'auth.signupDesc' ? t('auth.signupDesc') : 'Start tracking in under a minute.')}
                        </p>
                    </div>
                )}

                {view === 'login' && <LoginForm onForgotPassword={() => setView('forgot_password')} />}
                {view === 'signup' && <SignupForm onSuccess={() => setView('login')} />}
                {view === 'forgot_password' && <ForgotPassword onBack={() => setView('login')} />}

                {view !== 'forgot_password' && (
                    <p className="text-center mt-6 font-label-sm text-label-sm text-on-surface-variant animate-in fade-in duration-500">
                        {view === 'login' ? (t('auth.newHere') !== 'auth.newHere' ? t('auth.newHere') : 'New here? ') : (t('auth.alreadyHaveAccount2') !== 'auth.alreadyHaveAccount2' ? t('auth.alreadyHaveAccount2') : 'Already have an account? ')}
                        <button
                            onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                            className="text-secondary hover:underline font-semibold"
                        >
                            {view === 'login' ? (t('auth.createAccountLink') !== 'auth.createAccountLink' ? t('auth.createAccountLink') : 'Create Account') : (t('auth.signInLink') !== 'auth.signInLink' ? t('auth.signInLink') : 'Sign in')}
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
}
