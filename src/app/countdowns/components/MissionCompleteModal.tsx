'use client';

import React, { useState } from 'react';
import { useFever } from '@/contexts/FeverContext';
import { supabase } from '@/lib/supabase/client';
import { Trophy, RotateCw, CheckCircle2, Flame, Ticket, X } from 'lucide-react';
import ForgeImpactOverlay from '@/app/components/ForgeImpactOverlay';
import clsx from 'clsx';

interface Countdown {
    id: string;
    title: string;
    target_date: string;
}

interface MissionCompleteModalProps {
    countdown: Countdown | null;
    isOpen: boolean;
    onClose: () => void;
    onMissionArchived: (id: string) => void;
}

export default function MissionCompleteModal({ countdown, isOpen, onClose, onMissionArchived }: MissionCompleteModalProps) {
    const { addFever, addGachaPull } = useFever();
    const [step, setStep] = useState<'rating' | 'celebrating'>('rating');
    const [rating, setRating] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen || !countdown) return null;

    const handleClaim = async (action: 'archive' | 'rollover') => {
        setIsProcessing(true);
        
        try {
            if (action === 'archive') {
                // Delete from DB
                await supabase.from('countdowns').delete().eq('id', countdown.id);
            } else if (action === 'rollover') {
                // Roll over 7 days
                const newDate = new Date(countdown.target_date);
                newDate.setDate(newDate.getDate() + 7);
                await supabase
                    .from('countdowns')
                    .update({ target_date: newDate.toISOString().split('T')[0] })
                    .eq('id', countdown.id);
            }

            // Reward
            addFever(100);
            addGachaPull(1);
            
            setStep('celebrating'); // Triggers the Forge Overlay via state
            
            // Wait for animation
            setTimeout(() => {
                onMissionArchived(countdown.id);
                onClose();
                setStep('rating');
                setRating(0);
                setIsProcessing(false);
            }, 2500);
            
        } catch (err) {
            console.error('Failed to process mission', err);
            alert('Error processing mission. Please try again.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={!isProcessing ? onClose : undefined} />
            
            {step === 'celebrating' && <ForgeImpactOverlay isVisible={true} onComplete={() => {}} />}
            
            {step === 'rating' && (
                <div className="relative w-full max-w-sm glass-card-premium border border-white/10 p-6 rounded-[2rem] shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
                    <button 
                        onClick={onClose}
                        disabled={isProcessing}
                        className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>

                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff9f0a] to-[#ff453a] text-white flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,159,10,0.5)]">
                        <Trophy size={32} />
                    </div>
                    
                    <h2 className="text-xl font-black text-on-surface mb-1 text-center">Mission Accomplished</h2>
                    <p className="text-sm text-on-surface-variant text-center mb-6 px-4">
                        Target date reached for <strong className="text-on-surface">{countdown.title}</strong>
                    </p>
                    
                    <div className="w-full bg-surface-container-low rounded-2xl p-4 mb-6 border border-white/5">
                        <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center mb-3">Rate Outcome</div>
                        <div className="flex justify-between px-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={clsx(
                                        "p-2 transition-transform hover:scale-110 active:scale-95 text-2xl",
                                        rating >= star ? "text-[#ff9f0a]" : "text-surface-variant opacity-50 grayscale"
                                    )}
                                >
                                    ⭐
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="w-full flex flex-col gap-3">
                        <button
                            onClick={() => handleClaim('archive')}
                            disabled={isProcessing || rating === 0}
                            className="w-full py-3.5 rounded-xl font-black text-sm bg-primary text-on-primary shadow-[0_0_15px_rgba(var(--c-primary)/0.3)] hover:scale-[0.98] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={18} />
                            CLAIM REWARD & ARCHIVE
                        </button>
                        
                        <button
                            onClick={() => handleClaim('rollover')}
                            disabled={isProcessing || rating === 0}
                            className="w-full py-3 rounded-xl font-bold text-xs bg-surface-container hover:bg-surface-container-high text-on-surface border border-white/5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <RotateCw size={14} />
                            ROLL OVER (REPEAT IN 7 DAYS)
                        </button>
                    </div>

                    <div className="mt-4 flex gap-4 opacity-70">
                        <span className="text-[10px] font-bold text-[#ff453a] uppercase flex items-center gap-1">
                            <Flame size={12} /> +100 Fever
                        </span>
                        <span className="text-[10px] font-bold text-[#ff9f0a] uppercase flex items-center gap-1">
                            <Ticket size={12} /> +1 Pull
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
