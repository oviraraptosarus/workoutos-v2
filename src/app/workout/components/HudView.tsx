'use client';

import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HudRestTimer from './HudRestTimer';

interface HudViewProps {
  exercises: any[];
  onClose: () => void;
  onToggleExercise: (idx: number) => void;
}

export default function HudView({ exercises, onClose, onToggleExercise }: HudViewProps) {
  // Start on the first uncompleted exercise
  const initialIdx = useMemo(() => {
      const idx = exercises.findIndex(e => !e.completed);
      return idx >= 0 ? idx : 0;
  }, []);

  const [currentIdx, setCurrentIdx] = useState(initialIdx);

  const currentEx = exercises[currentIdx];
  const isLast = currentIdx === exercises.length - 1;
  const isFirst = currentIdx === 0;

  const nextEx = () => { if (!isLast) setCurrentIdx(c => c + 1); };
  const prevEx = () => { if (!isFirst) setCurrentIdx(c => c - 1); };

  if (!currentEx) return null;

  return (
    <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-0 z-[100] bg-black text-white flex flex-col pt-12 pb-8 px-6 overflow-hidden"
    >
        {/* Top Nav */}
        <div className="flex items-center justify-between mb-8 z-10">
            <button 
                onClick={onClose}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
            >
                <X size={24} />
            </button>
            <div className="text-white/50 font-bold uppercase tracking-widest text-xs">
                {currentIdx + 1} / {exercises.length}
            </div>
            <div className="w-12" /> {/* Spacer */}
        </div>

        {/* Exercise Display */}
        <div className="flex-1 flex flex-col justify-center relative z-10">
            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentIdx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center text-center w-full"
                >
                    <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-none mb-4 w-full break-words">
                        {currentEx.name}
                    </h2>
                    
                    <div className="text-[#30d158] text-3xl font-bold font-mono bg-[#30d158]/10 px-6 py-2 rounded-2xl border border-[#30d158]/20 mb-8">
                        {currentEx.sets}
                    </div>

                    <button 
                        onClick={() => {
                            onToggleExercise(currentIdx);
                            // Auto-advance if we just completed it and it's not the last one
                            if (!currentEx.completed && !isLast) {
                                setTimeout(() => nextEx(), 600);
                            }
                        }}
                        className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-widest text-lg transition-all flex items-center justify-center gap-3 ${
                            currentEx.completed 
                            ? 'bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/30' 
                            : 'bg-white text-black hover:scale-[0.98]'
                        }`}
                    >
                        {currentEx.completed ? (
                            <><CheckCircle2 size={24} /> Completed</>
                        ) : (
                            'Mark Done'
                        )}
                    </button>
                </motion.div>
            </AnimatePresence>
            
            <HudRestTimer />
        </div>

        {/* Giant Invisible Swipe Areas for Next/Prev (or fallback buttons if needed, but buttons are safer) */}
        <div className="flex justify-between items-center mt-auto pt-6 z-10">
            <button 
                onClick={prevEx}
                disabled={isFirst}
                className={`flex items-center gap-2 font-bold uppercase tracking-widest p-4 transition-opacity ${isFirst ? 'opacity-20' : 'opacity-100'}`}
            >
                <ChevronLeft size={24} /> Prev
            </button>
            <button 
                onClick={nextEx}
                disabled={isLast}
                className={`flex items-center gap-2 font-bold uppercase tracking-widest p-4 transition-opacity ${isLast ? 'opacity-20' : 'opacity-100'}`}
            >
                Next <ChevronRight size={24} />
            </button>
        </div>
    </motion.div>
  );
}
