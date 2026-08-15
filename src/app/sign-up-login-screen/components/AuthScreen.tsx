'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPassword from './ForgotPassword';

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
            setView('welcome');
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const completeOnboarding = () => {
        setView('signup'); 
    };

    if (view === 'splash') {
        return (
            <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#000000] text-white transition-opacity duration-500 overflow-hidden">
                {/* Immersive animated background elements (Apple Intelligence style) */}
                <div className="pointer-events-none absolute -top-20 -right-20 w-[30rem] h-[30rem] rounded-full bg-gradient-to-br from-[#0a84ff]/35 to-[#bf5af2]/25 blur-[100px] animate-pulse" style={{ animationDuration: '5s' }} aria-hidden="true" />
                <div className="pointer-events-none absolute top-1/4 -left-32 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-[#bf5af2]/30 to-[#0a84ff]/20 blur-[100px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 w-[150%] h-[30rem] bg-gradient-to-t from-[#0a84ff]/25 via-[#bf5af2]/15 to-transparent blur-[120px]" aria-hidden="true" />
                <div className="pointer-events-none absolute inset-0 bg-white opacity-[0.015] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} aria-hidden="true" />

                <div className="relative z-10 w-20 h-20 rounded-[1.8rem] bg-black flex items-center justify-center shadow-[0_0_40px_rgba(10,132,255,0.4)] mb-5 animate-pulse border border-white/20 ring-1 ring-white/10">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-cover rounded-[1.8rem]" />
                </div>
                <h1 className="relative z-10 font-display-md text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">Workout OS</h1>
                <p className="relative z-10 font-body-md text-white/60 mt-2 tracking-wide font-medium">{t('auth.splash.subtitle') !== 'auth.splash.subtitle' ? t('auth.splash.subtitle') : 'Train smart. Track everything.'}</p>
            </div>
        );
    }

    if (view === 'welcome') {
        return (
            <div className="relative min-h-screen flex flex-col px-6 overflow-hidden animate-in fade-in duration-700 bg-[#000000]">
                {/* Immersive animated background elements (Apple Intelligence style) */}
                <div className="pointer-events-none absolute -top-20 -right-20 w-[30rem] h-[30rem] rounded-full bg-gradient-to-br from-[#0a84ff]/35 to-[#bf5af2]/25 blur-[100px] animate-pulse" style={{ animationDuration: '5s' }} aria-hidden="true" />
                <div className="pointer-events-none absolute top-1/4 -left-32 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-[#bf5af2]/30 to-[#0a84ff]/20 blur-[100px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 w-[150%] h-[30rem] bg-gradient-to-t from-[#0a84ff]/25 via-[#bf5af2]/15 to-transparent blur-[120px]" aria-hidden="true" />
                <div className="pointer-events-none absolute inset-0 bg-white opacity-[0.015] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} aria-hidden="true" />

                <div className="relative flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full pt-12 pb-6 z-10">
                    {/* Floating Logo */}
                    <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-[1.5rem] overflow-hidden shadow-[0_0_40px_rgba(10,132,255,0.4)] mb-6 bg-black border border-white/20 ring-1 ring-white/10">
                        <img src="/logo.png" alt="Workout OS Logo" className="w-full h-full object-cover" />
                    </div>
                    
                    <h1 className="font-display-md text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight leading-tight mb-3">
                        {t('auth.welcome.title') !== 'auth.welcome.title' ? t('auth.welcome.title') : 'Your complete fitness OS.'}
                    </h1>
                    <p className="font-body-md text-white/60 max-w-[20rem] mx-auto text-[15px] leading-relaxed font-medium">
                        Track workouts, nutrition, finances, habits, AI coaching and progress all in one place.
                    </p>

                    {/* Premium Apple-Style Widgets */}
                    <div className="mt-10 grid grid-cols-2 gap-3 w-full animate-in slide-in-from-bottom-8 duration-700 fade-in delay-150 fill-mode-both">
                        
                        {/* Widget 1: Universal Tracker */}
                        <div className="col-span-2 relative p-[1px] rounded-[24px] overflow-hidden bg-gradient-to-b from-white/20 to-white/5 shadow-2xl">
                            <div className="absolute inset-0 bg-[#0a84ff]/10 blur-xl"></div>
                            <div className="relative h-full bg-[#000000]/80 backdrop-blur-2xl p-5 rounded-[23px] flex items-center justify-between group">
                                <div className="flex flex-col text-left">
                                    <h3 className="font-bold text-white text-[15px] tracking-tight">Universal Tracker</h3>
                                    <p className="text-[12px] text-white/50 mt-1 font-medium">Workouts, diet, sleep & budget</p>
                                </div>
                                <div className="flex items-end gap-1.5 h-7">
                                    <div className="w-1.5 h-full bg-[#0a84ff] rounded-full animate-[pulse_2s_ease-in-out_infinite] group-hover:scale-y-110 transition-transform"></div>
                                    <div className="w-1.5 h-[60%] bg-[#0a84ff]/80 rounded-full animate-[pulse_2s_ease-in-out_infinite_0.2s] group-hover:scale-y-125 transition-transform"></div>
                                    <div className="w-1.5 h-[80%] bg-[#0a84ff]/60 rounded-full animate-[pulse_2s_ease-in-out_infinite_0.4s] group-hover:scale-y-110 transition-transform"></div>
                                    <div className="w-1.5 h-[40%] bg-[#0a84ff]/40 rounded-full animate-[pulse_2s_ease-in-out_infinite_0.6s] group-hover:scale-y-150 transition-transform"></div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Widget 2: Ava AI */}
                        <div className="relative p-[1px] rounded-[24px] overflow-hidden bg-gradient-to-b from-white/20 to-white/5 shadow-2xl">
                            <div className="absolute inset-0 bg-[#bf5af2]/15 blur-xl"></div>
                            <div className="relative h-full bg-[#000000]/80 backdrop-blur-2xl p-5 rounded-[23px] flex flex-col justify-between items-start gap-5 group">
                                <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[#bf5af2] to-[#0a84ff] p-[1.5px]">
                                    <div className="w-full h-full bg-black rounded-full flex items-center justify-center relative">
                                        <div className="absolute w-2.5 h-2.5 rounded-full bg-[#bf5af2] animate-ping opacity-60"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#bf5af2] to-[#0a84ff] shadow-[0_0_10px_rgba(191,90,242,0.8)]"></div>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-white text-[14px] tracking-tight group-hover:text-[#bf5af2] transition-colors">Ava AI</h3>
                                    <p className="text-[11px] text-white/50 mt-0.5 font-medium leading-tight">Your 24/7 coach</p>
                                </div>
                            </div>
                        </div>

                        {/* Widget 3: 100% Private */}
                        <div className="relative p-[1px] rounded-[24px] overflow-hidden bg-gradient-to-b from-white/20 to-white/5 shadow-2xl">
                            <div className="absolute inset-0 bg-[#30d158]/10 blur-xl"></div>
                            <div className="relative h-full bg-[#000000]/80 backdrop-blur-2xl p-5 rounded-[23px] flex flex-col justify-between items-start gap-5 group">
                                <div className="w-8 h-8 rounded-xl bg-[#30d158]/10 flex items-center justify-center border border-[#30d158]/30 text-[#30d158] shadow-[0_0_15px_rgba(48,209,88,0.15)]">
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-white text-[14px] tracking-tight group-hover:text-[#30d158] transition-colors">100% Private</h3>
                                    <p className="text-[11px] text-white/50 mt-0.5 font-medium leading-tight">Your data is yours</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative max-w-md mx-auto w-full pb-[max(2rem,env(safe-area-inset-bottom))] pt-2 space-y-3 z-10 animate-in slide-in-from-bottom-8 duration-700 fade-in delay-300 fill-mode-both">
                    <button
                        onClick={() => setView('signup')}
                        className="w-full bg-white text-black font-bold text-[15px] h-14 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]"
                    >
                        {t('auth.getStarted') !== 'auth.getStarted' ? t('auth.getStarted') : 'Get Started'} <ArrowRight size={18} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => setView('login')}
                        className="w-full bg-white/10 text-white font-semibold text-[15px] h-14 rounded-2xl transition-all active:scale-[0.98] border border-white/10 hover:bg-white/15"
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
            {/* Immersive animated background elements (Apple Intelligence style) */}
            <div className="pointer-events-none absolute -top-20 -right-20 w-[30rem] h-[30rem] rounded-full bg-gradient-to-br from-[#0a84ff]/35 to-[#bf5af2]/25 blur-[100px] animate-pulse" style={{ animationDuration: '5s' }} aria-hidden="true" />
            <div className="pointer-events-none absolute top-1/4 -left-32 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-[#bf5af2]/30 to-[#0a84ff]/20 blur-[100px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 w-[150%] h-[30rem] bg-gradient-to-t from-[#0a84ff]/25 via-[#bf5af2]/15 to-transparent blur-[120px]" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-0 bg-white opacity-[0.015] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} aria-hidden="true" />

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
                    <div className="mb-5 animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-[1rem] bg-black overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.16)] mb-4">
                            <img src="/logo.png" alt="Workout OS Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="font-headline-md text-2xl font-bold text-on-surface tracking-tight">
                            {view === 'login' ? (t('auth.welcomeBack') !== 'auth.welcomeBack' ? t('auth.welcomeBack') : 'Welcome back') : (t('auth.createAccount') !== 'auth.createAccount' ? t('auth.createAccount') : 'Create your account')}
                        </h1>
                        <p className="font-body-sm text-on-surface-variant mt-1">
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
