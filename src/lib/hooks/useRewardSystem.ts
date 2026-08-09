'use client';

import { useCallback, useEffect, useRef } from 'react';

// Singleton audio context to prevent multiple instances and comply with browser autoplay policies
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

export const useRewardSystem = () => {
    // Attempt to initialize on mount if possible, though user interaction is often required
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const initAudio = () => {
                getAudioContext();
                window.removeEventListener('click', initAudio);
                window.removeEventListener('touchstart', initAudio);
            };
            window.addEventListener('click', initAudio, { once: true });
            window.addEventListener('touchstart', initAudio, { once: true });
            
            return () => {
                window.removeEventListener('click', initAudio);
                window.removeEventListener('touchstart', initAudio);
            };
        }
    }, []);

    /**
     * Plays a synthesized tone
     * @param type - Oscillator type
     * @param freq - Frequency in Hz
     * @param duration - Duration in seconds
     * @param volume - Volume from 0 to 1
     */
    const playTone = useCallback((type: OscillatorType, freq: number, duration: number, volume: number = 0.1, sweepTo?: number) => {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;
        
        // Frequency sweep for pops and bouncy sounds
        osc.frequency.setValueAtTime(freq, now);
        if (sweepTo) {
            osc.frequency.exponentialRampToValueAtTime(sweepTo, now + duration);
        }

        // Fade out to avoid clipping clicks
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }, []);

    /**
     * Trigger a quick, light tap (e.g. checkbox click)
     */
    const triggerTap = useCallback(() => {
        if (typeof window !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(20);
        }
        playTone('sine', 600, 0.05, 0.05, 300);
    }, [playTone]);

    /**
     * Trigger a satisfying, deeper pop (e.g. moving a widget)
     */
    const triggerPop = useCallback(() => {
        if (typeof window !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([10, 30, 10]);
        }
        playTone('triangle', 400, 0.08, 0.08, 150);
    }, [playTone]);

    /**
     * Trigger a triumphant success chime (e.g. saving settings, completing a streak)
     */
    const triggerSuccess = useCallback(() => {
        if (typeof window !== 'undefined') {
            if (navigator.vibrate) navigator.vibrate([30, 50, 30, 50, 100]); // Exciting double-buzz
            window.dispatchEvent(new Event('workout_os_reward_success'));
        }
        
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        // Arpeggio: C5 (523Hz), E5 (659Hz), G5 (783Hz), C6 (1046Hz)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.frequency.value = freq;
            
            const startTime = now + (i * 0.08); // fast arpeggio
            const duration = 0.3;
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    }, []);

    return {
        triggerTap,
        triggerPop,
        triggerSuccess
    };
};
