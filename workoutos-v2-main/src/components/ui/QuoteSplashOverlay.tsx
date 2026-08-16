'use client';

import React, { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import QUOTES from '@/data/quotes.json';
import { useAuth } from '@/contexts/AuthContext';

export default function QuoteSplashOverlay() {
    const { user, isProfileLoaded } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [quote, setQuote] = useState({ text: '', subtext: '' });
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        if (!isProfileLoaded || !user) return;
        // Show only once per session
        if (sessionStorage.getItem('workout_os_splash_seen')) {
            return; // Already seen
        }
        sessionStorage.setItem('workout_os_splash_seen', 'true');

        const chosen = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        setQuote(chosen);
        // Persist so DashboardHeader shows the same quote
        try { sessionStorage.setItem('workout_os_daily_quote', JSON.stringify(chosen)); } catch {}
        setIsVisible(true);

        // Fade out after 3 seconds
        const timer = setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => setIsVisible(false), 800);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div 
            className={`fixed inset-0 z-[10001] flex items-center justify-center bg-background/95 backdrop-blur-2xl transition-opacity duration-700 ease-in-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
        >
            <div className="max-w-lg mx-auto p-8 flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-700 fade-in">
                <Quote size={40} className="text-primary/40 mb-6" />
                <h2 className="font-display-md text-2xl sm:text-3xl font-bold text-on-surface leading-tight tracking-tight">
                    "{quote.text.replace(/^"+|"+$/g, '').replace(/^'|'$/g, '')}"
                </h2>
                <p className="font-body-md text-sm text-on-surface-variant font-medium uppercase tracking-widest mt-6 flex items-center justify-center gap-2">
                    <span className="w-4 h-[1px] bg-on-surface-variant/50"></span>
                    {quote.subtext.replace(/^[—\-\s]+/, '')}
                </p>
            </div>
        </div>
    );
}
