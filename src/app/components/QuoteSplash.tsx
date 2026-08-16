'use client';

import React, { useState, useEffect } from 'react';
import QUOTES from '@/data/quotes.json';

interface QuoteSplashProps {
    onDone: () => void;
}

const DISPLAY_DURATION = 2000;  // how long the quote stays fully visible
const FADE_DURATION    = 900;   // ms for the fade-out transition

export default function QuoteSplash({ onDone }: QuoteSplashProps) {
    const [quote]      = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    const [visible,    setVisible]    = useState(true);   // controls opacity
    const [mounted,    setMounted]    = useState(true);   // controls render

    useEffect(() => {
        // After DISPLAY_DURATION, start fading out
        const fadeTimer = setTimeout(() => setVisible(false), DISPLAY_DURATION);

        // After fade completes, unmount and notify parent
        const doneTimer = setTimeout(() => {
            setMounted(false);
            onDone();
        }, DISPLAY_DURATION + FADE_DURATION);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(doneTimer);
        };
    }, [onDone]);

    if (!mounted) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#0a0c10]"
            style={{
                opacity: visible ? 1 : 0,
                transition: `opacity ${FADE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                pointerEvents: visible ? 'all' : 'none',
            }}
        >
            {/* Apple Intelligence-style ambient blobs */}
            <div
                className="pointer-events-none absolute -top-20 -right-20 w-[30rem] h-[30rem] rounded-full blur-[120px]"
                style={{ background: 'radial-gradient(circle, rgba(10,132,255,0.30) 0%, rgba(191,90,242,0.15) 100%)', animation: 'pulse 5s ease-in-out infinite' }}
            />
            <div
                className="pointer-events-none absolute top-1/3 -left-32 w-[28rem] h-[28rem] rounded-full blur-[100px]"
                style={{ background: 'radial-gradient(circle, rgba(191,90,242,0.25) 0%, rgba(10,132,255,0.12) 100%)', animation: 'pulse 7s ease-in-out infinite', animationDelay: '1s' }}
            />
            <div
                className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 w-[150%] h-[30rem] blur-[130px]"
                style={{ background: 'linear-gradient(to top, rgba(10,132,255,0.18), rgba(191,90,242,0.10), transparent)' }}
            />

            {/* Quote content */}
            <div className="relative z-10 max-w-lg px-8 text-center space-y-6">
                {/* Decorative quotation mark */}
                <div
                    className="text-[96px] leading-none font-black select-none -mb-6"
                    style={{ color: 'rgba(10,132,255,0.35)', fontFamily: 'Georgia, serif' }}
                >
                    "
                </div>

                <p
                    className="text-white font-black tracking-tight leading-snug"
                    style={{
                        fontSize: 'clamp(1.35rem, 4vw, 2rem)',
                        textShadow: '0 2px 24px rgba(0,0,0,0.6)',
                    }}
                >
                    {quote.text}
                </p>

                <p
                    className="text-sm font-semibold tracking-[0.15em] uppercase"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                    — {quote.author}
                </p>
            </div>

            {/* Subtle loading pulse bar at the bottom */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-24 h-0.5 rounded-full overflow-hidden bg-white/10">
                <div
                    className="h-full rounded-full bg-white/60"
                    style={{
                        animation: `splashProgress ${DISPLAY_DURATION}ms linear forwards`,
                    }}
                />
            </div>

            <style jsx>{`
                @keyframes splashProgress {
                    from { width: 0%; }
                    to   { width: 100%; }
                }
            `}</style>
        </div>
    );
}
