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

  useEffect(() => {
    if (!taunt || isLoading || isSilenced) {
      setDisplayedText('');
      return;
    }

    setIsTyping(true);
    let i = 0;
    setDisplayedText('');
    
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + taunt.charAt(i));
      i++;
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
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full rounded-2xl overflow-hidden bg-[#050505] border border-[#ff453a]/20 shadow-[0_0_40px_rgba(255,69,58,0.05)] p-5 mb-6 group"
    >
      {/* Background ambient menace */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff453a] blur-[100px] opacity-[0.03] pointer-events-none rounded-full translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#ff9f0a] blur-[80px] opacity-[0.03] pointer-events-none rounded-full -translate-x-1/2 translate-y-1/2"></div>
      
      {/* Scratch lines overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ff453a 10px, #ff453a 11px)'
      }} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#ff453a]/10 flex items-center justify-center border border-[#ff453a]/20">
              <Skull size={12} className="text-[#ff453a]" />
            </div>
            <h4 className="font-display-sm font-bold text-[#ff453a] tracking-widest uppercase text-[10px]">Shadow Protocol</h4>
            <span className="text-[#ff453a]/40 text-[10px] uppercase font-bold">• {domain}</span>
          </div>
          
          <button 
            onClick={() => setIsSilenced(true)}
            className="text-white/20 hover:text-white/60 transition-colors p-1"
            title="Silence Shadow"
          >
            <VolumeX size={14} />
          </button>
        </div>

        <div className="min-h-[60px] flex items-center">
          {isLoading ? (
            <div className="flex gap-1 items-center opacity-50">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff453a] animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff453a] animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff453a] animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          ) : (
            <p className="text-white/90 font-medium text-sm sm:text-base leading-relaxed tracking-wide">
              "{displayedText}"
              {isTyping && <span className="inline-block w-1.5 h-4 ml-1 bg-[#ff453a] animate-pulse align-middle"></span>}
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
              onClick={() => setIsSilenced(true)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#ff453a]/70 hover:text-[#ff453a] transition-colors"
            >
              Challenge Accepted <Swords size={12} />
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
