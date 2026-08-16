'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDailySnapshot } from '@/hooks/useDailySnapshot';
import { Activity, Battery, BatteryCharging, BatteryWarning, Moon, TrendingUp, Zap } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function ReadinessScoreWidget() {
  const { user } = useAuth();
  const { snapshot, isLoading } = useDailySnapshot(new Date(), user?.id);

  const readinessScore = useMemo(() => {
    if (!snapshot) return 0;
    
    // Base score is 50
    let score = 50;

    // 1. Sleep impact (Target vs Actual)
    const sleepTarget = snapshot.sleepProgress.target || 8;
    const sleepActual = snapshot.sleepProgress.current;
    if (sleepActual >= sleepTarget) score += 25;
    else if (sleepActual >= sleepTarget - 2) score += 10;
    else if (sleepActual > 0) score -= 15;

    // 2. Hydration impact
    const waterTarget = snapshot.waterProgress.target || 3000;
    const waterActual = snapshot.waterProgress.current;
    if (waterActual >= waterTarget) score += 15;
    else if (waterActual >= waterTarget * 0.5) score += 5;
    else score -= 5;

    // 3. Nutrition impact (Protein specifically for recovery)
    const proteinTarget = snapshot.proteinProgress.target || 150;
    const proteinActual = snapshot.proteinProgress.current;
    if (proteinActual >= proteinTarget * 0.8) score += 10;
    else score -= 5;

    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [snapshot]);

  const { color, label, icon: StatusIcon, description } = useMemo(() => {
    if (readinessScore >= 85) return { color: '#30d158', label: 'Peak', icon: Battery, description: 'Prime condition. Push hard today.' };
    if (readinessScore >= 60) return { color: '#0a84ff', label: 'Good', icon: BatteryCharging, description: 'Solid recovery. Ready to train.' };
    if (readinessScore >= 40) return { color: '#ff9f0a', label: 'Moderate', icon: BatteryWarning, description: 'Slightly fatigued. Keep it light.' };
    return { color: '#ff453a', label: 'Depleted', icon: Activity, description: 'Critical fatigue. Prioritize rest.' };
  }, [readinessScore]);

  // SVG parameters
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (readinessScore / 100) * circumference;

  if (isLoading) {
    return (
      <div className="bg-surface-container-low border border-surface-variant/30 rounded-3xl p-5 w-full flex items-center justify-center min-h-[140px] animate-pulse">
          <div className="w-16 h-16 rounded-full bg-surface-variant/20" />
      </div>
    );
  }

  return (
    <div className="glass-card-premium w-full relative overflow-hidden group">
      {/* Background ambient glow based on score */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 transition-colors duration-700 pointer-events-none"
        style={{ backgroundColor: color }}
      />
      
      <div className="flex items-center justify-between p-5">
        <div className="flex flex-col z-10">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-surface-variant/50 flex items-center justify-center shrink-0">
                    <Zap size={14} className="text-on-surface-variant" />
                </div>
                <h3 className="font-display-sm font-bold text-on-surface tracking-tight">Readiness</h3>
            </div>
            
            <div className="mt-2 mb-1">
                <div className="text-2xl font-bold text-on-surface flex items-baseline gap-2">
                    {readinessScore}
                    <span className="text-sm font-semibold" style={{ color }}>{label}</span>
                </div>
            </div>
            
            <p className="text-[12px] font-medium text-on-surface-variant/70 leading-snug max-w-[140px]">
                {description}
            </p>
        </div>

        {/* Circular Gauge */}
        <div className="relative w-[90px] h-[90px] flex items-center justify-center shrink-0 z-10">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="45"
              cy="45"
              r={radius}
              className="stroke-surface-variant/20"
              strokeWidth="8"
              fill="transparent"
            />
            <motion.circle
              cx="45"
              cy="45"
              r={radius}
              stroke={color}
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut", type: "spring", bounce: 0.2 }}
              style={{ strokeDasharray: circumference }}
              className="drop-shadow-lg"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
             <StatusIcon size={24} style={{ color }} className="drop-shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
