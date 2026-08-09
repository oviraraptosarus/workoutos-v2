'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';

const defaultSlides = [
    {
        id: 0,
        text: '"Tell me, what is it you plan to do with your one wild and precious life?"',
        subtext: "— Mary Oliver",
        bg: "bg-background",
        textColor: "text-on-background",
        subtextColor: "text-on-surface-variant"
    },
    {
        id: 1,
        text: "What if there was an AI that didn't just list tasks, but actually built your momentum?",
        subtext: "",
        bg: "bg-surface-container",
        textColor: "text-on-surface",
        subtextColor: ""
    },
    {
        id: 2,
        text: "That's Execution OS. It analyzes your patterns. It locks out distractions. It notices what matters.",
        subtext: "",
        bg: "bg-background",
        textColor: "text-primary",
        subtextColor: ""
    },
    {
        id: 3,
        text: "Backed by real AI.",
        subtext: "Stop planning. Start executing.",
        bg: "bg-gradient-to-br from-primary/20 via-background to-secondary/20",
        textColor: "text-on-background",
        subtextColor: "text-on-surface-variant font-bold text-2xl mt-4 text-primary"
    }
];

const quotes = [
    { text: '"Tell me, what is it you plan to do with your one wild and precious life?"', subtext: "— Mary Oliver" },
    { text: '"You could leave life right now. Let that determine what you do and say and think."', subtext: "— Marcus Aurelius" },
    { text: '"Amateurs sit and wait for inspiration, the rest of us just get up and go to work."', subtext: "— Stephen King" },
    { text: '"We suffer more often in imagination than in reality."', subtext: "— Seneca" },
    { text: '"Don\'t stop when you\'re tired. Stop when you\'re done."', subtext: "— David Goggins" }
];

export default function WelcomePage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slides, setSlides] = useState(defaultSlides);
    const router = useRouter();
    const { session, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && session) {
            router.push('/dashboard');
        }
    }, [session, isLoading, router]);

    // Randomize quote on mount
    useEffect(() => {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setSlides(prev => {
            const newSlides = [...prev];
            newSlides[0] = { ...newSlides[0], text: randomQuote.text, subtext: randomQuote.subtext };
            return newSlides;
        });
    }, []);

    // Auto-advance
    useEffect(() => {
        const timer = setInterval(() => {
            if (currentSlide < slides.length - 1) {
                setCurrentSlide(prev => prev + 1);
            }
        }, 5000); // 5 seconds per slide
        return () => clearInterval(timer);
    }, [currentSlide]);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(prev => prev + 1);
        } else {
            router.push('/sign-up-login-screen');
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    };

    const slide = slides[currentSlide];

    return (
        <div className={clsx("min-h-screen w-full flex flex-col transition-colors duration-1000", slide.bg)}>
            {/* Top Progress Bars */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-12 z-50 flex gap-2 max-w-md mx-auto">
                {slides.map((s, i) => (
                    <div key={s.id} className="h-1 flex-1 bg-surface-variant/50 rounded-full overflow-hidden">
                        <div 
                            className={clsx(
                                "h-full rounded-full transition-all ease-linear",
                                i < currentSlide ? "bg-primary w-full duration-0" : 
                                i === currentSlide ? "bg-primary w-full duration-[5000ms]" : "w-0 bg-primary duration-0"
                            )}
                            style={{
                                width: i <= currentSlide ? '100%' : '0%'
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Click Zones */}
            <div className="absolute inset-0 z-40 flex">
                <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
                <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-30 pointer-events-none">
                <div key={currentSlide} className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-lg">
                    <h1 className={clsx("text-4xl sm:text-5xl font-display font-bold leading-tight tracking-tight mb-6", slide.textColor)}>
                        {slide.text}
                    </h1>
                    {slide.subtext && (
                        <p className={clsx("text-xl font-body", slide.subtextColor)}>
                            {slide.subtext}
                        </p>
                    )}
                </div>
            </div>

            {/* Final CTA */}
            <div className={clsx(
                "absolute bottom-12 left-0 right-0 px-8 z-50 transition-all duration-1000 flex justify-center",
                currentSlide === slides.length - 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
            )}>
                <button 
                    onClick={() => router.push('/sign-up-login-screen')}
                    className="bg-primary text-on-primary py-4 px-12 rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-3 relative z-50"
                >
                    Get Started <Play className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
