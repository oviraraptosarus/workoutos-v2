'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { RefreshCw, Activity, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';

type MuscleGroup = 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Core' | 'Legs';

interface MuscleStatus {
  score: number; // 0 = 100% fresh, 100 = 100% fatigued/sore
  lastTrained: string | null;
  workoutName: string | null;
  manualSoreness?: 'mild' | 'severe' | 'injury' | null;
  note?: string;
}

const defaultMuscles: Record<MuscleGroup, MuscleStatus> = {
  Chest: { score: 15, lastTrained: null, workoutName: null },
  Back: { score: 15, lastTrained: null, workoutName: null },
  Shoulders: { score: 15, lastTrained: null, workoutName: null },
  Arms: { score: 15, lastTrained: null, workoutName: null },
  Core: { score: 15, lastTrained: null, workoutName: null },
  Legs: { score: 15, lastTrained: null, workoutName: null },
};

export default function MuscleHeatmap() {
  const { user } = useAuth();
  const [muscles, setMuscles] = useState<Record<MuscleGroup, MuscleStatus>>(defaultMuscles);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'front' | 'back'>('front');

  const fetchHeatmapData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch workout logs for past 14 days
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const dateStr = fourteenDaysAgo.toISOString().split('T')[0];

      const { data: logs } = await supabase
        .from('workout_logs')
        .select('date, session_type, custom_name, exercises')
        .eq('user_id', user.id)
        .gte('date', dateStr)
        .order('date', { ascending: false });

      // 2. Fetch today's daily log metadata for manual soreness check-ins
      const todayIso = new Date().toISOString().split('T')[0];
      const { data: todayLog } = await supabase
        .from('daily_logs')
        .select('metadata')
        .eq('user_id', user.id)
        .eq('date', todayIso)
        .maybeSingle();

      const manualSorenessMap: Record<string, 'mild' | 'severe' | 'injury'> = 
        todayLog?.metadata?.manual_soreness || {};

      const updated: Record<MuscleGroup, MuscleStatus> = { ...defaultMuscles };

      if (logs && logs.length > 0) {
        const today = new Date();

        logs.forEach(log => {
          const logDate = new Date(log.date);
          const diffDays = Math.floor(Math.abs(today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

          let calculatedScore = 15;
          if (diffDays === 0) calculatedScore = 90;
          else if (diffDays === 1) calculatedScore = 70;
          else if (diffDays === 2) calculatedScore = 45;
          else if (diffDays === 3) calculatedScore = 25;

          const textToSearch = (
            (log.session_type || '') + ' ' +
            (log.custom_name || '') + ' ' +
            JSON.stringify(log.exercises || [])
          ).toLowerCase();

          const targetMuscles: MuscleGroup[] = [];
          if (/chest|bench|pushup|dip|fly|press/i.test(textToSearch)) targetMuscles.push('Chest');
          if (/back|row|pullup|pulldown|lat|deadlift/i.test(textToSearch)) targetMuscles.push('Back');
          if (/shoulder|overhead|ohp|lateral|delt/i.test(textToSearch)) targetMuscles.push('Shoulders');
          if (/arm|bicep|tricep|curl|extension/i.test(textToSearch)) targetMuscles.push('Arms');
          if (/core|abs|plank|crunch/i.test(textToSearch)) targetMuscles.push('Core');
          if (/leg|squat|lunge|calf|hamstring|quad/i.test(textToSearch)) targetMuscles.push('Legs');

          if (targetMuscles.length === 0) {
            targetMuscles.push('Chest', 'Back', 'Legs', 'Shoulders');
          }

          targetMuscles.forEach(m => {
            if (calculatedScore > updated[m].score) {
              updated[m] = {
                score: calculatedScore,
                lastTrained: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`,
                workoutName: log.custom_name || log.session_type || 'Workout'
              };
            }
          });
        });
      }

      // Merge manual soreness overrides
      Object.keys(manualSorenessMap).forEach(m => {
        const group = m as MuscleGroup;
        if (updated[group]) {
          const type = manualSorenessMap[m];
          let manualScore = 50;
          if (type === 'mild') manualScore = 65;
          if (type === 'severe') manualScore = 88;
          if (type === 'injury') manualScore = 98;

          updated[group] = {
            ...updated[group],
            score: Math.max(updated[group].score, manualScore),
            manualSoreness: type,
            note: type === 'injury' ? 'Flagged as Pain/Injury' : 'Self-reported Soreness'
          };
        }
      });

      setMuscles(updated);
    } catch (e) {
      console.error('Heatmap fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmapData();
  }, [user]);

  const handleSetSoreness = async (m: MuscleGroup, type: 'mild' | 'severe' | 'injury' | null) => {
    const newStatus: MuscleStatus = type === null
      ? { score: 10, lastTrained: 'Recovered', workoutName: null, manualSoreness: null }
      : {
          score: type === 'injury' ? 98 : type === 'severe' ? 88 : 65,
          lastTrained: 'Today',
          workoutName: type === 'injury' ? 'Injury / Strain' : 'Self-Reported Soreness',
          manualSoreness: type
        };

    setMuscles(prev => ({ ...prev, [m]: newStatus }));

    if (user) {
      const todayIso = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('daily_logs')
        .select('metadata')
        .eq('user_id', user.id)
        .eq('date', todayIso)
        .maybeSingle();

      const currentMap = existing?.metadata?.manual_soreness || {};
      if (type === null) delete currentMap[m];
      else currentMap[m] = type;

      const newMetadata = { ...(existing?.metadata || {}), manual_soreness: currentMap };

      await supabase.from('daily_logs').upsert({
        user_id: user.id,
        date: todayIso,
        metadata: newMetadata
      }, { onConflict: 'user_id,date' });

      window.dispatchEvent(new Event('workout_os_activity_updated'));
    }
  };

  const getGroupColor = (score: number) => {
    if (score > 75) return '#ff453a'; // Fatigued / Sore Red
    if (score > 40) return '#ff9f0a'; // Recovering Amber
    return '#0a84ff'; // Fresh Blue
  };

  return (
    <div className="w-full glass-card-premium p-4 sm:p-6 mb-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#0a84ff] blur-[120px] opacity-[0.04] pointer-events-none rounded-full" />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-on-surface">Recovery Heatmap</h2>
            {isLoading && <RefreshCw size={14} className="animate-spin text-on-surface-variant" />}
          </div>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            Anatomical muscle fatigue &amp; self-reported soreness tracker.
          </p>
        </div>

        {/* View mode toggle (Front / Back) & Legend */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex bg-black/10 dark:bg-white/10 p-0.5 rounded-full border border-black/5 dark:border-white/10 text-[10px] font-bold">
            <button
              onClick={() => setViewMode('front')}
              className={`px-3 py-1 rounded-full transition-all ${viewMode === 'front' ? 'bg-white dark:bg-zinc-800 text-on-surface shadow-sm' : 'text-on-surface-variant'}`}
            >
              Front
            </button>
            <button
              onClick={() => setViewMode('back')}
              className={`px-3 py-1 rounded-full transition-all ${viewMode === 'back' ? 'bg-white dark:bg-zinc-800 text-on-surface shadow-sm' : 'text-on-surface-variant'}`}
            >
              Back
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase text-on-surface-variant">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0a84ff]" /> Fresh</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff9f0a]" /> Sore</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff453a]" /> Fatigued</span>
          </div>
        </div>
      </div>

      {/* Anatomical Human Body Silhouette Container */}
      <div className="relative w-full h-[360px] flex items-center justify-center bg-zinc-100/60 dark:bg-zinc-950/60 rounded-3xl border border-black/5 dark:border-white/10 overflow-hidden inner-shadow">
        
        {/* Artistic Anatomical Figure Vector */}
        <svg viewBox="0 0 200 400" className="h-full max-h-[340px] w-auto drop-shadow-md select-none">
          <defs>
            {/* Soft Glow Filters */}
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ff453a" floodOpacity="0.6" />
            </filter>
            <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ff9f0a" floodOpacity="0.5" />
            </filter>
            <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0a84ff" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Base Muscular Silhouette Body Path */}
          <g className="fill-zinc-300/40 dark:fill-zinc-800/60 stroke-zinc-400/80 dark:stroke-zinc-600/80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Head & Neck */}
            <circle cx="100" cy="35" r="16" />
            
            {/* Continuous Cohesive Body Path */}
            <path d="
              M 100,210 
              Q 95,250 95,290 Q 95,305 92,320 Q 90,345 92,365 
              L 82,370 L 85,355 
              Q 78,335 83,295 Q 80,270 73,230 Q 70,200 82,190 
              Q 85,170 82,150 Q 75,125 72,110 
              Q 68,130 62,150 Q 58,175 64,195 Q 55,200 50,190 Q 45,160 48,135 
              Q 42,100 58,80 Q 75,65 92,60 
              L 92,50 L 108,50 L 108,60 
              Q 125,65 142,80 Q 158,100 152,135 Q 155,160 150,190 Q 145,200 136,195 Q 142,175 138,150 
              Q 132,130 128,110 Q 125,125 118,150 Q 115,170 118,190 
              Q 130,200 127,230 Q 120,270 117,295 Q 122,335 115,355 
              L 118,370 L 108,365 
              Q 110,345 108,320 Q 105,305 105,290 Q 105,250 100,210 
              Z
            " />

            {/* Inner definition lines for the chest, abs, and muscles (drawn as subtle strokes) */}
            <path d="M 100,52 L 100,75" className="stroke-zinc-400/40 dark:stroke-zinc-700/40" />
            <path d="M 82,75 Q 100,85 118,75" className="stroke-zinc-400/40 dark:stroke-zinc-700/40" />
            <path d="M 100,75 L 100,185" className="stroke-zinc-400/40 dark:stroke-zinc-700/40" />
            <path d="M 72,110 Q 100,120 128,110" className="stroke-zinc-400/40 dark:stroke-zinc-700/40" />
            <path d="M 87,140 Q 100,145 113,140" className="stroke-zinc-400/40 dark:stroke-zinc-700/40" />
            <path d="M 85,165 Q 100,170 115,165" className="stroke-zinc-400/40 dark:stroke-zinc-700/40" />
            <path d="M 82,190 Q 100,200 118,190" className="stroke-zinc-400/40 dark:stroke-zinc-700/40" />
          </g>

          {/* ── INTERACTIVE MUSCLE HEAT MAP OVERLAYS ── */}

          {/* SHOULDERS */}
          <g onClick={() => setSelectedMuscle('Shoulders')} className="cursor-pointer transition-all hover:opacity-80">
            <path d="M 72,110 Q 82,75 92,60 Q 75,65 58,80 Q 42,100 48,135 Q 58,115 72,110 Z" fill={getGroupColor(muscles.Shoulders.score)} opacity="0.85" />
            <path d="M 128,110 Q 118,75 108,60 Q 125,65 142,80 Q 158,100 152,135 Q 142,115 128,110 Z" fill={getGroupColor(muscles.Shoulders.score)} opacity="0.85" />
          </g>

          {/* CHEST (Front) or UPPER BACK (Back) */}
          {viewMode === 'front' ? (
            <g onClick={() => setSelectedMuscle('Chest')} className="cursor-pointer transition-all hover:opacity-80">
              <path d="M 98,115 Q 75,110 72,110 Q 82,75 98,85 Z" fill={getGroupColor(muscles.Chest.score)} opacity="0.88" />
              <path d="M 102,115 Q 125,110 128,110 Q 118,75 102,85 Z" fill={getGroupColor(muscles.Chest.score)} opacity="0.88" />
            </g>
          ) : (
            <g onClick={() => setSelectedMuscle('Back')} className="cursor-pointer transition-all hover:opacity-80">
              <path d="M 99,150 L 101,150 Q 115,155 118,150 Q 125,125 128,110 Q 118,75 102,85 L 98,85 Q 82,75 72,110 Q 75,125 82,150 Q 85,155 99,150 Z" fill={getGroupColor(muscles.Back.score)} opacity="0.88" />
            </g>
          )}

          {/* ARMS */}
          <g onClick={() => setSelectedMuscle('Arms')} className="cursor-pointer transition-all hover:opacity-80">
            <path d="M 72,110 Q 68,130 62,150 Q 58,175 64,195 Q 55,200 50,190 Q 45,160 48,135 Q 58,115 72,110 Z" fill={getGroupColor(muscles.Arms.score)} opacity="0.85" />
            <path d="M 128,110 Q 132,130 138,150 Q 142,175 136,195 Q 145,200 150,190 Q 155,160 152,135 Q 142,115 128,110 Z" fill={getGroupColor(muscles.Arms.score)} opacity="0.85" />
          </g>

          {/* CORE / ABS */}
          <g onClick={() => setSelectedMuscle('Core')} className="cursor-pointer transition-all hover:opacity-80">
            <path d="M 98,115 L 102,115 Q 110,135 115,150 L 110,185 Q 100,195 90,185 L 85,150 Q 90,135 98,115 Z" fill={getGroupColor(muscles.Core.score)} opacity="0.85" />
          </g>

          {/* LEGS (Quads Front / Hamstrings Back) */}
          <g onClick={() => setSelectedMuscle('Legs')} className="cursor-pointer transition-all hover:opacity-80">
            <path d="M 100,210 Q 95,250 95,290 Q 95,305 92,320 Q 90,345 92,365 L 82,370 L 85,355 Q 78,335 83,295 Q 80,270 73,230 Q 70,200 82,190 Q 90,200 100,210 Z" fill={getGroupColor(muscles.Legs.score)} opacity="0.88" />
            <path d="M 100,210 Q 105,250 105,290 Q 105,305 108,320 Q 110,345 108,365 L 118,370 L 115,355 Q 122,335 117,295 Q 120,270 127,230 Q 130,200 118,190 Q 110,200 100,210 Z" fill={getGroupColor(muscles.Legs.score)} opacity="0.88" />
          </g>

        </svg>

        {/* Anatomical Label Badges Floating Beside Body */}
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start pointer-events-auto">
            <button 
              onClick={() => setSelectedMuscle('Shoulders')}
              className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border bg-white/80 dark:bg-black/60 backdrop-blur-md shadow-sm border-black/10 dark:border-white/10 flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getGroupColor(muscles.Shoulders.score) }} />
              Shoulders ({muscles.Shoulders.score}%)
            </button>
            <button 
              onClick={() => setSelectedMuscle(viewMode === 'front' ? 'Chest' : 'Back')}
              className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border bg-white/80 dark:bg-black/60 backdrop-blur-md shadow-sm border-black/10 dark:border-white/10 flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getGroupColor(viewMode === 'front' ? muscles.Chest.score : muscles.Back.score) }} />
              {viewMode === 'front' ? 'Chest' : 'Back'} ({viewMode === 'front' ? muscles.Chest.score : muscles.Back.score}%)
            </button>
          </div>

          <div className="flex justify-between items-center pointer-events-auto">
            <button 
              onClick={() => setSelectedMuscle('Arms')}
              className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border bg-white/80 dark:bg-black/60 backdrop-blur-md shadow-sm border-black/10 dark:border-white/10 flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getGroupColor(muscles.Arms.score) }} />
              Arms ({muscles.Arms.score}%)
            </button>
            <button 
              onClick={() => setSelectedMuscle('Core')}
              className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border bg-white/80 dark:bg-black/60 backdrop-blur-md shadow-sm border-black/10 dark:border-white/10 flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getGroupColor(muscles.Core.score) }} />
              Core ({muscles.Core.score}%)
            </button>
          </div>

          <div className="flex justify-center pointer-events-auto">
            <button 
              onClick={() => setSelectedMuscle('Legs')}
              className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border bg-white/80 dark:bg-black/60 backdrop-blur-md shadow-sm border-black/10 dark:border-white/10 flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getGroupColor(muscles.Legs.score) }} />
              Legs ({muscles.Legs.score}%)
            </button>
          </div>
        </div>
      </div>

      {/* Selected Muscle Action & Soreness Logger Modal */}
      <AnimatePresence>
        {selectedMuscle && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="mt-4 p-4 rounded-2xl bg-zinc-100 dark:bg-black/60 border border-zinc-200 dark:border-white/10 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: getGroupColor(muscles[selectedMuscle].score) }} />
                <div>
                  <h4 className="text-sm font-bold text-on-surface">
                    {selectedMuscle} — {muscles[selectedMuscle].score}% Fatigue
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    {muscles[selectedMuscle].lastTrained
                      ? `Last activity: ${muscles[selectedMuscle].lastTrained} (${muscles[selectedMuscle].workoutName})`
                      : 'No recent workout logged for this muscle group'}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedMuscle(null)}
                className="text-xs font-semibold text-on-surface-variant hover:text-on-surface"
              >
                Close
              </button>
            </div>

            {/* Quick Soreness & Pain Flagging Options */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-on-surface-variant mr-1">Log Real Feeling:</span>

              <button
                onClick={() => handleSetSoreness(selectedMuscle, 'mild')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  muscles[selectedMuscle].manualSoreness === 'mild'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                }`}
              >
                Mild DOMS
              </button>

              <button
                onClick={() => handleSetSoreness(selectedMuscle, 'severe')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  muscles[selectedMuscle].manualSoreness === 'severe'
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
                }`}
              >
                Heavy Soreness
              </button>

              <button
                onClick={() => handleSetSoreness(selectedMuscle, 'injury')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${
                  muscles[selectedMuscle].manualSoreness === 'injury'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20'
                }`}
              >
                <AlertTriangle size={12} /> Strain / Pain
              </button>

              <button
                onClick={() => handleSetSoreness(selectedMuscle, null)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 flex items-center gap-1 ml-auto"
              >
                <CheckCircle2 size={12} /> Mark Fully Fresh
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
