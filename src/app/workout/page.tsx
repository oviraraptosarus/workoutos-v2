'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import WorkoutHeader from './components/WorkoutHeader';
import ActiveSplitCard from './components/ActiveSplitCard';
import RecentWorkouts from './components/RecentWorkouts';
import PresetWorkouts from './components/PresetWorkouts';

export default function WorkoutPage() {
    const [activePreset, setActivePreset] = useState<any>(null);
    const [isBuilderMode, setIsBuilderMode] = useState(false);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [countdown, setCountdown] = useState(3);

    const handlePlayWorkout = (preset: any) => {
        setIsBuilderMode(false);
        setIsCountingDown(true);
        setCountdown(3);
        
        let counter = 3;
        const interval = setInterval(() => {
            counter -= 1;
            if (counter > 0) {
                setCountdown(counter);
            } else {
                clearInterval(interval);
                setIsCountingDown(false);
                setActivePreset(preset);
                
                // Scroll to top where active split is
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 1000);
    };
    return (
        <AppLayout>
            {isCountingDown && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f4e38]/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div key={countdown} className="text-9xl font-black text-white drop-shadow-2xl animate-in zoom-in duration-500">
                        {countdown}
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <WorkoutHeader onStartEmpty={() => { setActivePreset(null); setIsBuilderMode(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
                <div id="tour-workout-active-split" className="relative z-[110]">
                    <ActiveSplitCard preset={activePreset} isBuilderMode={isBuilderMode} onExitBuilder={() => setIsBuilderMode(false)} />
                </div>
                <PresetWorkouts onPlay={handlePlayWorkout} />
                <RecentWorkouts />
            </div>
        </AppLayout>
    );
}
