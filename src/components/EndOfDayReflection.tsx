'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, CheckCircle2, Sparkles, Loader2, Edit3, RefreshCw, History } from 'lucide-react';
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
    const [isEditing, setIsEditing] = useState(false);
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);

    const recognitionRef = useRef<any>(null);
    const finalRef = useRef('');

    const fetchHistory = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('daily_logs')
            .select('date, reflection, raw_transcript')
            .eq('user_id', user.id)
            .not('reflection', 'is', null)
            .order('date', { ascending: false })
            .limit(5);
        if (data) setHistoryLogs(data);
    };

    useEffect(() => {
        let isMounted = true;
        const fetchReflection = async () => {
            if (!user) return;
            setState('idle');
            setRawTranscript('');
            setAvaSummary('');
            setIsEditing(false);
            
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
        fetchHistory();
        return () => { isMounted = false; };
    }, [selectedDate, user]);

    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
        };
    }, []);

    const startRecording = () => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) {
            alert('Speech recognition is not supported in this browser. Please use Chrome or Safari.');
            return;
        }

        finalRef.current = '';
        setRawTranscript('');
        setAvaSummary('');
        setIsEditing(false);

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

        recognition.onend = () => {
            if (state === 'recording') {
                stopRecording(true);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
        setState('recording');
    };

    const stopRecording = (shouldProcess: boolean = true) => {
        recognitionRef.current?.stop();
        
        if (shouldProcess) {
            const finalString = (finalRef.current || rawTranscript).trim();
            if (finalString.length > 0) {
                setRawTranscript(finalString);
                processWithAva(finalString);
            } else {
                setState('idle');
            }
        } else {
            setState('idle');
        }
    };

    const processWithAva = async (transcriptToProcess: string) => {
        setState('processing');
        
        try {
            const res = await fetch('/api/ai/daily-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rawTranscript: transcriptToProcess,
                    userName: user?.email?.split('@')[0] || 'User'
                })
            });

            if (!res.ok) throw new Error('AI processing failed');
            const aiData = await res.json();
            setAvaSummary(aiData.summary);
            setState('done');
        } catch (e: any) {
            alert('Error: ' + e.message);
            setState('idle');
        }
    };

    const handleSave = async () => {
        if (!user || !rawTranscript.trim() || !avaSummary.trim()) return;
        
        try {
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
                raw_transcript: rawTranscript,
                reflection: avaSummary,
                sleep_hours: existingLog?.sleep_hours || 0,
            }, { onConflict: 'user_id,date' });
            
            if (error) throw error;
            
            window.dispatchEvent(new Event('workout_os_reflection_saved'));
            fetchHistory();
            setState('viewing');
            setIsEditing(false);
        } catch (e: any) {
            alert('Error saving reflection: ' + e.message);
        }
    };

    const wordCount = rawTranscript.trim() ? rawTranscript.trim().split(/\s+/).length : 0;

    return (
        <div className="flex flex-col gap-6">
            <div className="glass-card-premium p-6 sm:p-8 relative min-h-[300px] flex flex-col justify-center transition-all duration-500">
                <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
                    <h2 className="text-sm font-black text-on-surface-variant uppercase tracking-widest">
                        Daily Journal
                    </h2>
                    {state === 'viewing' && (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(var(--c-secondary)/0.8)]" />
                            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Synced</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center w-full mt-12 mb-4">
                    {/* STATE 1: IDLE */}
                    {state === 'idle' && (
                        <div className="flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-300">
                            <button 
                                onClick={startRecording}
                                disabled={!isToday}
                                className="relative group disabled:opacity-50"
                            >
                                <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl group-hover:bg-secondary/40 transition-all duration-500 group-hover:scale-125"></div>
                                <div className="absolute inset-0 bg-secondary/40 rounded-full animate-ping opacity-20"></div>
                                <div className="relative w-24 h-24 rounded-full bg-secondary shadow-[0_0_40px_rgba(var(--c-secondary)/0.6)] flex items-center justify-center text-on-secondary transform group-hover:scale-105 transition-transform">
                                    <Mic className="w-10 h-10" />
                                </div>
                            </button>
                            <span className="text-on-surface-variant font-bold text-sm tracking-wide">
                                {isToday ? "Tap to start speaking" : "Cannot log past days"}
                            </span>
                        </div>
                    )}

                    {/* STATE 2: RECORDING */}
                    {state === 'recording' && (
                        <div className="flex flex-col items-center justify-center gap-8 w-full animate-in fade-in zoom-in duration-300">
                            {/* Animated Waveform */}
                            <div className="flex items-center justify-center gap-1.5 h-16 w-full max-w-sm">
                                {Array.from({ length: 40 }).map((_, i) => (
                                    <div 
                                        key={i} 
                                        className="w-1.5 bg-secondary rounded-full animate-waveform shadow-[0_0_10px_rgba(var(--c-secondary)/0.5)]"
                                        style={{ 
                                            height: `${Math.max(10, Math.random() * 100)}%`,
                                            animationDelay: `${i * 0.05}s` 
                                        }}
                                    />
                                ))}
                            </div>
                            
                            {/* Live Transcript below waveform */}
                            <div className="text-center w-full max-w-xl mx-auto px-4">
                                <p className="text-lg md:text-xl font-medium text-on-surface leading-relaxed min-h-[60px] opacity-90 transition-all">
                                    {rawTranscript || "Listening..."}
                                </p>
                            </div>

                            <button 
                                onClick={() => stopRecording(true)}
                                className="mt-4 px-8 py-4 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 flex items-center gap-2 font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                            >
                                <Square className="w-4 h-4 fill-current" /> Stop Recording
                            </button>
                        </div>
                    )}

                    {/* STATE 3: PROCESSING */}
                    {state === 'processing' && (
                        <div className="flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-300">
                            <div className="w-20 h-20 rounded-full bg-surface-container-high border border-surface-variant flex items-center justify-center shadow-inner relative">
                                <Sparkles className="w-8 h-8 text-secondary animate-pulse" />
                                <div className="absolute inset-0 rounded-full border-2 border-secondary/30 border-t-secondary animate-spin"></div>
                            </div>
                            <span className="text-on-surface-variant font-bold text-sm tracking-wide">
                                Ava is writing your entry...
                            </span>
                        </div>
                    )}

                    {/* STATE 4: DONE or VIEWING */}
                    {(state === 'done' || state === 'viewing') && (
                        <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Side-by-Side Cards (Stack on mobile) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                
                                {/* Ava's Summary */}
                                <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-5 flex flex-col">
                                    <div className="flex items-center gap-2 mb-3 text-secondary">
                                        <Sparkles className="w-4 h-4" />
                                        <h3 className="text-xs font-bold uppercase tracking-wider">Ava's Summary</h3>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed text-on-surface whitespace-pre-wrap flex-1">
                                        {avaSummary}
                                    </p>
                                </div>

                                {/* Your Words */}
                                <div className="bg-surface-container-low border border-surface-variant rounded-2xl p-5 flex flex-col">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Your Words</h3>
                                        <button 
                                            onClick={() => setIsEditing(!isEditing)}
                                            className="flex items-center gap-1.5 text-secondary hover:text-secondary-fixed transition-colors text-xs font-bold"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" /> {isEditing ? 'Done' : 'Edit'}
                                        </button>
                                    </div>
                                    
                                    {isEditing ? (
                                        <textarea
                                            value={rawTranscript}
                                            onChange={(e) => setRawTranscript(e.target.value)}
                                            className="w-full flex-1 min-h-[100px] bg-surface-container border border-surface-variant rounded-xl p-3 text-sm font-medium text-on-surface focus:outline-none focus:border-secondary transition-colors resize-none custom-scrollbar"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium leading-relaxed text-on-surface/80 whitespace-pre-wrap flex-1 overflow-y-auto max-h-[150px] custom-scrollbar">
                                            {rawTranscript}
                                        </p>
                                    )}
                                    <div className="text-[10px] font-bold text-on-surface-variant/60 mt-3 text-right">
                                        {wordCount} words
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 w-full max-w-md mx-auto pt-2">
                                <button 
                                    onClick={startRecording}
                                    className="flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" /> Re-record
                                </button>
                                {state === 'done' && (
                                    <button 
                                        onClick={handleSave}
                                        className="flex-[2] py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-secondary text-on-secondary hover:bg-secondary-fixed transition-colors shadow-lg shadow-secondary/20"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Save Entry
                                    </button>
                                )}
                                {state === 'viewing' && (
                                    <button 
                                        onClick={() => processWithAva(rawTranscript)}
                                        disabled={!rawTranscript.trim()}
                                        className="flex-[2] py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30 transition-colors"
                                    >
                                        <Sparkles className="w-4 h-4" /> Re-Analyze
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent History Logs */}
            {historyLogs.length > 0 && (
                <div className="glass-card-premium p-6 rounded-[2rem] shadow-sm flex flex-col gap-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                        <History size={18} className="text-secondary" /> Recent Journals
                    </h3>
                    <div className="flex flex-col gap-3">
                        {historyLogs.map(log => (
                            <div key={log.date} className="bg-surface-container border border-surface-variant/50 rounded-2xl p-4 flex flex-col gap-1.5 relative overflow-hidden group hover:border-secondary/30 transition-colors">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary/50 rounded-l-2xl"></div>
                                <h4 className="font-bold text-on-surface text-xs tracking-wider uppercase ml-2 opacity-80">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric'})}</h4>
                                {log.reflection && (
                                    <p className="text-sm text-on-surface line-clamp-2 ml-2 leading-relaxed font-medium">
                                        {log.reflection}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
