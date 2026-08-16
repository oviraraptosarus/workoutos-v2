import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Mock data: Fatigue scores (0 = fully recovered, 100 = completely fatigued/red)
const muscleFatigueData: Record<string, number> = {
  Chest: 80, // Recently trained
  Back: 20,
  Shoulders: 50,
  Arms: 60,
  Core: 10,
  Legs: 90, // Heavily trained
};

const getFatigueColor = (score: number) => {
  if (score > 75) return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] border-red-400';
  if (score > 40) return 'bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.3)] border-orange-300';
  return 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] border-blue-400';
};

const MuscleNode = ({ name, score, className }: { name: string, score: number, className?: string }) => {
  const colorClass = getFatigueColor(score);
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`absolute flex flex-col items-center justify-center rounded-2xl border backdrop-blur-xl transition-all cursor-pointer ${colorClass} ${className}`}
    >
      <span className="text-[8px] sm:text-[10px] font-black tracking-wider uppercase text-white drop-shadow-md opacity-90 text-center px-1">{name}</span>
      <div className="w-[70%] sm:w-[80%] bg-black/20 h-1 sm:h-1.5 mt-1 rounded-full overflow-hidden">
        <div className="h-full bg-white rounded-full" style={{ width: `${score}%` }} />
      </div>
    </motion.div>
  );
};

export default function MuscleHeatmap() {
  // We represent the body as an abstract, premium geometric layout
  return (
    <div className="w-full glass-card-premium p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-on-surface">Recovery Heatmap</h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">Abstract node map of your muscle fatigue.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Fresh</div>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-red-500"></span> Fatigued</div>
        </div>
      </div>
      
      <div className="relative w-full h-[320px] flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-3xl border border-white/10 overflow-hidden inner-shadow">
        {/* Connection Lines (Abstract Nervous System) */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            {/* Spine */}
            <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            {/* Clavicle */}
            <line x1="25%" y1="20%" x2="75%" y2="20%" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            {/* Hips */}
            <line x1="30%" y1="65%" x2="70%" y2="65%" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
        </svg>

        {/* Shoulders */}
        <MuscleNode name="Shoulders" score={muscleFatigueData.Shoulders} className="top-[12%] left-[10%] sm:left-[20%] w-[32%] sm:w-[20%] h-12" />
        <MuscleNode name="Shoulders" score={muscleFatigueData.Shoulders} className="top-[12%] right-[10%] sm:right-[20%] w-[32%] sm:w-[20%] h-12" />
        
        {/* Chest & Back */}
        <MuscleNode name="Chest" score={muscleFatigueData.Chest} className="top-[28%] left-[32%] sm:left-[38%] w-[36%] sm:w-[24%] h-16 rounded-full z-10" />
        <MuscleNode name="Back" score={muscleFatigueData.Back} className="top-[28%] right-[32%] sm:right-[38%] w-[36%] sm:w-[24%] h-16 rounded-full opacity-80" />
        
        {/* Arms */}
        <MuscleNode name="Arms" score={muscleFatigueData.Arms} className="top-[35%] left-[2%] sm:left-[12%] w-[24%] sm:w-[16%] h-24" />
        <MuscleNode name="Arms" score={muscleFatigueData.Arms} className="top-[35%] right-[2%] sm:right-[12%] w-[24%] sm:w-[16%] h-24" />

        {/* Core */}
        <MuscleNode name="Core" score={muscleFatigueData.Core} className="top-[52%] left-1/2 -translate-x-1/2 w-[35%] sm:w-[28%] h-20 rounded-[2rem]" />

        {/* Legs */}
        <MuscleNode name="Legs" score={muscleFatigueData.Legs} className="bottom-[8%] left-[15%] sm:left-[25%] w-[25%] sm:w-[18%] h-28" />
        <MuscleNode name="Legs" score={muscleFatigueData.Legs} className="bottom-[8%] right-[15%] sm:right-[25%] w-[25%] sm:w-[18%] h-28" />
      </div>
    </div>
  );
}
