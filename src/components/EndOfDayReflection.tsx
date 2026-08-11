'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, CheckCircle2, Sparkles, Loader2, Edit3, RefreshCw, History } from 'lucide-react';
import { useDate } from '@/contexts/DateContext';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';

type JournalState = 'idle' | 'recording' | 'editing' | 'processing' | 'viewing';

export default function EndOfDayReflection() {
    const { selectedDate, isToday } = useDate();
    const { user } = useAuth();

    const [state, setState] = useState<JournalState>('idle');
    const [rawTranscript, setRawTranscript] = useState('');
    const [avaSummary, setAvaSummary] = useState('');
    const [elapsed, setElapsed] = useState(0);
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);

    const recognitionRef = useRef<any>(null);
    const finalRef = useRef('');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

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
            
            const { data } = await supabase
                .from('daily_logs')
                .select('reflection, raw_transcript')
                .eq('user_id', user.id)
                .eq('date', selectedDate)
                .single();

            if (isMounted && data && data.reflection) {
                // Handle legacy JSON strings
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
                    raw_transcript: rawTranscript,
                    reflection: summary,
                    sleep_hours: existingLog?.sleep_hours || 0,
                }, { onConflict: 'user_id,date' });
                
                if (error) throw error;
                window.dispatchEvent(new Event('workout_os_reflection_saved'));
                fetchHistory();
            }

            setState('viewing');
        } catch (e: any) {
            alert('Error: ' + e.message);
            setState(rawTranscript ? 'idle' : 'viewing');
        }
    };

    const wordCount = rawTranscript.trim() ? rawTranscript.trim().split(/\s+/).length : 0;

    return (
        <div className="flex flex-col gap-8">
            {/* Main Daily Journal Card */}
            <div className="bg-[#0f0f11] dark:bg-[#0f0f11] bg-white border border-surface-variant p-6 rounded-[2rem] shadow-xl flex flex-col gap-6 relative">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-black text-on-surface-variant uppercase tracking-widest mb-1">Daily Journal</h2>
                        <span className="text-xs font-semibold text-on-surface-variant/70">
                            {state === 'recording' ? 'Recording...' :
                             state === 'processing' ? 'Analyzing entry...' :
                             state === 'viewing' ? 'Entry recorded' : 'Ready to record'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={clsx("w-2 h-2 rounded-full", 
                            state === 'recording' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" :
                            state === 'processing' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" :
                            state === 'viewing' ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" :
                            "bg-surface-variant"
                        )} />
                        <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                            {state === 'viewing' ? 'Synced' : state === 'recording' ? 'Live' : 'Local'}
                        </span>
                    </div>
                </div>

                {/* Your Words */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Your Words</h3>
                        {(state === 'idle' || state === 'viewing' || state === 'editing') && (
                            <button 
                                onClick={() => setState(state === 'editing' ? (rawTranscript ? 'idle' : 'viewing') : 'editing')}
                                className="flex items-center gap-1.5 text-blue-500 hover:text-blue-400 transition-colors text-sm font-bold"
                            >
                                <Edit3 className="w-4 h-4" /> {state === 'editing' ? 'Done' : 'Edit'}
                            </button>
                        )}
                    </div>

                    <div className="bg-[#161618] dark:bg-[#161618] bg-gray-50 border border-surface-variant/50 rounded-[1.25rem] p-5 min-h-[200px] flex flex-col relative transition-all">
                        {state === 'recording' && !rawTranscript ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant gap-4">
                                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
                                    <Mic className="w-8 h-8 text-red-500" />
                                </div>
                                <span className="font-bold text-sm">Listening...</span>
                            </div>
                        ) : (
                            <textarea
                                value={rawTranscript}
                                onChange={(e) => setRawTranscript(e.target.value)}
                                disabled={state !== 'editing' && state !== 'recording'}
                                placeholder={state === 'recording' ? "Listening..." : "What happened today?"}
                                className="w-full h-full min-h-[160px] bg-transparent text-on-surface focus:outline-none resize-none font-medium text-[15px] leading-relaxed disabled:opacity-100 placeholder:text-on-surface-variant/50"
                            />
                        )}
                    </div>
                    
                    <div className="text-xs font-semibold text-on-surface-variant/60 px-2">{wordCount} words</div>
                </div>

                {/* Action Buttons */}
                {state !== 'processing' && state !== 'viewing' && (
                    <div className="flex gap-4 mt-2">
                        {state === 'recording' ? (
                            <button 
                                onClick={stopRecording}
                                className="flex-1 py-4 rounded-[1.25rem] font-bold flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                            >
                                <MicOff className="w-5 h-5" /> Stop ({Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')})
                            </button>
                        ) : (
                            <>
                                {rawTranscript ? (
                                    <button 
                                        onClick={startRecording}
                                        className="px-6 py-4 rounded-[1.25rem] font-bold flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                                    >
                                        <RefreshCw className="w-5 h-5" /> Re-record
                                    </button>
                                ) : (
                                    <button 
                                        onClick={startRecording}
                                        disabled={!isToday}
                                        className="flex-1 py-4 rounded-[1.25rem] font-bold flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors disabled:opacity-50"
                                    >
                                        <Mic className="w-5 h-5" /> Start Journal
                                    </button>
                                )}

                                {rawTranscript && (
                                    <button 
                                        onClick={handleReflect}
                                        className="flex-1 py-4 rounded-[1.25rem] font-bold flex items-center justify-center gap-2 bg-[#1a75ff] text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                                    >
                                        <CheckCircle2 className="w-5 h-5" /> Save Entry
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {state === 'processing' && (
                    <div className="mt-2 py-4 rounded-[1.25rem] font-bold flex items-center justify-center gap-2 bg-surface-container text-on-surface">
                        <Loader2 className="w-5 h-5 animate-spin" /> Analyzing Entry...
                    </div>
                )}
                
                {/* Ava's Analysis - shown when viewing if available */}
                {state === 'viewing' && avaSummary && (
                    <div className="mt-4 pt-6 border-t border-surface-variant">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Ava's Insights
                        </h3>
                        <p className="text-sm font-medium leading-relaxed text-on-surface whitespace-pre-wrap">{avaSummary}</p>
                    </div>
                )}
            </div>

            {/* Recent History Logs */}
            {historyLogs.length > 0 && (
                <div className="bg-surface-container-lowest border border-surface-variant p-6 rounded-[2rem] shadow-sm flex flex-col gap-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                        <History size={18} className="text-on-surface-variant" /> Recent Logs
                    </h3>
                    <div className="flex flex-col gap-4">
                        {historyLogs.map(log => (
                            <div key={log.date} className="bg-surface-container border border-surface-variant/50 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/50 rounded-l-2xl"></div>
                                <h4 className="font-bold text-on-surface text-sm ml-2">{log.date}</h4>
                                {log.raw_transcript && (
                                    <p className="text-xs text-on-surface-variant line-clamp-2 ml-2 leading-relaxed">
                                        "{log.raw_transcript}"
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
