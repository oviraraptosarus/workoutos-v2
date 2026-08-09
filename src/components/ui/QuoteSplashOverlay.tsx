'use client';

import React, { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import QUOTES from '@/data/quotes.json';

export default function QuoteSplashOverlay() {
    const [isVisible, setIsVisible] = useState(false);
    const [quote, setQuote] = useState({ text: '', subtext: '' });
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        // Only show once per session when the app opens
        const hasShown = sessionStorage.getItem('workout_os_quote_shown');
        
        if (!hasShown) {
            // Pick quote of the day
            const now = new Date();
            const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
            setQuote(QUOTES[dayOfYear % QUOTES.length]);
            setIsVisible(true);

            // Hide after 3 seconds
            const timer = setTimeout(() => {
                setIsFadingOut(true);
                setTimeout(() => {
                    setIsVisible(false);
                    sessionStorage.setItem('workout_os_quote_shown', 'true');
                }, 800); // Wait for fade out animation
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, []);

    if (!isVisible) return null;

    return (
        <div 
            className={`fixed inset-0 z-[10001] flex items-center justify-center bg-background/95 backdrop-blur-2xl transition-opacity duration-700 ease-in-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
        >
            <div className="max-w-lg mx-auto p-8 flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-700 fade-in">
                <Quote size={40} className="text-primary/40 mb-6" />
                <h2 className="font-display-md text-2xl sm:text-3xl font-bold text-on-surface leading-tight tracking-tight">
                    "{quote.text}"
                </h2>
                <p className="font-body-md text-sm text-on-surface-variant font-medium uppercase tracking-widest mt-6">
                    — {quote.subtext}
                </p>
            </div>
        </div>
    );
}
