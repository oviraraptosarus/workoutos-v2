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
    const [isEditingTranscript, setIsEditingTranscript] = useState(false);
    const [isEditingSummary, setIsEditingSummary] = useState(false);
    const [showSavePrompt, setShowSavePrompt] = useState(false);
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<any>(null);

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
            .limit(365);
        if (data) setHistoryLogs(data);
    };

    useEffect(() => {
        let isMounted = true;
        const fetchReflection = async () => {
            if (!user) return;
            setState('idle');
            setRawTranscript('');
            setAvaSummary('');
            setIsEditingTranscript(false);
            setIsEditingSummary(false);
            setShowSavePrompt(false);

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
                    } catch (e) { }
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
        setIsEditingTranscript(false);
        setIsEditingSummary(false);
        setShowSavePrompt(false);

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

    const handleSave = async (format: 'ava' | 'raw') => {
        if (!user || !rawTranscript.trim() || !avaSummary.trim()) return;

        try {
            const dateKey = selectedDate;
            const { data: existingLog } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', dateKey)
                .single();

            const timeString = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const newReflection = format === 'ava' ? avaSummary : rawTranscript;
            const newRaw = format === 'ava' ? rawTranscript : null;

            let finalReflection = newReflection;
            let finalRaw = newRaw;

            // If we just recorded a new entry ('done' state), append it to the existing log for the day
            if (state === 'done' && existingLog?.reflection) {
                finalReflection = `${existingLog.reflection}\n\n[${timeString}]\n${newReflection}`;
                
                if (newRaw && existingLog?.raw_transcript) {
                    finalRaw = `${existingLog.raw_transcript}\n\n[${timeString}]\n${newRaw}`;
                } else if (!newRaw && existingLog?.raw_transcript) {
                    finalRaw = existingLog.raw_transcript;
                }
            } else if (state === 'done' && !existingLog?.reflection) {
                finalReflection = `[${timeString}]\n${newReflection}`;
                if (newRaw) finalRaw = `[${timeString}]\n${newRaw}`;
            }

            const { error } = await supabase.from('daily_logs').upsert({
                id: existingLog?.id,
                user_id: user.id,
                date: dateKey,
                raw_transcript: finalRaw,
                reflection: finalReflection,
                sleep_hours: existingLog?.sleep_hours || 0,
            }, { onConflict: 'user_id,date' });

            if (error) throw error;

            window.dispatchEvent(new Event('workout_os_reflection_saved'));
            fetchHistory();
            setState('viewing');
            setIsEditingTranscript(false);
            setIsEditingSummary(false);
            setShowSavePrompt(false);
        } catch (e: any) {
            alert('Error saving reflection: ' + e.message);
        }
    };

    const handleDeleteLog = async (dateToDelete: string) => {
        if (!user) return;
        if (!confirm('Are you sure you want to delete this journal entry?')) return;

        try {
            const { error } = await supabase.from('daily_logs').update({
                raw_transcript: null,
                reflection: null,
            }).eq('user_id', user.id).eq('date', dateToDelete);

            if (error) throw error;

            if (dateToDelete === selectedDate) {
                setState('idle');
                setRawTranscript('');
                setAvaSummary('');
                setIsEditingTranscript(false);
                setIsEditingSummary(false);
            }

            fetchHistory();
            window.dispatchEvent(new Event('workout_os_reflection_saved'));
        } catch (e: any) {
            alert('Error deleting: ' + e.message);
        }
    };

    const wordCount = rawTranscript.trim() ? rawTranscript.trim().split(/\s+/).length : 0;

    const groupedLogs = historyLogs.reduce((acc, log) => {
        const dateObj = new Date(log.date);
        const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(log);
        return acc;
    }, {} as Record<string, any[]>);
    const monthKeys = Object.keys(groupedLogs);
    
    useEffect(() => {
        if (monthKeys.length > 0 && !expandedMonth) {
            setExpandedMonth(monthKeys[0]);
        }
    }, [monthKeys, expandedMonth]);

    return (
        <div className="flex flex-col gap-6">
            <div className="glass-card-premium p-5 sm:p-6 relative flex flex-col gap-4 transition-all duration-500">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest">
                        Daily Journal
                    </h2>
                    {state === 'viewing' && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(var(--c-secondary)/0.8)]" />
                            <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">Synced</span>
                        </div>
                    )}
                </div>

                {/* States */}
                <div className="flex flex-col items-center justify-center w-full">

                    {/* STATE 1: IDLE */}
                    {state === 'idle' && (
                        <div className="flex flex-col items-center justify-center gap-5 py-6 animate-in fade-in zoom-in duration-300">
                            <button
                                onClick={startRecording}
                                disabled={!isToday}
                                className="relative group disabled:opacity-50"
                            >
                                <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl group-hover:bg-secondary/40 transition-all duration-500 group-hover:scale-125"></div>
                                <div className="absolute inset-0 bg-secondary/40 rounded-full animate-ping opacity-20"></div>
                                <div className="relative w-20 h-20 rounded-full bg-secondary shadow-[0_0_40px_rgba(var(--c-secondary)/0.6)] flex items-center justify-center text-on-secondary transform group-hover:scale-105 transition-transform">
                                    <Mic className="w-8 h-8" />
                                </div>
                            </button>
                            <span className="text-on-surface-variant font-bold text-xs tracking-wide">
                                {isToday ? "Tap to start speaking" : "Cannot log past days"}
                            </span>
                        </div>
                    )}

                    {/* STATE 2: RECORDING */}
                    {state === 'recording' && (
                        <div className="flex flex-col items-center justify-center gap-5 w-full py-4 animate-in fade-in zoom-in duration-300">
                            {/* Animated Waveform */}
                            <div className="flex items-center justify-center gap-1 h-10 w-full max-w-xs">
                                {Array.from({ length: 32 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-1 bg-secondary rounded-full animate-waveform shadow-[0_0_8px_rgba(var(--c-secondary)/0.5)]"
                                        style={{
                                            height: `${Math.max(10, Math.random() * 100)}%`,
                                            animationDelay: `${i * 0.05}s`
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Live Transcript */}
                            <div className="text-center w-full max-w-xl mx-auto px-4">
                                <p className="text-sm font-medium text-on-surface/80 leading-relaxed min-h-[40px] transition-all">
                                    {rawTranscript || "Listening..."}
                                </p>
                            </div>

                            <button
                                onClick={() => stopRecording(true)}
                                className="px-6 py-3 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 flex items-center gap-2 font-bold text-sm tracking-wide transition-all"
                            >
                                <Square className="w-3.5 h-3.5 fill-current" /> Stop
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
                        <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Ava's Summary — single clean card */}
                            <div className="bg-secondary/10 border border-secondary/20 rounded-2xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                                    <div className="flex items-center gap-1.5 text-secondary">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">Ava's Summary</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (isEditingSummary) {
                                                setIsEditingSummary(false);
                                                if (state === 'viewing') setShowSavePrompt(true);
                                            } else {
                                                setIsEditingSummary(true);
                                            }
                                        }}
                                        className="text-secondary text-[11px] font-bold hover:opacity-70 transition-opacity"
                                    >
                                        {isEditingSummary ? 'Done' : 'Edit'}
                                    </button>
                                </div>
                                <div className="px-4 pb-4">
                                    {isEditingSummary ? (
                                        <textarea
                                            value={avaSummary}
                                            onChange={(e) => setAvaSummary(e.target.value)}
                                            className="w-full min-h-[100px] bg-white/5 border border-secondary/20 rounded-xl p-3 text-sm font-medium text-on-surface focus:outline-none focus:border-secondary transition-colors resize-none custom-scrollbar"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium leading-relaxed text-on-surface line-clamp-4">
                                            {avaSummary}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Your Words — collapsed by default */}
                            {rawTranscript.trim() && (
                                <div className="bg-surface-container-low border border-surface-variant/40 rounded-2xl overflow-hidden">
                                    <button
                                        onClick={() => setIsEditingTranscript(prev => !prev)}
                                        className="w-full flex items-center justify-between px-4 py-3 focus:outline-none hover:bg-white/5 transition-colors"
                                    >
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Your Words</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-on-surface-variant/60 font-semibold">{wordCount}w</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-on-surface-variant transition-transform duration-300 ${isEditingTranscript ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        </div>
                                    </button>
                                    <div className={`grid transition-all duration-400 ease-in-out ${isEditingTranscript ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-medium leading-relaxed text-on-surface/75 whitespace-pre-wrap px-4 pb-4">
                                                {rawTranscript}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Compact action row */}
                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    onClick={startRecording}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-surface-container-high hover:bg-surface-variant text-on-surface transition-all active:scale-95"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" /> Re-record
                                </button>

                                {state === 'done' ? (
                                    <button
                                        onClick={() => setShowSavePrompt(true)}
                                        className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-[#0a84ff] text-white hover:bg-[#007aff] transition-all shadow-md active:scale-95 ml-auto"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Save Entry
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 ml-auto">
                                        <button
                                            onClick={() => processWithAva(rawTranscript)}
                                            disabled={!rawTranscript.trim()}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-secondary/15 text-secondary hover:bg-secondary/25 transition-all active:scale-95 disabled:opacity-40"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" /> Re-Analyze
                                        </button>
                                        {(isEditingSummary) && (
                                            <button
                                                onClick={() => setShowSavePrompt(true)}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#0a84ff] text-white hover:bg-[#007aff] transition-all shadow-md active:scale-95"
                                            >
                                                Save Edits
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Save Prompt Overlay */}
                            {showSavePrompt && (
                                <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
                                    <h3 className="text-lg font-black text-on-surface mb-1 tracking-tight">Save Journal Entry</h3>
                                    <p className="text-on-surface-variant text-xs font-medium mb-6 text-center max-w-[220px]">
                                        Which version would you like to keep?
                                    </p>
                                    <div className="flex flex-col gap-2.5 w-full max-w-[220px]">
                                        <button
                                            onClick={() => handleSave('ava')}
                                            className="w-full py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 bg-secondary text-on-secondary hover:bg-secondary-fixed transition-all active:scale-[0.98] shadow-md"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" /> Ava's Summary
                                        </button>
                                        <button
                                            onClick={() => handleSave('raw')}
                                            className="w-full py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 bg-surface-container-high text-on-surface hover:bg-surface-variant transition-all active:scale-[0.98]"
                                        >
                                            My Words
                                        </button>
                                        <button
                                            onClick={() => setShowSavePrompt(false)}
                                            className="w-full py-2.5 mt-1 rounded-full font-bold text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent History Logs */}
            {historyLogs.length > 0 && (
                <div className="flex flex-col gap-4 mt-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2 pl-2">
                        <History size={16} className="text-secondary" /> Journal Archive
                    </h3>
                    <div className="flex flex-col gap-3">
                        {monthKeys.map((month) => {
                            const isExpanded = expandedMonth === month;
                            const logs = groupedLogs[month];
                            return (
                                <div key={month} className="glass-card-premium rounded-[2rem] overflow-hidden shadow-sm flex flex-col transition-all duration-300">
                                    <button 
                                        onClick={() => setExpandedMonth(isExpanded ? null : month)}
                                        className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-white/5 transition-colors focus:outline-none group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-bold text-on-surface text-sm sm:text-base group-hover:text-secondary transition-colors">{month}</h4>
                                            <span className="bg-surface-variant/50 text-on-surface-variant px-2 py-0.5 rounded-full text-xs font-bold">{logs.length}</span>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-on-surface-variant transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </button>
                                    
                                    <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <div className="flex flex-col gap-3 px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
                                                {logs.map((log: any) => {
                                                    return (
                                                        <button
                                                            key={log.date} 
                                                            onClick={() => setSelectedLog(log)}
                                                            className="bg-surface-container-low border border-surface-variant/30 rounded-2xl overflow-hidden relative group/log hover:border-secondary/40 transition-all text-left w-full flex flex-col hover:shadow-md"
                                                        >
                                                            {/* Header row */}
                                                            <div className="w-full flex items-center justify-between p-4 sm:p-5 pb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary/70 shadow-[0_0_8px_rgba(var(--c-secondary)/0.5)]"></div>
                                                                    <h5 className="font-bold text-on-surface text-[11px] sm:text-xs tracking-wider uppercase opacity-80">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h5>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <div
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.date); }}
                                                                        className="text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 rounded-full p-1.5 transition-all opacity-0 group-hover/log:opacity-100 cursor-pointer"
                                                                        title="Delete Journal"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Preview body */}
                                                            {log.reflection && (
                                                                <p className="text-sm text-on-surface/70 ml-3.5 leading-relaxed font-medium px-4 pb-4 sm:px-5 sm:pb-5 line-clamp-3">
                                                                    {log.reflection}
                                                                </p>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Apple-style Full Log Modal (Bottom Sheet on Mobile) */}
            {selectedLog && (
                <div className="fixed inset-0 z-[99999] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedLog(null)}></div>
                    <div className="bg-surface-container border border-surface-variant rounded-t-[2rem] sm:rounded-[2rem] shadow-[0_-10px_50px_rgba(0,0,0,0.5)] sm:shadow-2xl w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col relative z-10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 ease-out">
                        {/* Drag Handle for Mobile */}
                        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-12 h-1.5 bg-surface-variant rounded-full opacity-50"></div>
                        </div>
                        
                        <div className="flex items-center justify-between px-6 pb-4 pt-2 sm:pt-6 border-b border-surface-variant/50">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(var(--c-secondary)/0.8)]" />
                                <h2 className="text-sm font-black text-on-surface-variant uppercase tracking-widest">
                                    {new Date(selectedLog.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-all active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 pb-safe">
                            <div className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-on-surface/90">
                                {selectedLog.reflection}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
