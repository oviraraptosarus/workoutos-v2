'use client';

import React from 'react';
import { useShadowWarRoom } from '@/hooks/useShadowTaunt';
import { Swords } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WorkoutShadowTaunt() {
  const { data, isLoading } = useShadowWarRoom('workout');

  if (isLoading) {
    return <div className="w-full h-14 rounded-2xl bg-zinc-100 dark:bg-[#050505] border border-zinc-200 dark:border-[#ff453a]/10 animate-pulse mb-4" />;
  }

  if (!data?.verdict && !data?.weekStats) return null;

  const { verdict, weekStats } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full rounded-2xl bg-zinc-100/80 dark:bg-[#050505] border border-[#ff453a]/20 dark:border-[#ff453a]/15 px-4 py-3 mb-4 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff453a] blur-[60px] opacity-[0.08] dark:opacity-[0.05] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <div className="flex items-center gap-3 relative z-10">
        <div className="w-6 h-6 rounded-md bg-[#ff453a]/10 border border-[#ff453a]/15 flex items-center justify-center shrink-0">
          <Swords size={11} className="text-[#ff453a]" />
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
          {weekStats && (
            <>
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#ff453a]/80 dark:text-[#ff453a]/60">Shadow</p>
                <p className="text-[13px] font-bold text-[#ff453a]">{weekStats.shadowCount}x</p>
              </div>
              <span className="text-zinc-400 dark:text-white/15 font-bold text-sm">vs</span>
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/30">You</p>
                <p className="text-[13px] font-bold text-zinc-700 dark:text-white/60">{weekStats.userCount}x</p>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-white/20 hidden sm:block">this week</p>
            </>
          )}
          {verdict && (
            <p className="text-[10px] text-zinc-600 dark:text-white/40 italic flex-1 min-w-0 truncate">"{verdict}"</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
