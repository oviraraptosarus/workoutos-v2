'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Flame, Skull, Trophy, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import { useShadowTaunt } from '@/hooks/useShadowTaunt';
import ShadowTauntCard from './ShadowTauntCard';

export default function GhostRivalWidget() {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const { taunt, isLoading: isTauntLoading } = useShadowTaunt("General Dashboard", {
    recentActivity: "Logging into dashboard"
  });

  const { rivalName, rivalXp, userXp, rivalStreak, userStreak } = useMemo(() => {
    if (!userProfile) return { rivalName: 'Shadow', rivalXp: 0, userXp: 0, rivalStreak: 0, userStreak: 0 };
    
    const xp = userProfile.total_xp || 0;
    const streak = userProfile.streak || 0;
    
    // Procedural Rival Generation
    // The rival is always slightly ahead or neck-and-neck based on the user's ID string to keep it deterministic but pseudo-random
    const hash = userProfile.id ? userProfile.id.charCodeAt(0) + userProfile.id.charCodeAt(userProfile.id.length - 1) : 100;
    
    // Rival XP is userXP + (0 to 5% offset) + 150 base
    const rivalXpOffset = 150 + (hash % 50) + Math.floor(xp * 0.02);
    const calculatedRivalXp = xp + rivalXpOffset;

    // Rival Streak is userStreak + (0 to 2)
    const rivalStreakOffset = (hash % 3);
    const calculatedRivalStreak = Math.max(1, streak + rivalStreakOffset);

    return {
        rivalName: 'Shadow',
        userXp: xp,
        rivalXp: calculatedRivalXp,
        userStreak: streak,
        rivalStreak: calculatedRivalStreak
    };
  }, [userProfile]);

  const maxTotal = Math.max(userXp, rivalXp) || 1;
  const userPercent = (userXp / maxTotal) * 100;
  const rivalPercent = (rivalXp / maxTotal) * 100;

  if (isAuthLoading) {
    return (
      <div className="bg-surface-container-low border border-surface-variant/30 rounded-3xl p-5 w-full flex items-center justify-center min-h-[140px] animate-pulse">
          <div className="w-16 h-16 rounded-full bg-surface-variant/20" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Ghost Rival Progress Bar Card */}
      <div className="glass-card-premium w-full p-5 relative overflow-hidden group">
      
      {/* Background slash pattern for PvP feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)'
      }} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-surface-variant/50 flex items-center justify-center shrink-0">
                    <Swords size={14} className="text-[#ff453a]" />
                </div>
                <h3 className="font-display-sm font-bold text-on-surface tracking-tight uppercase text-sm">Ghost Rival</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3">
                <div className="flex items-center gap-1 text-[11px] font-bold text-on-surface-variant">
                    <Trophy size={12} className="text-[#0a84ff]" />
                    {userXp.toLocaleString()} XP
                </div>
                <span className="text-on-surface-variant/30 font-bold hidden sm:inline">vs</span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-on-surface-variant">
                    <Skull size={12} className="text-[#ff453a]" />
                    {rivalXp.toLocaleString()} XP
                </div>
            </div>
        </div>

        {/* Dual Progress Bars */}
        <div className="space-y-3">
            
            {/* User Track */}
            <div className="relative">
                <div className="flex justify-between items-end mb-1.5 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#0a84ff]">You</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#0a84ff]/70">
                        <Flame size={10} /> {userStreak} day streak
                    </div>
                </div>
                <div className="h-3 w-full bg-surface-variant/30 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${userPercent}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-[#0a84ff] to-[#5e5ce6] shadow-[0_0_10px_rgba(10,132,255,0.4)]"
                    />
                </div>
            </div>

            {/* Rival Track */}
            <div className="relative">
                <div className="flex justify-between items-end mb-1.5 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff453a]">{rivalName}</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#ff453a]/70">
                        <Flame size={10} /> {rivalStreak} day streak
                    </div>
                </div>
                <div className="h-3 w-full bg-surface-variant/30 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${rivalPercent}%` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-[#ff453a] to-[#ff9f0a] shadow-[0_0_10px_rgba(255,69,58,0.4)] opacity-80"
                    />
                </div>
            </div>

        </div>
      </div>
      
      {/* Dynamic AI Taunt */}
      <ShadowTauntCard taunt={taunt} domain="General Readiness" isLoading={isTauntLoading} />
    </div>
  );
}
