'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Flame, Star, TrendingUp } from 'lucide-react';

export default function StreakOrbWidget() {
    const { userProfile } = useAuth();
    
    // Fallbacks if not set in DB
    const xp = userProfile?.xp || 1240; 
    const level = userProfile?.level || 4;
    const streakDays = 7; // Mock for now if streak isn't in DB

    // Calculate progress to next level
    const xpForCurrentLevel = level * 1000;
    const xpForNextLevel = (level + 1) * 1000;
    const progressXP = xp - xpForCurrentLevel;
    const totalRequiredXP = xpForNextLevel - xpForCurrentLevel;
    const fillPercentage = Math.min(100, Math.max(0, (progressXP / totalRequiredXP) * 100));

    const [isHovered, setIsHovered] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <section className="flex flex-col mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-orange-500" />
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Progress</span>
                </div>
            </div>

            <motion.div 
                className="glass-card-premium relative overflow-hidden flex flex-col md:flex-row items-center gap-6 p-6 cursor-pointer"
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                {/* Abstract Glass Ripple Background on Hover */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 via-pink-500/5 to-transparent pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                {/* Physics Orb */}
                <div className="relative w-32 h-32 shrink-0">
                    {/* Outer glow track */}
                    <div className="absolute inset-0 rounded-full border-4 border-black/5 dark:border-white/5 shadow-inner" />
                    
                    {/* The liquid fill mask */}
                    <div className="absolute inset-1 rounded-full overflow-hidden flex items-end justify-center bg-surface-container">
                        <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${fillPercentage}%` }}
                            transition={{ type: 'spring', damping: 15, stiffness: 40, delay: 0.2 }}
                            className="w-full bg-gradient-to-t from-orange-600 to-orange-400 relative"
                        >
                            {/* Waves at the top of the liquid */}
                            <motion.div 
                                animate={{ x: ['-25%', '0%'] }}
                                transition={{ ease: 'linear', duration: 3, repeat: Infinity }}
                                className="absolute top-0 w-[200%] h-4 bg-gradient-to-t from-orange-400 to-transparent opacity-50 -translate-y-2 rounded-[100%]"
                            />
                        </motion.div>
                    </div>

                    {/* Level Number Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center drop-shadow-md pointer-events-none">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Level</span>
                        <span className="text-4xl font-black text-white leading-none">{level}</span>
                    </div>

                    {/* Floating Particles (if hovered) */}
                    {isHovered && (
                        <>
                            <motion.div 
                                initial={{ y: 0, opacity: 1 }} animate={{ y: -40, opacity: 0 }} transition={{ duration: 1 }}
                                className="absolute top-4 left-4 w-2 h-2 bg-orange-300 rounded-full blur-[1px]"
                            />
                            <motion.div 
                                initial={{ y: 0, opacity: 1 }} animate={{ y: -60, opacity: 0 }} transition={{ duration: 1.5, delay: 0.2 }}
                                className="absolute top-10 right-4 w-3 h-3 bg-pink-400 rounded-full blur-[2px]"
                            />
                        </>
                    )}
                </div>

                {/* Stats */}
                <div className="flex-1 flex flex-col gap-2 relative z-10 w-full text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-orange-500 mb-1">
                        <Flame size={20} className={isHovered ? 'animate-pulse' : ''} />
                        <span className="text-xl font-black tracking-tight">{streakDays} Day Streak!</span>
                    </div>
                    
                    <h3 className="text-2xl font-black text-on-surface drop-shadow-sm leading-tight">
                        You're on fire.
                    </h3>
                    
                    <p className="text-sm text-on-surface-variant font-medium mt-1">
                        Only <span className="text-on-surface font-black">{totalRequiredXP - progressXP} XP</span> until Level {level + 1}. Log a workout to level up!
                    </p>

                    <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full mt-3 overflow-hidden shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${fillPercentage}%` }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="h-full bg-orange-500 rounded-full"
                        />
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
