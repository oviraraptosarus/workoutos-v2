'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, CheckCircle2, Sparkles, Loader2, Edit3, RefreshCw, History, Copy, Share, Trash2, AlignLeft, Download, PlayCircle } from 'lucide-react';
import { useDate } from '@/contexts/DateContext';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';

type JournalState = 'idle' | 'recording' | 'processing' | 'done' | 'viewing';

export default function EndOfDayReflection() {
    const { selectedDate, offsetDays, isToday } = useDate();
    const { user, userProfile } = useAuth();

    const [state, setState] = useState<JournalState>('idle');
    const [rawTranscript, setRawTranscript] = useState('');
    const [avaSummary, setAvaSummary] = useState('');
    const [isEditingTranscript, setIsEditingTranscript] = useState(false);
    const [isEditingSummary, setIsEditingSummary] = useState(false);
    const [showSavePrompt, setShowSavePrompt] = useState(false);
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [expandedLogDate, setExpandedLogDate] = useState<string | null>(null);
    const [modalTab, setModalTab] = useState<'summary' | 'raw'>('summary');
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
    const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isEditingModal, setIsEditingModal] = useState(false);
    const [modalEditText, setModalEditText] = useState('');

    const handleCopyLog = () => {
        if (!selectedLog) return;
        const text = modalTab === 'summary' ? selectedLog.reflection : selectedLog.raw_transcript;
        navigator.clipboard.writeText(text || '');
        alert('Copied to clipboard');
    };

    const handleShareLog = async () => {
        if (!selectedLog) return;
        const text = modalTab === 'summary' ? selectedLog.reflection : selectedLog.raw_transcript;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Journal Entry',
                    text: text || ''
                });
            } catch (e) {
                console.log('Share canceled or failed', e);
            }
        } else {
            handleCopyLog();
        }
    };

    const recognitionRef = useRef<any>(null);
    const finalRef = useRef('');
    const isRecordingRef = useRef(false);  // source of truth for "should I be recording?"
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [waveformBars, setWaveformBars] = useState<number[]>(Array(40).fill(4));

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
        const init = async () => {
            if (!user) return;
            setState('idle');
            setRawTranscript('');
            setAvaSummary('');
            setIsEditingTranscript(false);
            setIsEditingSummary(false);
            setShowSavePrompt(false);
            setIsSummaryExpanded(true);
            setIsTranscriptExpanded(false);
        };
        init();
        fetchHistory();
        return () => { isMounted = false; };
    }, [user, selectedDate]);

    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
        };
    }, []);

    const startRecording = async () => {
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
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
            setAudioBlob(null);
        }

        const isAndroid = /Android/i.test(navigator.userAgent);
        let currentSessionText = '';
        let sessionCounter = 0;
        let eventCounter = 0;
        let currentSessionId = 0;

        let sessionTimer: NodeJS.Timeout;

        const spawnRecognition = () => {
            sessionCounter++;
            currentSessionId = sessionCounter;
            if (process.env.NODE_ENV === 'development') {
                console.log(`[DICTATION START] session=${currentSessionId}`);
            }
            
            if (recognitionRef.current) {
                recognitionRef.current.onresult = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onend = null;
                try { recognitionRef.current.abort(); } catch(e) {}
            }

            const recognition = new SR();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = userProfile?.dictation_language || 'en-US';

            // Force a clean restart every 45 seconds to bypass browser memory/length limits on continuous dictation
            if (!isAndroid) {
                clearTimeout(sessionTimer);
                sessionTimer = setTimeout(() => {
                    if (isRecordingRef.current && recognitionRef.current === recognition) {
                        try { recognition.stop(); } catch(e) {}
                    }
                }, 45000);
            }

            recognition.onresult = (e: any) => {
                let newFull = '';
                
                if (isAndroid) {
                    currentSessionText = e.results[e.results.length - 1][0].transcript;
                    newFull = (finalRef.current + ' ' + currentSessionText).trim();
                    setRawTranscript(newFull);
                } else {
                    let interim = '';
                    for (let i = e.resultIndex; i < e.results.length; i++) {
                        const chunk = e.results[i][0].transcript;
                        if (e.results[i].isFinal) finalRef.current += chunk + ' ';
                        else interim = chunk;
                    }
                    newFull = (finalRef.current + interim).trim();
                    setRawTranscript(newFull);
                }
            };

            recognition.onerror = (e: any) => {
                if (e.error === 'no-speech' || e.error === 'aborted') return; // handled by onend restart
                alert('Microphone error: ' + e.error);
                isRecordingRef.current = false;
                stopRecording(false);
            };

            // Platform-aware onend: Android needs to commit the last snapshot
            recognition.onend = () => {
                clearTimeout(sessionTimer);
                
                if (isAndroid && currentSessionText.trim()) {
                    finalRef.current = (finalRef.current + ' ' + currentSessionText).trim();
                    currentSessionText = '';
                    setRawTranscript(finalRef.current);
                }
                
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[DICTATION STOP] session=${currentSessionId}`);
                }
                
                // Respawn a totally fresh instance to avoid the "delay" timeout bugs and session memory limits
                if (isRecordingRef.current) {
                    setTimeout(() => {
                        if (isRecordingRef.current) {
                            try {
                                spawnRecognition();
                            } catch {}
                        }
                    }, 50);
                }
            };

            recognitionRef.current = recognition;
            try {
                recognition.start();
            } catch (err) {
                console.warn("Speech recognition start failed:", err);
            }
        };

        // 1. MUST start Web Speech API first on Android so it secures the microphone.
        spawnRecognition();

        // Immediately update UI so it never freezes even if getUserMedia hangs
        isRecordingRef.current = true;
        setState('recording');

        // 2. Safely attempt to get the raw stream for waveform and downloads.
        // On Android, this will intentionally fail (caught) because the mic is locked by dictation.
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (!isMobile) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                micStreamRef.current = stream;

                let options = { mimeType: 'audio/webm;codecs=opus' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: 'audio/mp4' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: '' };
                
                const recorder = new MediaRecorder(stream, options);
                mediaRecorderRef.current = recorder;
                audioChunksRef.current = [];
                
                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) audioChunksRef.current.push(e.data);
                };
                
                recorder.onstop = () => {
                    const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
                    setAudioBlob(blob);
                    setAudioUrl(URL.createObjectURL(blob));
                };
                
                recorder.start(100);

                const audioCtx = new AudioContext();
                audioContextRef.current = audioCtx;
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 128;
                analyserRef.current = analyser;
                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const BAR_COUNT = 40;

                const tick = () => {
                    analyser.getByteFrequencyData(dataArray);
                    const bucketSize = Math.floor(dataArray.length / BAR_COUNT);
                    const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
                        const slice = dataArray.slice(i * bucketSize, (i + 1) * bucketSize);
                        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
                        return Math.max(4, (avg / 255) * 100);
                    });
                    setWaveformBars(bars);
                    animationFrameRef.current = requestAnimationFrame(tick);
                };
                animationFrameRef.current = requestAnimationFrame(tick);
            } catch (err) {
                console.warn('Raw stream access blocked:', err);
                // Fallback to fake waveform so the UI still looks like it's recording
                let lastUpdate = 0;
                const animateFakeWaveform = (timestamp: number) => {
                    if (!isRecordingRef.current) return;
                    if (timestamp - lastUpdate > 100) {
                        setWaveformBars(Array.from({ length: 40 }, () => Math.max(4, Math.random() * 60)));
                        lastUpdate = timestamp;
                    }
                    animationFrameRef.current = requestAnimationFrame(animateFakeWaveform);
                };
                animationFrameRef.current = requestAnimationFrame(animateFakeWaveform);
            }
        } else {
            // Mobile device: bypass getUserMedia completely to prevent crashing SpeechRecognition
            let lastUpdate = 0;
            const animateFakeWaveform = (timestamp: number) => {
                if (!isRecordingRef.current) return;
                if (timestamp - lastUpdate > 100) {
                    setWaveformBars(Array.from({ length: 40 }, () => Math.max(4, Math.random() * 60)));
                    lastUpdate = timestamp;
                }
                animationFrameRef.current = requestAnimationFrame(animateFakeWaveform);
            };
            animationFrameRef.current = requestAnimationFrame(animateFakeWaveform);
        }
    };

    const stopRecording = (shouldProcess: boolean = true) => {
        isRecordingRef.current = false;  // prevent auto-restart in onend
        recognitionRef.current?.stop();

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        // Tear down audio context and mic stream
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        audioContextRef.current?.close();
        
        // Wait a tiny bit for media recorder to finish before fully killing the tracks
        setTimeout(() => {
            micStreamRef.current?.getTracks().forEach(t => t.stop());
            micStreamRef.current = null;
        }, 500);

        audioContextRef.current = null;
        analyserRef.current = null;
        setWaveformBars(Array(40).fill(4));

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

            const timeString = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            
            let finalReflection = avaSummary;
            let finalRaw = rawTranscript;

            // If we just recorded a new entry ('done' state), append it to the existing log for the day
            if (state === 'done') {
                if (existingLog?.reflection) {
                    finalReflection = `${existingLog.reflection}\n\n[${timeString}]\n${avaSummary}`;
                } else {
                    finalReflection = `[${timeString}]\n${avaSummary}`;
                }

                if (existingLog?.raw_transcript) {
                    finalRaw = `${existingLog.raw_transcript}\n\n[${timeString}]\n${rawTranscript}`;
                } else {
                    finalRaw = `[${timeString}]\n${rawTranscript}`;
                }
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
            
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
                setAudioUrl(null);
                setAudioBlob(null);
            }

            setState('idle');
            setRawTranscript('');
            setAvaSummary('');
            setIsEditingTranscript(false);
            setIsEditingSummary(false);
            setShowSavePrompt(false);
            setIsSummaryExpanded(true);
            setIsTranscriptExpanded(false);
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

    const handleSavePastLog = async () => {
        if (!selectedLog) return;
        try {
            const updatePayload: any = {};
            if (modalTab === 'summary') {
                updatePayload.reflection = modalEditText;
            } else {
                updatePayload.raw_transcript = modalEditText;
            }

            const { error } = await supabase.from('daily_logs').update(updatePayload)
                .eq('id', selectedLog.id);

            if (error) throw error;

            setSelectedLog({ ...selectedLog, ...updatePayload });
            setIsEditingModal(false);
            fetchHistory();
            window.dispatchEvent(new Event('workout_os_reflection_saved'));
        } catch (e: any) {
            alert('Error updating entry: ' + e.message);
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
    
    const hasExpandedInitialRef = useRef(false);
    
    useEffect(() => {
        if (monthKeys.length > 0 && !hasExpandedInitialRef.current) {
            setExpandedMonth(monthKeys[0]);
            hasExpandedInitialRef.current = true;
        }
    }, [monthKeys]);

    return (
        <div className="flex flex-col gap-6">
            <div className="glass-card-premium p-5 sm:p-6 relative flex flex-col gap-4 transition-all duration-500">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest">
                        Daily Journal
                    </h2>
                </div>

                {/* States */}
                <div className="flex flex-col items-center justify-center w-full">

                    {/* STATE 1: IDLE */}
                    {state === 'idle' && (
                        <div className="flex flex-col items-center justify-center gap-5 py-6 animate-in fade-in zoom-in duration-300">
                            <button
                                onClick={startRecording}
                                disabled={offsetDays > 0}
                                className="relative group disabled:opacity-50"
                            >
                                <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl group-hover:bg-secondary/40 transition-all duration-500 group-hover:scale-125"></div>
                                <div className="absolute inset-0 bg-secondary/40 rounded-full animate-ping opacity-20"></div>
                                <div className="relative w-20 h-20 rounded-full bg-secondary shadow-[0_0_40px_rgba(var(--c-secondary)/0.6)] flex items-center justify-center text-on-secondary transform group-hover:scale-105 transition-transform">
                                    <Mic className="w-8 h-8" />
                                </div>
                            </button>
                            <span className="text-on-surface-variant font-bold text-xs tracking-wide">
                                {offsetDays > 0 ? "Cannot log future days" : "Tap to start speaking"}
                            </span>
                        </div>
                    )}

                    {/* STATE 2: RECORDING */}
                    {state === 'recording' && (
                        <div className="flex flex-col items-center justify-center gap-5 w-full py-4 animate-in fade-in zoom-in duration-300">
                            {/* Animated Waveform */}
                            <div className="flex items-center justify-center gap-[3px] h-14 w-full max-w-xs">
                                {waveformBars.map((h, i) => (
                                    <div
                                        key={i}
                                        className="w-1 bg-secondary rounded-full shadow-[0_0_6px_rgba(10,132,255,0.6)] transition-all"
                                        style={{
                                            height: `${h}%`,
                                            transitionDuration: '60ms',
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Live Transcript / Manual Typing */}
                            <div className="text-center w-full max-w-xl mx-auto px-4 relative group">
                                <textarea
                                    className="w-full bg-transparent text-sm font-medium text-on-surface/80 leading-relaxed min-h-[60px] text-center resize-none focus:outline-none focus:ring-0 placeholder:text-on-surface/30"
                                    value={rawTranscript}
                                    onFocus={() => {
                                        // Pause speech recognition if they tap to type
                                        isRecordingRef.current = false;
                                        if (recognitionRef.current) recognitionRef.current.stop();
                                        setWaveformBars(Array.from({ length: 40 }, () => 4));
                                    }}
                                    onChange={(e) => {
                                        setRawTranscript(e.target.value);
                                        finalRef.current = e.target.value;
                                    }}
                                    placeholder="Listening... or tap here to type manually"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => stopRecording(false)}
                                    className="px-5 py-3 rounded-full bg-surface-variant/30 text-on-surface-variant border border-surface-variant/40 hover:bg-surface-variant/50 flex items-center gap-2 font-bold text-sm tracking-wide transition-all active:scale-95"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" /> Restart
                                </button>
                                <button
                                    onClick={() => stopRecording(true)}
                                    className="px-6 py-3 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 flex items-center gap-2 font-bold text-sm tracking-wide transition-all active:scale-95"
                                >
                                    <Square className="w-3.5 h-3.5 fill-current" /> Stop
                                </button>
                            </div>
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

                    {/* STATE 4: DONE */}
                    {state === 'done' && (
                        <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Ava's Summary — Collapsible Accordion */}
                            <div className="bg-secondary/10 border border-secondary/20 rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => setIsSummaryExpanded(prev => !prev)}
                                    className="w-full flex items-center justify-between px-4 py-3 focus:outline-none hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-1.5 text-secondary">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">Ava's Summary</span>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-secondary transition-transform duration-300 ${isSummaryExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </button>
                                <div className={`grid transition-all duration-400 ease-in-out ${isSummaryExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className="overflow-hidden">
                                        <div className="px-4 pb-4">
                                            <div className="flex items-center justify-end gap-3 mb-2">
                                                <button
                                                    onClick={() => processWithAva(rawTranscript)}
                                                    disabled={!rawTranscript.trim()}
                                                    className="flex items-center gap-1 text-secondary text-[11px] font-bold hover:opacity-70 transition-opacity disabled:opacity-40"
                                                >
                                                    <RefreshCw className="w-3 h-3" /> Regenerate
                                                </button>
                                                <button
                                                    onClick={() => setIsEditingSummary(!isEditingSummary)}
                                                    className="text-secondary text-[11px] font-bold hover:opacity-70 transition-opacity"
                                                >
                                                    {isEditingSummary ? 'Done' : 'Edit'}
                                                </button>
                                            </div>
                                            {isEditingSummary ? (
                                                <textarea
                                                    value={avaSummary}
                                                    onChange={(e) => setAvaSummary(e.target.value)}
                                                    className="w-full min-h-[100px] bg-white/5 border border-secondary/20 rounded-xl p-3 text-sm font-medium text-on-surface focus:outline-none focus:border-secondary transition-colors resize-none custom-scrollbar"
                                                />
                                            ) : (
                                                <p className="text-sm font-medium leading-relaxed text-on-surface text-left">
                                                    {avaSummary}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Your Words — collapsed by default */}
                            {rawTranscript.trim() && (
                                <div className="bg-surface-container-low border border-surface-variant/40 rounded-2xl overflow-hidden">
                                    <button
                                        onClick={() => setIsTranscriptExpanded(prev => !prev)}
                                        className="w-full flex items-center justify-between px-4 py-3 focus:outline-none hover:bg-white/5 transition-colors"
                                    >
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Your Words</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-on-surface-variant/60 font-semibold">{wordCount}w</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-on-surface-variant transition-transform duration-300 ${isTranscriptExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        </div>
                                    </button>
                                    <div className={`grid transition-all duration-400 ease-in-out ${isTranscriptExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="px-4 pb-4">
                                            <div className="flex justify-end mb-2">
                                                <button
                                                    onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                                                    className="text-on-surface-variant text-[11px] font-bold hover:opacity-70 transition-opacity"
                                                >
                                                    {isEditingTranscript ? 'Done' : 'Edit'}
                                                </button>
                                            </div>
                                            {isEditingTranscript ? (
                                                <textarea
                                                    value={rawTranscript}
                                                    onChange={(e) => setRawTranscript(e.target.value)}
                                                    className="w-full min-h-[100px] bg-white/5 border border-surface-variant/20 rounded-xl p-3 text-sm font-medium text-on-surface focus:outline-none focus:border-on-surface-variant transition-colors resize-none custom-scrollbar"
                                                />
                                            ) : (
                                                <p className="text-sm font-medium leading-relaxed text-on-surface/75 whitespace-pre-wrap text-left">
                                                    {rawTranscript}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Compact action row */}
                            <div className="flex flex-col gap-3 pt-1 w-full">
                                {audioUrl && (
                                    <a 
                                        href={audioUrl} 
                                        download={`journal-audio-${selectedDate}.webm`}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-secondary/10 hover:bg-secondary/20 dark:bg-secondary/20 dark:hover:bg-secondary/30 border border-secondary/20 dark:border-secondary/30 rounded-xl text-xs font-bold text-secondary transition-all active:scale-[0.98]"
                                        title="Download original audio"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Audio Sample
                                    </a>
                                )}
                                
                                <div className="flex items-center gap-2 w-full">
                                    <button
                                        onClick={startRecording}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-surface-container-high hover:bg-surface-variant text-on-surface transition-all active:scale-95"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" /> Re-record
                                    </button>

                                    {state === 'done' ? (
                                        <button
                                            onClick={() => handleSave()}
                                            className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-[#0a84ff] text-white hover:bg-[#007aff] transition-all shadow-md active:scale-95 ml-auto"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Save Entry
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 ml-auto">
                                            {(isEditingSummary || isEditingTranscript) && (
                                                <button
                                                    onClick={() => handleSave()}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#0a84ff] text-white hover:bg-[#007aff] transition-all shadow-md active:scale-95"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Save Edits
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
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
                                                    const isLogExpanded = expandedLogDate === log.date;
                                                    return (
                                                        <div
                                                            key={log.date} 
                                                            className="bg-surface-container-low border border-surface-variant/30 rounded-2xl overflow-hidden relative group/log transition-all w-full flex flex-col shadow-sm hover:border-surface-variant/60"
                                                        >
                                                            {/* Header row (Click to expand) */}
                                                            <button 
                                                                onClick={() => setExpandedLogDate(isLogExpanded ? null : log.date)}
                                                                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/5 transition-colors focus:outline-none"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary/70 shadow-[0_0_8px_rgba(var(--c-secondary)/0.5)]"></div>
                                                                    <h5 className="font-bold text-on-surface text-[11px] sm:text-xs tracking-wider uppercase opacity-80">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h5>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <div
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.date); }}
                                                                        className="text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 rounded-full p-1.5 transition-all opacity-0 group-hover/log:opacity-100 cursor-pointer mr-1"
                                                                        title="Delete Journal"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                                    </div>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-on-surface-variant transition-transform duration-300 ${isLogExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                                </div>
                                                            </button>
                                                            
                                                            {/* Cascading Preview body */}
                                                            <div className={`grid transition-all duration-300 ease-in-out ${isLogExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                                                <div className="overflow-hidden">
                                                                    {log.reflection && (
                                                                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1">
                                                                            <p className="text-sm text-on-surface/70 ml-3.5 leading-relaxed font-medium line-clamp-3 text-left">
                                                                                {log.reflection}
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
                        
                        {/* Segmented Control */}
                        {selectedLog.raw_transcript && (
                            <div className="px-5 py-3 border-b border-surface-variant/30">
                                <div className="flex bg-surface-variant/30 p-1 rounded-xl w-full max-w-xs mx-auto">
                                    <button
                                        onClick={() => setModalTab('summary')}
                                        className={clsx(
                                            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                                            modalTab === 'summary' ? "bg-surface-container text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                                        )}
                                    >
                                        <Sparkles className="w-3 h-3" /> Summary
                                    </button>
                                    <button
                                        onClick={() => setModalTab('raw')}
                                        className={clsx(
                                            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                                            modalTab === 'raw' ? "bg-surface-container text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                                        )}
                                    >
                                        <AlignLeft className="w-3 h-3" /> Raw Text
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 pb-safe relative">
                            {isEditingModal ? (
                                <textarea
                                    value={modalEditText}
                                    onChange={(e) => setModalEditText(e.target.value)}
                                    className="w-full h-full min-h-[150px] bg-transparent text-[15px] font-medium leading-relaxed text-on-surface/90 focus:outline-none resize-none custom-scrollbar"
                                    placeholder="Start typing..."
                                />
                            ) : (
                                <div className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-on-surface/90">
                                    {modalTab === 'summary' ? selectedLog.reflection : (selectedLog.raw_transcript || selectedLog.reflection)}
                                </div>
                            )}
                        </div>

                        {/* Action Bar */}
                        <div className="p-4 border-t border-surface-variant/50 flex items-center justify-between bg-surface-container-low pb-safe-offset-4">
                            <div className="flex gap-2">
                                {isEditingModal ? (
                                    <>
                                        <button
                                            onClick={handleSavePastLog}
                                            className="px-5 py-2 rounded-full bg-[#0a84ff] text-white hover:bg-[#007aff] text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Save Edits
                                        </button>
                                        <button
                                            onClick={() => setIsEditingModal(false)}
                                            className="px-4 py-2 rounded-full bg-surface-variant/50 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant text-xs font-bold transition-all active:scale-95"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                const currentText = modalTab === 'summary' ? selectedLog.reflection : (selectedLog.raw_transcript || selectedLog.reflection);
                                                setModalEditText(currentText || '');
                                                setIsEditingModal(true);
                                            }}
                                            className="px-4 py-2 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" /> Edit
                                        </button>
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
                                    </>
                                )}
                            </div>
                            {!isEditingModal && (
                                <button
                                    onClick={() => {
                                        handleDeleteLog(selectedLog.date);
                                        setSelectedLog(null);
                                    }}
                                    className="px-4 py-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
