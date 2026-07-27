'use client';

import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

export default function SessionTimer() {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds((sec) => sec + 1);
            }, 1000);
        } else {
            if (interval) clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive]);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-800 rounded-3xl p-4 flex items-center justify-between shadow-sm transition-all">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500">
                    <Timer size={20} />
                </div>
                <div>
                    <span className="text-xs text-gray-500 font-medium block">Rest Timer</span>
                    <span className="text-lg font-mono font-bold text-gray-900 dark:text-white">{formatTime(seconds)}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsActive(!isActive)}
                    className="p-2.5 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm btn-press"
                >
                    {isActive ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>
                <button
                    onClick={() => { setIsActive(false); setSeconds(0); }}
                    className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors btn-press"
                >
                    <RotateCcw size={16} />
                </button>
            </div>
        </div>
    );
}
