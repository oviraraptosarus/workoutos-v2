'use client';

import React, { useEffect, useState } from 'react';

export default function DopamineVisualizer() {
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        const handleReward = () => {
            setIsActive(true);
            // The animation takes about 1s
            setTimeout(() => {
                setIsActive(false);
            }, 1000);
        };

        window.addEventListener('workout_os_reward_success', handleReward);
        return () => window.removeEventListener('workout_os_reward_success', handleReward);
    }, []);

    if (!isActive) return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
            {/* Screen Edge Glow (Adapts to Dark/Light via CSS variables or standard Tailwind classes) */}
            <div className="absolute inset-0 border-[8px] border-transparent shadow-[inset_0_0_150px_rgba(34,197,94,0.3)] dark:shadow-[inset_0_0_200px_rgba(56,189,248,0.4)] animate-in fade-in zoom-in duration-500 fade-out-100 ease-out fill-mode-forwards" style={{ animationDuration: '1s' }} />
            
            {/* Center Flash */}
            <div className="absolute inset-0 bg-white/5 dark:bg-white/10 animate-in fade-in duration-150 fade-out-100 ease-out fill-mode-forwards" style={{ animationDuration: '800ms' }} />
            
            {/* Sparks (Simple CSS particle effect simulating a burst) */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full max-w-sm max-h-sm flex items-center justify-center">
                    {[...Array(6)].map((_, i) => (
                        <div 
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),1)]"
                            style={{
                                transform: `rotate(${i * 60}deg) translateY(-100px)`,
                                opacity: 0,
                                animation: `sparkBurst 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards`
                            }}
                        />
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes sparkBurst {
                    0% { transform: rotate(var(--rot)) translateY(0) scale(1); opacity: 1; }
                    100% { transform: rotate(var(--rot)) translateY(-150px) scale(0); opacity: 0; }
                }
            `}} />
        </div>
    );
}
