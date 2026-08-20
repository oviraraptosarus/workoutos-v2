'use client';

import React, { useState } from 'react';
import { useFever } from '@/contexts/FeverContext';
import { Flame, Ticket, Zap } from 'lucide-react';
import clsx from 'clsx';
import GachaPullModal from './modals/GachaPullModal';

export default function FeverModeWidget() {
    const { feverScore, feverLevel, multiplier, gachaPulls } = useFever();
    const [showGacha, setShowGacha] = useState(false);
    
    // Max score is 1000. Each level is 200 points.
    const progressInLevel = feverScore % 200;
    const progressPercent = (progressInLevel / 200) * 100;

    return (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col mt-2 sm:mt-0">
            <GachaPullModal isOpen={showGacha} onClose={() => setShowGacha(false)} />
            
            <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                    <Flame size={20} className={clsx(feverLevel > 0 ? "text-[#ff453a] animate-pulse" : "text-white")} /> 
                    Fever Mode
                </h2>
                {gachaPulls > 0 && (
                    <button 
                        onClick={() => setShowGacha(true)}
                        className="font-label-sm text-[11px] text-[#ff9f0a] hover:text-[#ff9f0a]/80 uppercase tracking-wider flex items-center gap-1 transition-colors btn-press"
                    >
                        <Ticket size={14} /> {gachaPulls} Pulls Ready
                    </button>
                )}
            </div>
            
            <div 
                className="relative glass-card-premium border border-black/5 dark:border-white/10 p-5 flex-1 transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col justify-center min-h-[140px]"
                style={{
                    boxShadow: feverLevel > 0 ? 'var(--fever-glow)' : undefined,
                    borderColor: feverLevel > 0 ? 'var(--fever-border)' : undefined,
                }}
            >
                {/* Background effects */}
                {feverLevel > 0 && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ff453a]/10 to-[#ff9f0a]/5 opacity-50 z-0"></div>
                )}
                
                <div className="relative z-10 flex items-center gap-4">
                    <div className="relative flex-1">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                                Level {feverLevel}
                            </span>
                            <span className="text-xl font-black text-[#ff453a] flex items-center gap-1 drop-shadow-sm">
                                {multiplier.toFixed(1)}x <Zap size={18} className="fill-[#ff453a] text-[#ff453a]" />
                            </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="h-4 w-full bg-surface-container-highest dark:bg-black/40 rounded-full overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
                            <div 
                                className="h-full bg-gradient-to-r from-[#ff9f0a] to-[#ff453a] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,69,58,0.5)]"
                                style={{ width: `${feverLevel === 5 ? 100 : progressPercent}%` }}
                            />
                        </div>
                        
                        <div className="mt-3 flex justify-between items-center">
                            <div className="text-[10px] text-on-surface-variant font-medium">
                                {feverLevel === 5 ? 'MAX FEVER!' : `${200 - Math.floor(progressInLevel)} pts to Level ${feverLevel + 1}`}
                            </div>
                            {feverLevel > 0 && (
                                <div className="text-[10px] text-[#ff453a]/70 font-bold animate-pulse">
                                    HEAT RISING
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
