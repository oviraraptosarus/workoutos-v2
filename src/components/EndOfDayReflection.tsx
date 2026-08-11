'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
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
                setAvaSummary(data.reflection);
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
            stopRecording();
        };

        recognition.onend = () => stopRecording();

        recognitionRef.current = recognition;
        recognition.start();
        setState('recording');

        timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    };

    const stopRecording = () => {
        recognitionRef.current?.stop();
        if (timerRef.current) clearInterval(timerRef.current);
        setState('idle');
    };

    const toggleRecording = () => {
        if (state === 'recording') stopRecording();
        else startRecording();
    };

    const handleReflect = async () => {
        if (!rawTranscript.trim()) return;
        setState('processing');
        
        try {
            // 1. Send to AI
            const res = await fetch('/api/ai/daily-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rawTranscript,
                    userName: user?.email?.split('@')[0] || 'User'
                })
            });

            if (!res.ok) throw new Error('AI processing failed');
            const data = await res.json();
            const summary = data.summary;
            setAvaSummary(summary);

            // 2. Save to Supabase
            if (user) {
                const dateKey = selectedDate;
                
                // Merge with existing log to not overwrite sleep hours
                const { data: existingLog } = await supabase
                    .from('daily_logs')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('date', dateKey)
                    .single();

                const { error } = await supabase.from('daily_logs').upsert({
                    id: existingLog?.id, // include ID if updating existing row
                    user_id: user.id,
                    date: dateKey,
                    raw_transcript: rawTranscript,
                    reflection: summary,
                    sleep_hours: existingLog?.sleep_hours || 0,
                }, { onConflict: 'user_id,date' });
                
                if (error) throw error;
                window.dispatchEvent(new Event('workout_os_reflection_saved'));
            }

            setState('done');
            setTimeout(() => {
                setState('viewing');
            }, 3000);

        } catch (e: any) {
            alert('Error: ' + e.message);
            setState('idle');
        }
    };

    return (
        <div className="bg-surface-container-lowest border border-surface-variant p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col gap-6 sm:gap-8 min-h-[400px] relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

            <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[1rem] bg-primary/20 flex items-center justify-center border border-primary/30 text-primary shadow-[0_0_20px_rgba(var(--c-primary)/0.3)] backdrop-blur-md shrink-0">
                    <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-on-surface tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-on-surface to-on-surface-variant">End of Day Review</h2>
            </div>
            <p className="text-on-surface-variant text-sm sm:text-base font-medium leading-relaxed relative z-10 -mt-2 sm:-mt-4 mb-2">
                Did you win the day? Log your daily wrap-up, bottlenecks, and wins. Ava will process this reflection to identify your behavioral patterns, suggest course corrections, and adjust tomorrow's targets.
            </p>
            
            <div className="relative mb-4 z-10 flex-1 flex flex-col">
                <textarea
                    value={rawTranscript}
                    onChange={(e) => setRawTranscript(e.target.value)}
                    disabled={state === 'recording' || state === 'processing' || state === 'done' || !isToday}
                    placeholder="e.g. Executed well on work tasks, but skipped the gym because I slept poorly. Need to fix sleep hygiene."
                    className="w-full h-full min-h-[160px] bg-surface-container border border-surface-variant rounded-[1.25rem] p-6 pb-16 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-inner backdrop-blur-md placeholder:text-on-surface-variant/50 font-body-md resize-none disabled:opacity-70"
                />
                
                {state === 'done' ? (
                    <div className="absolute inset-0 bg-surface-container/80 backdrop-blur-sm rounded-[1.25rem] flex flex-col items-center justify-center text-primary gap-3">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <span className="font-bold text-center px-4">Reflection logged and analyzed!</span>
                    </div>
                ) : state === 'viewing' ? (
                    <div className="absolute inset-0 bg-surface-container rounded-[1.25rem] p-6 overflow-y-auto text-on-surface text-sm border border-surface-variant flex flex-col">
                        <div className="flex items-center gap-2 text-primary font-bold mb-4">
                            <Sparkles className="w-5 h-5" /> Ava's Analysis
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{avaSummary}</p>
                    </div>
                ) : (
                    <button 
                        onClick={toggleRecording}
                        disabled={state === 'processing' || !isToday}
                        className={clsx(
                            "absolute bottom-4 right-4 p-3 rounded-full transition-all shadow-md flex items-center gap-2",
                            state === 'recording' ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse" : "bg-white/5 border border-white/10 text-on-surface hover:bg-white/10 disabled:opacity-50"
                        )}
                    >
                        {state === 'recording' ? (
                            <>
                                <MicOff className="w-5 h-5" />
                                <span className="text-sm font-bold pr-1">Stop ({Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')})</span>
                            </>
                        ) : (
                            <>
                                <Mic className="w-5 h-5" />
                                <span className="text-sm font-bold pr-1">Speak</span>
                            </>
                        )}
                    </button>
                )}
            </div>
            
            {state !== 'done' && state !== 'viewing' && (
                <button 
                    onClick={handleReflect}
                    disabled={!rawTranscript.trim() || state === 'recording' || state === 'processing'}
                    className="relative z-10 w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-[0_4px_16px_rgba(var(--c-primary)/0.4)] hover:shadow-[0_8px_24px_rgba(var(--c-primary)/0.6)] disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 mt-auto"
                >
                    {state === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {state === 'processing' ? 'Processing...' : 'Analyze & Store'}
                </button>
            )}
        </div>
    );
}
