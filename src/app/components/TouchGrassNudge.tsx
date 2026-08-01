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
        <div className="bg-white dark:bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-black/5 dark:border-white/5 flex items-start justify-between gap-3.5 animate-slide-up transition-all relative overflow-hidden hover:shadow-lg">
            <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-activity-green text-on-primary flex-shrink-0 flex items-center justify-center shadow-[0_4px_10px_rgba(34,197,94,0.3)] mt-0.5">
                    <Trees size={20} />
                </div>
                <div>
                    <h4 className="font-headline-sm text-sm text-on-surface drop-shadow-sm tracking-tight">Step outside for a bit?</h4>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mt-1">
                        You&apos;ve been logging for over 15 minutes. A short walk outside beats more screen time — the logs will be here when you&apos;re back.
                    </p>
                </div>
            </div>
            <button
                onClick={handleDismiss}
                className="text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high rounded-full border border-surface-variant transition-colors p-1.5 flex-shrink-0 btn-press"
                aria-label="Dismiss banner"
            >
                <X size={16} />
            </button>
        </div>
    );
}
