'use client';

import React, { useState, useEffect } from 'react';
import { XPService, XPAwardResult } from '@/lib/xpService';
import { Zap } from 'lucide-react';

export default function LevelUpOverlay() {
    const [levelData, setLevelData] = useState<XPAwardResult | null>(null);

    useEffect(() => {
        const handleLevelUp = (e: Event) => {
            const customEvent = e as CustomEvent<XPAwardResult>;
            setLevelData(customEvent.detail);
            
            // Auto hide after 4 seconds
            setTimeout(() => {
                setLevelData(null);
            }, 4000);
        };

        window.addEventListener('workout_os_leveled_up', handleLevelUp);
        return () => window.removeEventListener('workout_os_leveled_up', handleLevelUp);
    }, []);

    if (!levelData) return null;

    const rankName = XPService.getRankForLevel(levelData.newLevel);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            {/* Dark overlay backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
            
            {/* Level up card */}
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 flex flex-col items-center justify-center text-center shadow-2xl animate-in zoom-in-95 duration-500 max-w-sm w-[90%] pointer-events-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-[32px] blur opacity-40 animate-pulse" />
                
                <div className="relative w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                        {levelData.newLevel}
                    </span>
                    
                    <div className="absolute -bottom-3 px-3 py-1 bg-primary text-white text-[10px] font-bold tracking-widest uppercase rounded-full shadow-lg border border-white/20 whitespace-nowrap">
                        Level Up
                    </div>
                </div>

                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                    {rankName}
                </h2>
                
                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 rounded-full mt-2">
                    <Zap size={14} className="text-primary fill-current" />
                    <span className="text-sm font-bold text-white/80">+{levelData.xpAwarded} XP</span>
                </div>
            </div>
        </div>
    );
}
