'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useShadowWarRoom } from '@/hooks/useShadowTaunt';
import { Swords, User, ChevronDown, ChevronUp } from 'lucide-react';

function StatRow({ label, val1, val2 }: { label: string, val1: string | number, val2: string | number }) {
  return (
    <div className="flex justify-between items-center text-[12px]">
      <span className="font-semibold text-[#ff453a] w-1/3 truncate">{val1}</span>
      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black text-center w-1/3 opacity-40">{label}</span>
      <span className="font-semibold text-on-surface text-right w-1/3 truncate">{val2}</span>
    </div>
  );
}

export default function GhostRivalWidget() {
  const { userProfile, isLoading: isAuthLoading, user } = useAuth();
  const { data, isLoading } = useShadowWarRoom('general');

  if (isAuthLoading || isLoading) {
    return (
      <div className="glass-card-premium w-full animate-pulse">
        <div className="p-5 space-y-4">
          <div className="h-6 w-32 bg-zinc-200 dark:bg-white/5 rounded-md" />
          <div className="h-20 w-full bg-zinc-200 dark:bg-white/5 rounded-xl" />
          <div className="h-32 w-full bg-zinc-200 dark:bg-white/5 rounded-2xl mt-4" />
        </div>
      </div>
    );
  }

  const verdict = data?.verdict;
  const shadow = data?.shadowSession;
  const userSession = data?.userSession;
  const stats = data?.domainStats;
  const week = data?.weekStats;

  // Prioritize the user's actual first name to make it personal
  const userName = userProfile?.fullName?.split(' ')[0]
    || user?.user_metadata?.name?.split(' ')[0]
    || user?.user_metadata?.full_name?.split(' ')[0]
    || 'You';

  const userXp = (userProfile as any)?.total_xp || 0;
  const hash = user?.id ? user.id.charCodeAt(0) + user.id.charCodeAt(user.id.length - 1) : 100;
  const xpGap = 150 + (hash % 50) + Math.floor(userXp * 0.02);

  const taskTotal = (stats?.tasksDone || 0) + (stats?.tasksPending || 0);
  const taskRate = taskTotal > 0 ? Math.round(((stats?.tasksDone || 0) / taskTotal) * 100) : 0;
  const waterL = Math.round(((stats?.waterMl || 0) / 1000) * 10) / 10;

  return (
    <div className="w-full mb-8">
      {/* Premium Floating Header outside the card */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-[12px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
          <Swords size={14} className="text-[#ff453a]" />
          Shadow War Room
        </h3>
        <span className="text-[10px] font-black tracking-widest bg-[#ff453a]/10 text-[#ff453a] px-2.5 py-1 rounded-full uppercase">
          +{xpGap} XP GAP
        </span>
      </div>

      <div className="glass-card-premium w-full relative overflow-hidden">
        {/* Menace background pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.012] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 12px, #ff453a 12px, #ff453a 13px)'
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff453a] blur-[100px] opacity-[0.08] dark:opacity-[0.05] pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3" />

        <div className="relative z-10 p-5">
          
          {/* Verdict Section (Text) */}
          <div className="mb-5">
            <p className="text-[15px] text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed tracking-tight">
              {verdict || "Shadow is outworking you. Stop resting and get back to execution."}
            </p>
          </div>

          {/* VS Data Panel (Sleek grouped list) */}
          <div className="bg-white/60 dark:bg-black/30 rounded-2xl p-4 border border-black/5 dark:border-white/5 backdrop-blur-md inner-shadow shadow-sm">
             
             {/* Fighter Headers */}
             <div className="flex justify-between items-center mb-4 pb-3 border-b border-black/5 dark:border-white/5">
               <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#ff453a]/20 border border-[#ff453a]/30 flex items-center justify-center shadow-inner">
                    <Swords size={12} className="text-[#ff453a]" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#ff453a]">Shadow</span>
               </div>
               
               <div className="px-3 py-0.5 bg-zinc-200/50 dark:bg-white/10 rounded-full border border-black/5 dark:border-white/5">
                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">VS</span>
               </div>
               
               <div className="flex items-center gap-2 text-right flex-row-reverse">
                  <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-white/10 border border-zinc-300 dark:border-white/10 flex items-center justify-center shadow-inner">
                    <User size={12} className="text-on-surface-variant" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-on-surface">{userName}</span>
               </div>
             </div>

             {/* Stats Grid */}
             <div className="space-y-3.5">
               <StatRow 
                 label="Workouts" 
                 val1={`${week?.shadowCount || 0} Sessions`} 
                 val2={`${week?.userCount || 0} Sessions`} 
               />
               <StatRow 
                 label="Activity" 
                 val1={shadow ? `${shadow.duration}m ${shadow.label}` : 'Resting'} 
                 val2={userSession ? `${userSession.duration}m ${userSession.label}` : 'Resting'} 
               />
               <StatRow 
                 label="Sleep" 
                 val1="8.0h" 
                 val2={`${stats?.sleepHours || 0}h`} 
               />
               <StatRow 
                 label="Tasks" 
                 val1="100% Exec." 
                 val2={`${taskRate}% Exec.`} 
               />
               <StatRow 
                 label="Hydration" 
                 val1="3.0L" 
                 val2={`${waterL}L`} 
               />
               <StatRow 
                 label="Savings" 
                 val1={`${stats?.shadowSavingsRate || 0}%`} 
                 val2={`${stats?.savingsRate || 0}%`} 
               />
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}
