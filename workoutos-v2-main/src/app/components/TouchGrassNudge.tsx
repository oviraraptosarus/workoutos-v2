'use client';

import React, { useState, useEffect } from 'react';
import { Trees, X } from 'lucide-react';

const NUDGE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

export default function TouchGrassNudge() {
    const [dismissed, setDismissed] = useState(false);
    const [showNudge, setShowNudge] = useState(false);

    useEffect(() => {
        // Check if already dismissed in this session
        const isDismissed = sessionStorage.getItem('touch_grass_dismissed');
        if (isDismissed) {
            setDismissed(true);
            return;
        }

        const sessionStart = sessionStorage.getItem('session_start_time');
        let startTime = parseInt(sessionStart || '0', 10);
        
        if (!startTime) {
            startTime = Date.now();
            sessionStorage.setItem('session_start_time', startTime.toString());
        }

        const checkTime = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= NUDGE_THRESHOLD_MS) {
                setShowNudge(true);
            }
        };

        // Check immediately and then every minute
        checkTime();
        const interval = setInterval(checkTime, 60000);
        
        return () => clearInterval(interval);
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem('touch_grass_dismissed', 'true');
    };

    if (dismissed || !showNudge) return null;

    return (
        <section className="flex flex-col animate-slide-up transition-all mb-4">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <Trees size={20} className="text-activity-green" />
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Suggestion</span>
                </div>
                <button
                    onClick={handleDismiss}
                    className="font-label-sm text-[11px] text-on-surface-variant hover:text-error uppercase tracking-wider transition-colors btn-press"
                    aria-label="Dismiss banner"
                >
                    Dismiss <X size={14} className="inline ml-1" />
                </button>
            </div>
            
            <div className="glass-card-premium p-4 sm:p-5 flex items-start justify-between gap-3.5 relative overflow-hidden hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] border border-activity-green/30 dark:border-activity-green/20">
                <div className="flex items-start gap-3.5 relative z-10">
                    <div className="w-11 h-11 rounded-full bg-activity-green/10 text-activity-green flex-shrink-0 flex items-center justify-center mt-0.5">
                        <Trees size={20} />
                    </div>
                    <div>
                        <h4 className="font-headline-sm text-sm text-on-surface drop-shadow-sm tracking-tight">Step outside for a bit?</h4>
                        <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mt-1">
                            You&apos;ve been logging for over 15 minutes. A short walk outside beats more screen time — the logs will be here when you&apos;re back.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );

}
