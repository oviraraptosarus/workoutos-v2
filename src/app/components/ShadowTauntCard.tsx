'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Skull, VolumeX, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShadowTauntCardProps {
  taunt: string;
  domain: string;
  isLoading?: boolean;
}

export default function ShadowTauntCard({ taunt, domain, isLoading = false }: ShadowTauntCardProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isSilenced, setIsSilenced] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  const handleChallengeAccepted = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 50, 50]); // Triple tap heartbeat
    }
    setIsAccepted(true);
    setTimeout(() => {
      setIsSilenced(true);
    }, 800);
  };

  useEffect(() => {
    if (!taunt || isLoading || isSilenced) {
      setDisplayedText('');
      return;
    }

    setIsTyping(true);
    let i = 0;
    setDisplayedText('');
    
    const interval = setInterval(() => {
      i++;
      setDisplayedText(taunt.slice(0, i));
      if (i >= taunt.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30); // 30ms per character

    return () => clearInterval(interval);
  }, [taunt, isLoading, isSilenced]);

  if (isSilenced) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={isAccepted ? { opacity: 0, scale: 0.95, y: -10 } : { opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: isAccepted ? 0.5 : 0.3 }}
      className={`relative w-full rounded-2xl overflow-hidden bg-[#050505] p-5 mb-6 group transition-all duration-300 ${
        isAccepted ? 'border-2 border-[#ff453a] shadow-[0_0_80px_rgba(255,69,58,0.3)]' : 'border border-[#ff453a]/20 shadow-[0_0_40px_rgba(255,69,58,0.05)]'
      }`}
    >
      {/* Background ambient menace */}
      <div className={`absolute top-0 right-0 w-64 h-64 bg-[#ff453a] rounded-full translate-x-1/2 -translate-y-1/2 transition-all duration-500 pointer-events-none ${isAccepted ? 'blur-[80px] opacity-[0.15]' : 'blur-[100px] opacity-[0.03]'}`}></div>
      <div className={`absolute bottom-0 left-0 w-32 h-32 bg-[#ff9f0a] rounded-full -translate-x-1/2 translate-y-1/2 transition-all duration-500 pointer-events-none ${isAccepted ? 'blur-[60px] opacity-[0.15]' : 'blur-[80px] opacity-[0.03]'}`}></div>
      
      {/* Scratch lines overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isAccepted ? 'opacity-[0.06]' : 'opacity-[0.02]'}`} style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ff453a 10px, #ff453a 11px)'
      }} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors duration-300 ${isAccepted ? 'bg-[#ff453a] border-transparent' : 'bg-[#ff453a]/10 border border-[#ff453a]/20'}`}>
              <Skull size={12} className={isAccepted ? 'text-black' : 'text-[#ff453a]'} />
            </div>
            <h4 className="font-display-sm font-bold text-[#ff453a] tracking-widest uppercase text-[10px]">Shadow Protocol</h4>
            <span className="text-[#ff453a]/40 text-[10px] uppercase font-bold">• {domain}</span>
          </div>
          
          {!isAccepted && (
            <button 
              onClick={() => setIsSilenced(true)}
              className="text-white/20 hover:text-white/60 transition-colors p-1"
              title="Silence Shadow"
            >
              <VolumeX size={14} />
            </button>
          )}
        </div>

        <div className="min-h-[60px] flex items-center">
          {isLoading ? (
            <div className="flex gap-1 items-center opacity-50">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff453a] animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff453a] animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff453a] animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          ) : (
            <p className={`font-medium text-sm sm:text-base leading-relaxed tracking-wide transition-colors duration-300 ${isAccepted ? 'text-[#ff453a]' : 'text-white/90'}`}>
              "{displayedText}"
              {isTyping && !isAccepted && <span className="inline-block w-1.5 h-4 ml-1 bg-[#ff453a] animate-pulse align-middle"></span>}
            </p>
          )}
        </div>

        {!isLoading && !isTyping && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 pt-3 border-t border-white/5 flex justify-end"
          >
            <button 
              onClick={handleChallengeAccepted}
              disabled={isAccepted}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                isAccepted ? 'text-[#ff453a] animate-pulse' : 'text-[#ff453a]/70 hover:text-[#ff453a]'
              }`}
            >
              {isAccepted ? 'WAR MODE ENGAGED' : 'Challenge Accepted'} <Swords size={12} />
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
