'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRewardSystem } from '@/lib/hooks/useRewardSystem';

interface FeverContextType {
    feverScore: number;
    feverLevel: number; // 0 to 5
    multiplier: number;
    gachaPulls: number;
    addFever: (points: number) => void;
    addGachaPull: (count?: number) => void;
    useGachaPull: () => boolean;
}

const FeverContext = createContext<FeverContextType | undefined>(undefined);

const MAX_FEVER_SCORE = 1000;
const LEVEL_THRESHOLDS = [0, 200, 400, 600, 800, 1000];

export function FeverProvider({ children }: { children: ReactNode }) {
    const [feverScore, setFeverScore] = useState(0);
    const [gachaPulls, setGachaPulls] = useState(0);
    const { triggerSuccess, triggerPop } = useRewardSystem();

    // Load initial state
    useEffect(() => {
        const savedPulls = localStorage.getItem('workout_os_gacha_pulls');
        if (savedPulls) {
            setGachaPulls(parseInt(savedPulls, 10));
        }
    }, []);

    // Save pulls
    useEffect(() => {
        localStorage.setItem('workout_os_gacha_pulls', gachaPulls.toString());
    }, [gachaPulls]);

    // Decay fever score over time (lose 10 points every 5 seconds)
    useEffect(() => {
        if (feverScore === 0) return;
        
        const interval = setInterval(() => {
            setFeverScore(prev => Math.max(0, prev - 10));
        }, 5000);
        
        return () => clearInterval(interval);
    }, [feverScore]);

    // Calculate level based on score
    const feverLevel = LEVEL_THRESHOLDS.reduce((level, threshold, index) => {
        if (feverScore >= threshold) return index;
        return level;
    }, 0);

    const multiplier = 1 + (feverLevel * 0.5); // 1x to 3.5x

    const addFever = useCallback((points: number) => {
        setFeverScore(prev => {
            const next = Math.min(MAX_FEVER_SCORE, prev + (points * multiplier));
            return next;
        });
    }, [multiplier]);

    const addGachaPull = useCallback((count = 1) => {
        setGachaPulls(prev => prev + count);
        triggerSuccess();
    }, [triggerSuccess]);

    const useGachaPull = useCallback(() => {
        if (gachaPulls > 0) {
            setGachaPulls(prev => prev - 1);
            triggerPop();
            return true;
        }
        return false;
    }, [gachaPulls, triggerPop]);

    // Expose CSS variables for global UI effects based on fever level
    useEffect(() => {
        const root = document.documentElement;
        if (feverLevel > 0) {
            root.style.setProperty('--fever-glow', `0 0 ${10 + feverLevel * 5}px rgba(255, 69, 58, ${0.1 + (feverLevel * 0.1)})`);
            root.style.setProperty('--fever-border', `rgba(255, 69, 58, ${0.2 + (feverLevel * 0.15)})`);
            root.style.setProperty('--fever-animation-speed', `${1 - (feverLevel * 0.1)}s`);
        } else {
            root.style.removeProperty('--fever-glow');
            root.style.removeProperty('--fever-border');
            root.style.removeProperty('--fever-animation-speed');
        }
    }, [feverLevel]);

    return (
        <FeverContext.Provider value={{ feverScore, feverLevel, multiplier, gachaPulls, addFever, addGachaPull, useGachaPull }}>
            {children}
        </FeverContext.Provider>
    );
}

export function useFever() {
    const context = useContext(FeverContext);
    if (context === undefined) {
        throw new Error('useFever must be used within a FeverProvider');
    }
    return context;
}
