'use client';

import React from 'react';
import { Droplet, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import Link from 'next/link';

export default function WaterCard() {
    const { userProfile } = useAuth();
    const { selectedDate, isToday } = useDate();
    const [currentMl, setCurrentMl] = React.useState(0);

    React.useEffect(() => {
        if (!selectedDate) return;
        const loadWater = () => {
            let saved = localStorage.getItem(`workout_os_water_ml_${selectedDate}`);
            
            // Migration: check old key formats
            if (!saved) {
                saved = localStorage.getItem(`workout_os_water_${selectedDate}`);
                if (saved) {
                    // Migrate to new key
                    localStorage.setItem(`workout_os_water_ml_${selectedDate}`, saved);
                    localStorage.removeItem(`workout_os_water_${selectedDate}`);
                }
            }
            if (!saved && isToday) {
                const legacy = localStorage.getItem('workout_os_water_current');
                if (legacy) {
                    saved = legacy;
                    localStorage.setItem(`workout_os_water_ml_${selectedDate}`, legacy);
                    localStorage.removeItem('workout_os_water_current');
                }
            }

            if (saved) setCurrentMl(parseInt(saved, 10));
            else setCurrentMl(0);
        };
        
        loadWater();
        
        // Listen for storage events (if logged by Nova AI)
        window.addEventListener('storage', loadWater);
        return () => window.removeEventListener('storage', loadWater);
    }, [selectedDate]);

    const goalMl = userProfile?.waterGoalMl || 3000;
    const level = Math.min((currentMl / goalMl) * 100, 100);
    const leftMl = Math.max(goalMl - currentMl, 0);

    return (
        <Link 
            href="/water"
            className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full min-h-[220px] cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/80 hover:shadow-md transition-all btn-press group block"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-blue-50/50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-700/50">
                        <Droplet size={18} />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">WATER</span>
                </div>
                <div className="text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors p-1" aria-label="Expand water details">
                    <ChevronRight size={18} />
                </div>
            </div>

            {/* Simple Graphic */}
            <div className="my-4 flex flex-col items-center justify-center relative flex-1">
                <div className="w-20 h-20 rounded-full bg-blue-50/50 dark:bg-blue-900/30 flex items-center justify-center text-[#007aff] dark:text-blue-400 relative border border-transparent dark:border-blue-800/50">
                    <Droplet size={40} strokeWidth={1.5} />
                    <div className="absolute inset-0 bg-[#007aff] dark:bg-blue-500 rounded-full mix-blend-color opacity-20 dark:opacity-30" style={{ height: `${level}%`, top: 'auto', bottom: 0 }} />
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{currentMl}</span>
                    <span className="text-gray-500 dark:text-gray-400 font-bold text-sm">/ {goalMl} ml</span>
                </div>
            </div>

            <div className="flex justify-center mt-2">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                    isToday 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/50 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50' 
                    : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700'
                }`}>
                    {isToday ? 'Tap to log water' : 'Historical data'}
                </span>
            </div>
        </Link>
    );
}
