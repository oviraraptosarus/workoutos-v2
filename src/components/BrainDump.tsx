'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, BrainCircuit, Loader2, Check, CheckSquare, Square, Lightbulb } from 'lucide-react';
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

    const recognitionRef = useRef<any>(null);
    const finalRef = useRef('');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

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

    return (
        <div className="bg-surface-container-lowest border border-surface-variant p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col gap-6 sm:gap-8 min-h-[400px] relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
            
            <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[1rem] bg-secondary/20 flex items-center justify-center border border-secondary/30 text-secondary shadow-[0_0_20px_rgba(var(--c-secondary)/0.3)] backdrop-blur-md shrink-0">
                    <BrainCircuit className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-on-surface tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-on-surface to-on-surface-variant">Brain Dump</h2>
            </div>
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
                                    Save to Journal
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
    );
}
