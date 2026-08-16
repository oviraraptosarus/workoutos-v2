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
    },
    {
        id: 1,
        text: "Your complete fitness OS.",
        subtext: "Track workouts, nutrition, finances, habits, AI coaching and progress all in one place.",
        bg: "bg-background",
    },
    {
        id: 2,
        text: "Ava AI isn't just a chatbot.",
        subtext: "She analyzes your patterns, locks out distractions, and dynamically adjusts your plan.",
        bg: "bg-background",
    },
    {
        id: 3,
        text: "100% Private. Your data is yours.",
        subtext: "Local-first architecture ensures nobody sees your goals but you.",
        bg: "bg-background",
    },
    {
        id: 4,
        text: "Backed by real AI.",
        subtext: "Stop planning. Start executing.",
        bg: "bg-background",
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
    }, [currentSlide, slides.length]);

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

    // While auth is resolving, render nothing — prevents the welcome slideshow
    // from flashing briefly for users who are already logged in.
    if (isLoading) return null;

    return (
        <div className="dark">
            <div className={clsx("min-h-screen w-full flex flex-col transition-colors duration-1000 overflow-hidden relative bg-background text-on-background")}>
                {/* Immersive animated background elements (Apple Intelligence style) */}
                <div className="pointer-events-none absolute -top-20 -right-20 w-[30rem] h-[30rem] rounded-full bg-gradient-to-br from-[#0a84ff]/35 to-[#bf5af2]/25 blur-[100px] animate-pulse" style={{ animationDuration: '5s' }} aria-hidden="true" />
                <div className="pointer-events-none absolute top-1/4 -left-32 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-[#bf5af2]/30 to-[#0a84ff]/20 blur-[100px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 w-[150%] h-[30rem] bg-gradient-to-t from-[#0a84ff]/25 via-[#bf5af2]/15 to-transparent blur-[120px]" aria-hidden="true" />
                <div className="pointer-events-none absolute inset-0 bg-white opacity-[0.015] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} aria-hidden="true" />

                {/* Top Progress Bars */}
                <div className="absolute top-0 left-0 right-0 p-4 pt-12 z-50 flex gap-2 max-w-md mx-auto">
                    {slides.map((s, i) => (
                        <div key={s.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
                            <div 
                                className={clsx(
                                    "h-full rounded-full transition-all ease-linear",
                                    i < currentSlide ? "bg-white w-full duration-0" : 
                                    i === currentSlide ? "bg-white w-full duration-[5000ms]" : "w-0 bg-white duration-0"
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
                        <h2 className={`font-display-md font-black tracking-tight leading-tight text-3xl sm:text-4xl md:text-5xl px-4 text-transparent bg-clip-text bg-gradient-to-b from-on-background to-on-surface-variant drop-shadow-sm`}>
                            {slide.id === 0 ? `"${slide.text.replace(/^"+|"+$/g, '').replace(/^'|'$/g, '')}"` : slide.text}
                        </h2>
                        {slide.subtext && (
                            <p className={`mt-6 font-medium text-on-surface-variant tracking-wide text-lg`}>
                                {slide.id === 0 && <span className="opacity-50">— </span>}
                                {slide.subtext.replace(/^[—\-\s]+/, '')}
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
                        className="w-full max-w-sm bg-white text-black font-bold text-[16px] h-14 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] relative z-50"
                    >
                        Get Started <Play className="w-5 h-5 fill-black" strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
}
