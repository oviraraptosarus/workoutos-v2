'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Square, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HudRestTimer() {
  const [timeLeft, setTimeLeft] = useState(60); // Default 60s
  const [isActive, setIsActive] = useState(false);

  const playDing = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 1.5);
      
      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);

      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
    } catch (e) {
      console.warn("Audio/Haptic failed", e);
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      playDing();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, playDing]);

  const toggle = () => setIsActive(!isActive);
  const addTime = (secs: number) => setTimeLeft(t => t + secs);
  const reset = () => {
      setIsActive(false);
      setTimeLeft(60);
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center justify-center w-full mt-10">
      {/* Huge Timer */}
      <div 
        className={`text-8xl font-black tabular-nums tracking-tighter transition-colors duration-300 ${timeLeft === 0 ? 'text-[#ff453a] animate-pulse' : 'text-[#0a84ff]'}`}
        onClick={toggle}
      >
        {timeStr}
      </div>
      
      <div className="text-on-surface-variant font-bold uppercase tracking-widest text-xs mt-2 mb-8">
          Rest Timer
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button 
            onClick={() => addTime(-15)}
            className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg active:scale-95 transition-transform"
        >
            -15
        </button>

        <button 
            onClick={toggle}
            className="w-20 h-20 rounded-full bg-[#0a84ff] flex items-center justify-center text-white shadow-[0_0_30px_rgba(10,132,255,0.4)] active:scale-95 transition-transform"
        >
            {isActive ? <Square size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1"/>}
        </button>

        <button 
            onClick={() => addTime(15)}
            className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg active:scale-95 transition-transform"
        >
            +15
        </button>
      </div>
      
      {!isActive && timeLeft !== 60 && (
         <button onClick={reset} className="mt-6 flex items-center gap-2 text-white/50 text-sm font-bold uppercase tracking-widest p-3">
             <RefreshCcw size={14} /> Reset
         </button>
      )}
    </div>
  );
}
