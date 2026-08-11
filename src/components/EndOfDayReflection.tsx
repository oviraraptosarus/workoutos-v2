'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, CheckCircle2, Sparkles, Loader2, Square } from 'lucide-react';
import { useDate } from '@/contexts/DateContext';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';

type JournalState = 'idle' | 'recording' | 'processing' | 'done' | 'viewing';

export default function EndOfDayReflection() {
    const { selectedDate, isToday } = useDate();
    const { user } = useAuth();

    const [state, setState] = useState<JournalState>('idle');
    const [rawTranscript, setRawTranscript] = useState('');
    const [avaSummary, setAvaSummary] = useState('');
    const [elapsed, setElapsed] = useState(0);

    const recognitionRef = useRef<any>(null);
    const finalRef = useRef('');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchReflection = async () => {
            if (!user) return;
            setState('idle');
            setRawTranscript('');
            setAvaSummary('');
            
            const { data } = await supabase
                .from('daily_logs')
                .select('reflection, raw_transcript')
                .eq('user_id', user.id)
                .eq('date', selectedDate)
                .single();

            if (isMounted && data && data.reflection) {
                let parsedSummary = data.reflection;
                if (typeof parsedSummary === 'string' && parsedSummary.trim().startsWith('{')) {
                    try {
                        const obj = JSON.parse(parsedSummary);
                        parsedSummary = obj.reflection || obj.summary || obj.raw_voice || parsedSummary;
                    } catch(e) {}
                }
                setAvaSummary(parsedSummary);
                setRawTranscript(data.raw_transcript || '');
                setState('viewing');
            }
        };
        fetchReflection();
        return () => { isMounted = false; };
    }, [selectedDate, user]);

    const startRecording = () => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) {
            alert('Speech recognition is not supported in this browser. Please use Chrome or Safari.');
            return;
        }

        finalRef.current = '';
        setRawTranscript('');
        setAvaSummary('');
        setElapsed(0);

        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (e: any) => {
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const chunk = e.results[i][0].transcript;
                if (e.results[i].isFinal) finalRef.current += chunk + ' ';
                else interim = chunk;
            }
            setRawTranscript((finalRef.current + interim).trim());
        };

        recognition.onerror = (e: any) => {
            if (e.error !== 'aborted') alert('Microphone error: ' + e.error);
            stopRecording(false);
        };

        recognition.onend = () => stopRecording(true);

        recognitionRef.current = recognition;
        recognition.start();
        setState('recording');

        timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    };

    const stopRecording = (shouldSave: boolean = true) => {
        recognitionRef.current?.stop();
        if (timerRef.current) clearInterval(timerRef.current);
        
        // Use the ref since state might be stale
        if (shouldSave && finalRef.current.trim().length > 0) {
            handleReflect(finalRef.current);
        } else {
            setState('idle');
        }
    };

    const toggleRecording = () => {
        if (state === 'recording') stopRecording(true);
        else startRecording();
    };

    const handleReflect = async (transcriptToSave: string) => {
        setState('processing');
        
        try {
            // 1. Send to AI
            const res = await fetch('/api/ai/daily-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rawTranscript: transcriptToSave,
                    userName: user?.email?.split('@')[0] || 'User'
                })
            });

            if (!res.ok) throw new Error('AI processing failed');
            const aiData = await res.json();
            const summary = aiData.summary;
            setAvaSummary(summary);

            // 2. Save to Supabase
            if (user) {
                const dateKey = selectedDate;
                
                const { data: existingLog } = await supabase
                    .from('daily_logs')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('date', dateKey)
                    .single();

                const { error } = await supabase.from('daily_logs').upsert({
                    id: existingLog?.id, 
                    user_id: user.id,
                    date: dateKey,
                    raw_transcript: transcriptToSave,
                    reflection: summary,
                    sleep_hours: existingLog?.sleep_hours || 0,
                }, { onConflict: 'user_id,date' });
                
                if (error) throw error;
                window.dispatchEvent(new Event('workout_os_reflection_saved'));
            }

            setState('done');
            setTimeout(() => {
                setState('viewing');
            }, 2500);

        } catch (e: any) {
            alert('Error: ' + e.message);
            setState('idle');
        }
    };

    return (
        <div className="glass-card-premium p-5 sm:p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group min-h-[160px]">
            {/* Header Floating Outside Content Container */}
            <h2 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-4">
                Audio Log
            </h2>

            {/* Apple iOS Style Voice Message Pill */}
            <div className={clsx(
                "relative flex items-center h-12 sm:h-14 rounded-full px-2 transition-all duration-500 w-full max-w-[280px] sm:max-w-[320px] shadow-sm",
                state === 'recording' ? "bg-[#0a84ff] shadow-lg shadow-blue-500/20" : 
                state === 'done' || state === 'viewing' ? "bg-surface-container border border-surface-variant/50" :
                "bg-surface-container border border-surface-variant"
            )}>
                {/* Play / Stop Button */}
                <button
                    onClick={toggleRecording}
                    disabled={state === 'processing' || (!isToday && state !== 'viewing')}
                    className={clsx(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all z-10 shrink-0",
                        state === 'recording' ? "bg-white text-[#0a84ff]" : 
                        state === 'done' || state === 'viewing' ? "bg-primary text-white" :
                        "bg-primary text-white disabled:opacity-30 disabled:grayscale"
                    )}
                >
                    {state === 'recording' ? <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" /> : 
                     state === 'processing' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                     state === 'done' ? <CheckCircle2 className="w-5 h-5" /> :
                     <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
                
                {/* Center Content / Waveform Area */}
                <div className="flex-1 flex items-center justify-center gap-[3px] px-3 sm:px-4 h-full overflow-hidden">
                    {state === 'recording' ? (
                        /* Simulated Audio Waveform */
                        Array.from({ length: 24 }).map((_, i) => (
                            <div 
                                key={i} 
                                className="w-0.5 sm:w-[3px] bg-white rounded-full animate-waveform"
                                style={{ 
                                    height: `${Math.max(15, Math.random() * 100)}%`,
                                    animationDelay: `${i * 0.05}s` 
                                }}
                            />
                        ))
                    ) : state === 'processing' ? (
                        <div className="text-on-surface-variant font-semibold text-[11px] sm:text-xs tracking-wide">
                            Analyzing...
                        </div>
                    ) : state === 'done' ? (
                        <div className="text-on-surface font-semibold text-[11px] sm:text-xs tracking-wide">
                            Audio Saved
                        </div>
                    ) : (
                        <div className="text-on-surface-variant/70 font-semibold text-[11px] sm:text-xs tracking-wide">
                            {state === 'viewing' ? "Audio Log Saved" : "Tap to record log"}
                        </div>
                    )}
                </div>
                
                {/* Time Indicator */}
                <div className={clsx(
                    "text-[11px] sm:text-xs font-bold tracking-wider w-10 sm:w-12 text-right pr-2 shrink-0",
                    state === 'recording' ? "text-white" : "text-on-surface-variant/70"
                )}>
                    {state === 'recording' ? (
                        `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}`
                    ) : (
                        "0:00"
                    )}
                </div>
            </div>

            {/* Ava's Analysis - shown when viewing if available */}
            {state === 'viewing' && avaSummary && (
                <div className="mt-6 pt-5 border-t border-surface-variant/40 w-full animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-1.5 mb-2.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">Ava's Notes</h3>
                    </div>
                    <p className="text-xs font-medium leading-relaxed text-on-surface whitespace-pre-wrap px-1 opacity-90">{avaSummary}</p>
                </div>
            )}
        </div>
    );
}
