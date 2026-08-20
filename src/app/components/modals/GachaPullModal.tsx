'use client';

import React, { useState } from 'react';
import { useFever } from '@/contexts/FeverContext';
import { Ticket, X, Gift, Sparkles, Star } from 'lucide-react';
import clsx from 'clsx';
import { useRewardSystem } from '@/lib/hooks/useRewardSystem';

const REWARDS = [
    { name: "Cyberpunk Theme", rarity: "Legendary", color: "text-[#ff00ff]", bg: "bg-[#ff00ff]/20" },
    { name: "Neon Glow Border", rarity: "Epic", color: "text-[#00ffff]", bg: "bg-[#00ffff]/20" },
    { name: "Rest Day Ticket", rarity: "Rare", color: "text-[#ff9f0a]", bg: "bg-[#ff9f0a]/20" },
    { name: "Gym Bro Sticker", rarity: "Common", color: "text-on-surface", bg: "bg-surface-container" },
    { name: "Swole Doge Emote", rarity: "Common", color: "text-on-surface", bg: "bg-surface-container" },
];

export default function GachaPullModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { gachaPulls, useGachaPull } = useFever();
    const { triggerSuccess, triggerPop } = useRewardSystem();
    
    const [isPulling, setIsPulling] = useState(false);
    const [reward, setReward] = useState<any>(null);

    if (!isOpen) return null;

    const handlePull = () => {
        if (!useGachaPull()) return;
        
        setIsPulling(true);
        setReward(null);
        
        // Simulate rolling
        setTimeout(() => {
            const rand = Math.random();
            let selected;
            if (rand > 0.95) selected = REWARDS[0]; // 5% Legendary
            else if (rand > 0.8) selected = REWARDS[1]; // 15% Epic
            else if (rand > 0.6) selected = REWARDS[2]; // 20% Rare
            else selected = REWARDS[Math.floor(Math.random() * 2) + 3]; // 60% Common
            
            setReward(selected);
            setIsPulling(false);
            triggerSuccess();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-sm glass-card-premium border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                    <X size={16} />
                </button>
                
                <h2 className="text-2xl font-black text-on-surface mb-2 flex items-center gap-2">
                    <Gift className="text-[#ff9f0a]" /> Supply Drop
                </h2>
                
                <p className="text-sm text-on-surface-variant text-center mb-8">
                    Spend your hard-earned pulls for rare digital drops.
                </p>
                
                <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                    {isPulling ? (
                        <div className="animate-spin text-[#ff9f0a]">
                            <Sparkles size={64} />
                        </div>
                    ) : reward ? (
                        <div className={clsx("w-full h-full rounded-2xl flex flex-col items-center justify-center border-2 animate-in zoom-in shadow-2xl", reward.bg, reward.color.replace('text', 'border'))}>
                            <Star size={48} className={clsx("mb-2", reward.color)} />
                            <span className={clsx("text-xs font-black uppercase tracking-widest", reward.color)}>{reward.rarity}</span>
                            <span className="text-lg font-bold text-on-surface text-center px-4 leading-tight mt-1">{reward.name}</span>
                        </div>
                    ) : (
                        <div className="w-full h-full rounded-2xl bg-surface-container-high border-4 border-dashed border-white/10 flex flex-col items-center justify-center text-on-surface-variant opacity-50">
                            <Ticket size={48} className="mb-2" />
                            <span className="font-bold">? ? ?</span>
                        </div>
                    )}
                </div>
                
                <button
                    onClick={handlePull}
                    disabled={gachaPulls <= 0 || isPulling}
                    className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-[#ff9f0a] to-[#ff453a] text-white shadow-[0_0_20px_rgba(255,159,10,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                    <Ticket size={20} />
                    {isPulling ? 'DECRYPTING...' : `PULL (x${gachaPulls})`}
                </button>
            </div>
        </div>
    );
}
