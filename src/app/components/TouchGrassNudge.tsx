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
        <div className="bg-white border border-gray-100 border-gray-200 rounded-3xl p-4 sm:p-5 shadow-md flex items-start justify-between gap-3.5 animate-slide-up transition-all mx-4 backdrop-blur-xl">
            <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#34c759] to-[#32ade6] text-white flex-shrink-0 flex items-center justify-center shadow-[0_4px_10px_rgba(52,199,89,0.3)] mt-0.5 border border-gray-100 dark:border-slate-800">
                    <Trees size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-gray-900 drop-shadow-sm tracking-tight">Step outside for a bit?</h4>
                    <p className="text-xs text-gray-700 font-medium leading-relaxed mt-1">
                        You&apos;ve been logging for over 15 minutes. A short walk outside beats more screen time — the logs will be here when you&apos;re back.
                    </p>
                </div>
            </div>
            <button
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-900 bg-white dark:bg-slate-900/30 hover:bg-gray-100 rounded-full border border-gray-100 shadow-sm transition-colors p-1.5 flex-shrink-0 btn-press"
                aria-label="Dismiss banner"
            >
                <X size={16} />
            </button>
        </div>
    );
}
