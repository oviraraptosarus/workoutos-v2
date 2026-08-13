'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, BrainCircuit, Loader2, Check, CheckSquare, Square, Lightbulb, History, Copy, Share, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';

type BrainState = 'idle' | 'recording' | 'processing' | 'selecting' | 'done';

export default function BrainDump({ onTasksSaved }: { onTasksSaved?: () => void }) {
    const { user } = useAuth();
    const [state, setState] = useState<BrainState>('idle');
    const [transcript, setTranscript] = useState('');
    const [parsedTasks, setParsedTasks] = useState<string[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [summary, setSummary] = useState('');
    const [saveSummary, setSaveSummary] = useState(true);
    const [elapsed, setElapsed] = useState(0);
    
    // Archive States
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

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
            .from('brain_readings')
            .select('id, content, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(365);
        if (data) setHistoryLogs(data);
    };

    useEffect(() => {
        fetchHistory();
    }, [user]);

    const handleDeleteLog = async (idToDelete: string) => {
        if (!user) return;
        if (!confirm('Are you sure you want to delete this brain dump?')) return;
        try {
            const { error } = await supabase.from('brain_readings').delete().eq('id', idToDelete);
            if (error) throw error;
            fetchHistory();
        } catch (e: any) {
            alert('Error deleting: ' + e.message);
        }
    };

    const handleCopyLog = () => {
        if (!selectedLog) return;
        navigator.clipboard.writeText(selectedLog.content || '');
        alert('Copied to clipboard');
    };

    const handleShareLog = async () => {
        if (!selectedLog) return;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Brain Dump Archive',
                    text: selectedLog.content || ''
                });
            } catch (e) {
                console.log('Share canceled or failed', e);
            }
        } else {
            handleCopyLog();
        }
    };

    const startRecording = () => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) {
            alert('Speech recognition is not supported in this browser. Please use Chrome or Safari.');
            return;
        }

        finalRef.current = '';
        setTranscript('');
        setParsedTasks([]);
        setSelectedIndices(new Set());
        setSummary('');
        setSaveSummary(true);
        setElapsed(0);

        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        const isAndroid = /Android/i.test(navigator.userAgent);

        recognition.onresult = (e: any) => {
            let full = '';
            
            if (isAndroid) {
                const currentSessionText = e.results[e.results.length - 1][0].transcript;
                full = (finalRef.current + ' ' + currentSessionText).trim();
            } else {
                let interim = '';
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    const chunk = e.results[i][0].transcript;
                    if (e.results[i].isFinal) finalRef.current += chunk + ' ';
                    else interim = chunk;
                }
                full = (finalRef.current + interim).trim();
            }
            
            setTranscript(full);
        };

        recognition.onerror = (e: any) => {
            if (e.error !== 'aborted') alert('Microphone error: ' + e.error);
            stopRecording();
        };

        recognition.onend = () => {
            if (isAndroid && transcript.trim()) {
                finalRef.current = transcript;
            }
            stopRecording();
        };

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

    const processText = async (textToProcess: string) => {
        if (!textToProcess.trim()) return;
        setState('processing');
        try {
            const res = await fetch('/api/ai/brain-dump', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rawTranscript: textToProcess })
            });
            const data = await res.json();
            const hasTasks = data.tasks && data.tasks.length > 0;
            const hasSummary = !!data.summary;
            
            if (hasTasks || hasSummary) {
                setParsedTasks(data.tasks || []);
                // By default, tasks are UNCHECKED so the user only adds them if they want to
                setSelectedIndices(new Set());
                
                setSummary(data.summary || '');
                setSaveSummary(true);
                
                setState('selecting');
            } else {
                alert("No actionable tasks or insights found.");
                setState('idle');
            }
        } catch (e: any) {
            alert('Error parsing brain dump: ' + e.message);
            setState('idle');
        }
    };

    const handleParse = async () => {
        await processText(transcript);
    };

    useEffect(() => {
        const pendingDump = localStorage.getItem('pending_brain_dump');
        if (pendingDump) {
            localStorage.removeItem('pending_brain_dump');
            setTranscript(pendingDump);
            processText(pendingDump);
        }
    }, []);

    const toggleTaskSelection = (index: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) newSet.delete(index);
        else newSet.add(index);
        setSelectedIndices(newSet);
    };

    const handleSaveTasks = async () => {
        if (!user || (selectedIndices.size === 0 && (!saveSummary || !summary))) return;
        
        setState('processing');
        const todayStr = new Date().toLocaleDateString('en-CA');
        let hasError = false;
        
        if (selectedIndices.size > 0) {
            const tasksToInsert = Array.from(selectedIndices).map(idx => ({
                user_id: user.id,
                title: parsedTasks[idx],
                priority: 'medium',
                completed: false,
                date: todayStr
            }));
            const { error } = await supabase.from('tasks').insert(tasksToInsert);
            if (error) {
                alert('Failed to save tasks: ' + error.message);
                hasError = true;
            }
        }
        
        if (saveSummary && summary) {
            const { error } = await supabase.from('brain_readings').insert([{
                user_id: user.id,
                content: summary
            }]);
            if (error) {
                alert('Failed to save summary: ' + error.message);
                hasError = true;
            }
        }
        
        if (hasError) {
            setState('selecting');
        } else {
            fetchHistory();
            setState('done');
            setTimeout(() => {
                setState('idle');
                setTranscript('');
                setParsedTasks([]);
                setParsedReadings([]);
                if (onTasksSaved) onTasksSaved();
            }, 2000);
        }
    };

    const groupedLogs = historyLogs.reduce((acc, log) => {
        const dateObj = new Date(log.created_at);
        const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(log);
        return acc;
    }, {} as Record<string, any[]>);
    const monthKeys = Object.keys(groupedLogs);
    
    const hasExpandedInitialRef = useRef(false);
    
    useEffect(() => {
        if (monthKeys.length > 0 && !hasExpandedInitialRef.current) {
            setExpandedMonth(monthKeys[0]);
            hasExpandedInitialRef.current = true;
        }
    }, [monthKeys]);

    return (
        <div className="flex flex-col gap-6 w-full">

            <div className="flex items-center justify-between mb-1 px-1">
                <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                    <BrainCircuit size={20} className="text-[#0a84ff]" /> Brain Dump
                </h2>
            </div>
            <div className="glass-card-premium p-6 sm:p-8 flex flex-col gap-6 sm:gap-8 min-h-[400px] relative overflow-hidden group w-full">
            <p className="text-on-surface-variant text-sm sm:text-base font-medium leading-relaxed relative z-10 -mt-2 sm:-mt-4 mb-2">
                Use the Brain Dump when your mind is cluttered. Instead of manually organizing, just dump all your thoughts, ideas, or to-dos here (type or speak). Ava will analyze the chaos, extract the actionable tasks, and put them straight into your execution pipeline.
            </p>
            
            {state === 'selecting' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Summary Section */}
                    {summary && (
                        <div className="space-y-4 bg-white/5 dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-sm relative">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-label-sm text-sm font-semibold uppercase tracking-wider text-secondary flex items-center gap-2">
                                    <Lightbulb size={18} /> Brain Summary
                                </h3>
                                <button 
                                    onClick={() => setSaveSummary(!saveSummary)}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border",
                                        saveSummary ? "bg-activity-green/20 text-activity-green border-activity-green/30" : "bg-white/5 text-on-surface-variant border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    {saveSummary ? <Check size={14} /> : <Square size={14} />}
                                    Save to Archive
                                </button>
                            </div>
                            <div className="font-body-md text-sm text-on-surface/90 whitespace-pre-wrap leading-relaxed">
                                {summary}
                            </div>
                        </div>
                    )}

                    {/* Tasks Section */}
                    {parsedTasks.length > 0 && (
                        <div className="space-y-4 relative z-10">
                            <h3 className="font-label-sm text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2 px-1">
                                <CheckSquare size={18} /> Extracted Tasks
                            </h3>
                            <p className="text-xs text-on-surface-variant px-1 -mt-2 mb-2">Select the items you actually want to add as to-dos.</p>
                            <div className="space-y-3">
                                {parsedTasks.map((task, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => toggleTaskSelection(idx)}
                                        className={clsx(
                                            "group flex items-start gap-3 p-4 rounded-[1.2rem] border cursor-pointer transition-all duration-300",
                                            selectedIndices.has(idx) 
                                                ? "bg-primary/10 border-primary/30 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.15)]" 
                                                : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"
                                        )}
                                    >
                                        <div className={clsx(
                                            "mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                            selectedIndices.has(idx)
                                                ? "bg-primary border-primary text-on-primary"
                                                : "border-on-surface-variant/40 group-hover:border-on-surface text-transparent"
                                        )}>
                                            <Check size={14} />
                                        </div>
                                        <p className="font-body-md text-sm text-on-surface">{task}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={() => setState('idle')}
                            className="flex-1 py-3 rounded-xl border border-surface-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors"
                        >
                            Discard All
                        </button>
                        <button 
                            disabled={selectedIndices.size === 0 && (!saveSummary || !summary)}
                            onClick={handleSaveTasks}
                            className="px-6 py-4 rounded-full bg-primary text-on-primary font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <CheckSquare size={18} />
                            Save Selected
                        </button>
                    </div>
                </div>
            )}
            
            {state !== 'selecting' && (
                <div className="relative mb-4 z-10 flex-1 flex flex-col">
                    <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        disabled={state === 'recording' || state === 'processing' || state === 'done'}
                        placeholder="e.g., I need to buy groceries tomorrow, finish the TPS report, and email John about the project..."
                        className="w-full h-full min-h-[160px] bg-surface-container border border-surface-variant rounded-[1.25rem] p-6 pb-16 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary/50 transition-all shadow-inner backdrop-blur-md placeholder:text-on-surface-variant/50 font-body-md resize-none disabled:opacity-70"
                    />
                    
                    {state === 'done' ? (
                        <div className="absolute inset-0 bg-surface-container/80 backdrop-blur-sm rounded-[1.25rem] flex flex-col items-center justify-center text-secondary gap-3">
                            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                                <Check className="w-8 h-8" />
                            </div>
                            <span className="font-bold">Items Saved!</span>
                        </div>
                    ) : (
                        <button 
                            onClick={toggleRecording}
                            disabled={state === 'processing'}
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
            )}
            
            {state !== 'selecting' && state !== 'done' && (
                <button 
                    onClick={handleParse}
                    disabled={!transcript.trim() || state === 'recording' || state === 'processing'}
                    className="relative z-10 w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-secondary to-tertiary text-on-secondary shadow-[0_4px_16px_rgba(var(--c-secondary)/0.4)] hover:shadow-[0_8px_24px_rgba(var(--c-secondary)/0.6)] disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 mt-auto"
                >
                    {state === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                    {state === 'processing' ? 'Extracting Items...' : 'Parse & Execute'}
                </button>
            )}
            </div>

            {/* Recent History Logs */}
            {historyLogs.length > 0 && (
                <div className="flex flex-col gap-4 mt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2 pl-2">
                        <History size={16} className="text-secondary" /> Brain Dump Archive
                    </h3>
                    <div className="flex flex-col gap-3">
                        {monthKeys.map((month) => {
                            const isExpanded = expandedMonth === month;
                            const logs = groupedLogs[month];
                            return (
                                <div key={month} className="glass-card-premium rounded-[2rem] overflow-hidden shadow-sm flex flex-col transition-all duration-300 w-full">
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
                                                    const isLogExpanded = expandedLogId === log.id;
                                                    return (
                                                        <div
                                                            key={log.id} 
                                                            className="bg-surface-container-low border border-surface-variant/30 rounded-2xl overflow-hidden relative group/log transition-all w-full flex flex-col shadow-sm hover:border-surface-variant/60"
                                                        >
                                                            {/* Header row (Click to expand) */}
                                                            <button 
                                                                onClick={() => setExpandedLogId(isLogExpanded ? null : log.id)}
                                                                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/5 transition-colors focus:outline-none"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary/70 shadow-[0_0_8px_rgba(var(--c-secondary)/0.5)]"></div>
                                                                    <h5 className="font-bold text-on-surface text-[11px] sm:text-xs tracking-wider uppercase opacity-80">{new Date(log.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</h5>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <div
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.id); }}
                                                                        className="text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 rounded-full p-1.5 transition-all opacity-0 group-hover/log:opacity-100 cursor-pointer mr-1"
                                                                        title="Delete Brain Dump"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </div>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-on-surface-variant transition-transform duration-300 ${isLogExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                                </div>
                                                            </button>
                                                            
                                                            {/* Cascading Preview body */}
                                                            <div className={`grid transition-all duration-300 ease-in-out ${isLogExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                                                <div className="overflow-hidden">
                                                                    {log.content && (
                                                                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1">
                                                                            <p className="text-sm text-on-surface/70 ml-3.5 leading-relaxed font-medium line-clamp-3 text-left">
                                                                                {log.content}
                                                                            </p>
                                                                            <div className="flex justify-start ml-3.5 mt-3">
                                                                                <button 
                                                                                    onClick={() => setSelectedLog(log)} 
                                                                                    className="px-4 py-1.5 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 text-[11px] font-bold tracking-wide uppercase transition-colors"
                                                                                >
                                                                                    Read Full Entry
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
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
                <div className="fixed inset-0 z-[99999] flex flex-col justify-end sm:items-center sm:justify-center p-0 pb-[90px] pt-[70px] sm:p-6 sm:pb-6 sm:pt-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedLog(null)}></div>
                    <div className="bg-surface-container border border-surface-variant rounded-[2rem] overflow-hidden shadow-[0_-10px_50px_rgba(0,0,0,0.5)] sm:shadow-2xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[85vh] flex flex-col relative z-10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 ease-out">
                        {/* Drag Handle for Mobile */}
                        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-12 h-1.5 bg-surface-variant rounded-full opacity-50"></div>
                        </div>
                        
                        <div className="flex items-center justify-between px-5 pb-3 pt-2 sm:pt-5 border-b border-surface-variant/50">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(var(--c-secondary)/0.8)]" />
                                <h2 className="text-sm font-black text-on-surface-variant uppercase tracking-widest">
                                    {new Date(selectedLog.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-all active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        
                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 pb-safe relative">
                            <div className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-on-surface/90">
                                {selectedLog.content}
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="p-4 border-t border-surface-variant/50 flex items-center justify-between bg-surface-container-low pb-safe-offset-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopyLog}
                                    className="p-2.5 rounded-full bg-surface-variant/50 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all active:scale-95"
                                    title="Copy Text"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleShareLog}
                                    className="p-2.5 rounded-full bg-surface-variant/50 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all active:scale-95"
                                    title="Share"
                                >
                                    <Share className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    handleDeleteLog(selectedLog.id);
                                    setSelectedLog(null);
                                }}
                                className="px-4 py-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
