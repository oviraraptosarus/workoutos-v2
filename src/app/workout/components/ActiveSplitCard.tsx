'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Play, CheckCircle2, Trophy, Flame, Video, Link as LinkIcon, Plus, Save, ChevronRight } from 'lucide-react';
import { WorkoutLogger } from '@/lib/workout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useWakeLock } from '@/lib/hooks/useWakeLock';
import ForgeImpactOverlay from '@/app/components/ForgeImpactOverlay';

export default function ActiveSplitCard({ preset, isBuilderMode, onExitBuilder, onCloseSession }: { preset?: any, isBuilderMode?: boolean, onExitBuilder?: () => void, onCloseSession?: () => void }) {
    const { t } = useLanguage();
    const { userProfile } = useAuth();
    const [isFinished, setIsFinished] = useState(false);
    const [showImpactOverlay, setShowImpactOverlay] = useState(false);
    const [addingLinkForIdx, setAddingLinkForIdx] = useState<number | null>(null);
    const [linkInput, setLinkInput] = useState('');
    
    // Timer State
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const submitLock = useRef(false);
    
    const { requestWakeLock, releaseWakeLock } = useWakeLock();

    // Builder State
    const [customTitle, setCustomTitle] = useState('My Custom Workout');
    const [newExName, setNewExName] = useState('');
    const [newExSets, setNewExSets] = useState('');
    const [newExReps, setNewExReps] = useState('');

    const [exercises, setExercises] = useState<any[]>(
        preset ? preset.exercises.map((e: any) => ({ ...e, completed: false })) : []
    );

    // Sync state to LocalStorage when timer runs (for seconds)
    useEffect(() => {
        if (isTimerRunning && !isFinished) {
            
        }
    }, [isTimerRunning, elapsedSeconds, customTitle, isFinished]);

    const syncStateToStorage = (exs: any[], running: boolean, secs: number, title: string) => {
        localStorage.setItem('workout_os_active_session_state', JSON.stringify({
            exercises: exs,
            isTimerRunning: running,
            elapsedSeconds: secs,
            customTitle: title
        }));
        
        // Sync to WorkoutCard.tsx format
        const d = new Date();
        const todayKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        const syncFormat = exs.map((ex, i) => ({ id: i, name: ex.name, done: ex.completed }));
        localStorage.setItem(`workout_os_workout_exercises_${todayKey}`, JSON.stringify(syncFormat));
        
    };

    // Load state on mount if no preset
    useEffect(() => {
        if (!preset) {
            const saved = localStorage.getItem('workout_os_active_session_state');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.isTimerRunning) {
                        setExercises(parsed.exercises);
                        setIsTimerRunning(parsed.isTimerRunning);
                        setElapsedSeconds(parsed.elapsedSeconds);
                        setCustomTitle(parsed.customTitle);
                        requestWakeLock();
                        if (onExitBuilder) onExitBuilder();
                    }
                } catch (e) {}
            }
        }
    }, []);

    useEffect(() => {
        if (preset) {
            setExercises(preset.exercises.map((e: any) => ({ ...e, completed: false })));
            setIsFinished(false);
            setElapsedSeconds(0);
            setIsTimerRunning(true); // Auto-start preset
            requestWakeLock();
            if (onExitBuilder) onExitBuilder();
        }
    }, [preset]);

    useEffect(() => {
        let interval: any;
        if (isTimerRunning && !isFinished && !isBuilderMode) {
            interval = setInterval(() => {
                setElapsedSeconds(s => s + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, isFinished, isBuilderMode]);

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleAddCustomExercise = () => {
        if (!newExName || !newExSets || !newExReps) return;
        setExercises([...exercises, { name: newExName, sets: `${newExSets} sets x ${newExReps} reps`, completed: false, youtubeUrl: '' }]);
        setNewExName('');
        setNewExSets('');
        setNewExReps('');
    };

    const toggleExercise = (idx: number) => {
        const newEx = [...exercises];
        newEx[idx].completed = !newEx[idx].completed;
        setExercises(newEx);
        
    };

    const handleStartCustom = () => {
        if (onExitBuilder) onExitBuilder();
        setElapsedSeconds(0);
        setIsTimerRunning(true);
        setIsFinished(false);
        requestWakeLock();
    };

    const handleSaveLink = (idx: number) => {
        if (!linkInput) return;
        const newEx = [...exercises];
        newEx[idx].youtubeUrl = linkInput;
        setExercises(newEx);
        setAddingLinkForIdx(null);
        setLinkInput('');
    };

    const handleFinish = async () => {
        if (submitLock.current) return;
        submitLock.current = true;
        
        setShowImpactOverlay(true); // Trigger the Forge animation!
        
        const weightKg = userProfile?.targetWeight || 75;
        const durationHrs = Math.max(elapsedSeconds / 3600, 0.05);
        const calsBurned = Math.round(6.0 * weightKg * durationHrs);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const todayKey = new Date().toLocaleDateString('en-CA');
            
            try {
                await WorkoutLogger.logWorkout({
                    userId: user.id,
                    date: todayKey,
                    sessionType: 'Gym',
                    customName: preset ? preset.title : customTitle,
                    durationMinutes: Math.round(elapsedSeconds / 60),
                    caloriesBurned: calsBurned,
                    intensity: 'Moderate',
                    exercises: exercises,
                    isOutdoor: false
                });

                window.dispatchEvent(new Event('workout_os_recent_workouts_updated'));
                window.dispatchEvent(new Event('workout_os_activity_updated'));
            } catch (error: any) {
                console.error("Workout saving failed:", error);
                // Standard AGENTS.md rule: Use native browser alert() pop-ups to surface the error directly on the screen
                alert("Error saving workout to database: " + error.message);
                setShowImpactOverlay(false);
                setIsFinished(false); // Rollback optimistic state
                submitLock.current = false;
            }
        } else {
            submitLock.current = false;
        }
    };

    const finalizeFinish = () => {
        setShowImpactOverlay(false);
        setIsFinished(true);
        releaseWakeLock();
    }

    if (showImpactOverlay) {
        return <ForgeImpactOverlay isVisible={true} onComplete={finalizeFinish} />;
    }

    if (isFinished) {
        // Calories = MET * Weight(kg) * Duration(hrs)
        const weightKg = userProfile?.targetWeight || 75;
        const durationHrs = Math.max(elapsedSeconds / 3600, 0.05); // min 3 mins for cal math avoiding 0
        const calsBurned = Math.round(6.0 * weightKg * durationHrs);

        return (
            <div className="glass-card-premium p-5  transition-all relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
                <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mx-auto mb-4 shadow-sm border border-primary-container">
                    <Trophy size={32} />
                </div>
                <h2 className="text-xl font-black text-on-surface mb-1">{t('workout.active.complete')}</h2>
                <p className="text-sm text-on-surface-variant font-medium mb-6">{t('workout.active.greatJob')} {preset ? preset.title : customTitle}.</p>
                
                <div className="flex justify-center gap-6 text-left border-t border-surface-variant pt-5">
                    <div>
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('workout.active.duration')}</span>
                        <p className="text-lg font-black text-on-surface mt-0.5">{formatTime(elapsedSeconds)}</p>
                    </div>
                    <div className="w-px bg-surface-variant" />
                    <div>
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('workout.active.burned')}</span>
                        <p className="text-lg font-black text-tertiary mt-0.5 flex items-center gap-1">
                            {calsBurned} kcal <Flame size={14} className="text-tertiary" />
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setIsFinished(false);
                        setElapsedSeconds(0);
                        setExercises([]);
                        setIsTimerRunning(false);
                        localStorage.removeItem('workout_os_active_session_state');
                        if (onCloseSession) onCloseSession();
                        else if (onExitBuilder) onExitBuilder();
                    }}
                    className="mt-8 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold py-3 px-8 rounded-full transition-colors btn-press shadow-sm border border-surface-variant w-full"
                >
                    Close Session
                </button>
            </div>
        );
    }

    if (isBuilderMode) {
        return (
            <div className="glass-card-premium p-5  transition-all relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-4">
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider ml-1 mb-1">{t('workout.active.plan')}</h3>
                    <input 
                        type="text" 
                        value={customTitle} 
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full text-xl font-black text-on-surface drop-shadow-sm bg-surface-container-highest border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-secondary transition-colors"
                    />
                </div>
                
                <div className="space-y-2 mt-4">
                    {exercises.map((ex: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-lowest border border-surface-variant text-xs shadow-sm">
                            <span className="font-bold text-on-surface drop-shadow-sm">{ex.name}</span>
                            <span className="text-on-surface-variant font-bold">{ex.sets}</span>
                        </div>
                    ))}
                    
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-surface-variant">
                        <input 
                            type="text" 
                            placeholder="Exercise Name (e.g. Squat)" 
                            value={newExName} 
                            onChange={(e) => setNewExName(e.target.value)}
                            className="flex-1 bg-surface-container border border-surface-variant rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-secondary"
                        />
                        <input 
                            type="number" 
                            placeholder="Sets (e.g. 3)" 
                            value={newExSets} 
                            onChange={(e) => setNewExSets(e.target.value)}
                            className="w-full sm:w-20 bg-surface-container border border-surface-variant rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-secondary"
                        />
                        <input 
                            type="number" 
                            placeholder="Reps (e.g. 10)" 
                            value={newExReps} 
                            onChange={(e) => setNewExReps(e.target.value)}
                            className="w-full sm:w-20 bg-surface-container border border-surface-variant rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-secondary"
                        />
                        <button onClick={handleAddCustomExercise} className="bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1">
                            <Plus size={14} /> Add
                        </button>
                    </div>
                </div>

                <div className="mt-5 pt-5 border-t border-surface-variant">
                    <button 
                        onClick={handleStartCustom}
                        disabled={exercises.length === 0}
                        className="w-full bg-secondary hover:bg-secondary-fixed disabled:bg-surface-container disabled:text-on-surface-variant text-on-secondary font-bold py-3.5 rounded-2xl transition-colors text-[14px] shadow-sm btn-press flex items-center justify-center gap-2"
                    >
                        <Play size={16} fill="currentColor" /> Start Workout
                    </button>
                </div>
            </div>
        );
    }

    if (exercises.length === 0 && !isBuilderMode) return null;

    return (
        <div className="bg-white dark:bg-[#0a0a0c] rounded-[2.5rem] p-6 shadow-2xl border border-black/5 dark:border-white/5 transition-all relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Ambient Background Glow based on timer */}
            <div className="absolute top-0 left-0 w-full h-[150px] bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

            <div className="flex flex-col items-center justify-center mb-6 relative z-10 pt-4">
                <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-2 opacity-80">{preset ? preset.title : customTitle}</h3>
                <div className="tabular-nums text-7xl font-black tracking-tighter text-on-surface drop-shadow-sm flex items-center justify-center">
                    {formatTime(elapsedSeconds)}
                </div>
                
                {/* Ghost Mode PVP Tracker */}
                {!isBuilderMode && (
                    <div className="w-full max-w-[240px] mt-6 flex flex-col gap-2">
                        <div className="flex justify-between items-end px-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
                                Ghost Pace (Avg)
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                                Current Pace
                            </span>
                        </div>
                        <div className="relative w-full h-3 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-inner overflow-hidden">
                            {/* Ghost Average Line (Simulated 45min average) */}
                            <div 
                                className="absolute top-0 bottom-0 left-0 bg-on-surface-variant/30 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, (elapsedSeconds / (45 * 60)) * 100)}%` }}
                            />
                            {/* User Current Pace (Based on completed exercises) */}
                            <div 
                                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                style={{ width: `${exercises.length > 0 ? (exercises.filter((e:any) => e.completed).length / exercises.length) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
            
            <div className="space-y-4 mt-8 relative z-10">
                {exercises.map((ex: any, idx: number) => {
                    const handleDragEnd = (event: any, info: PanInfo) => {
                        if (info.offset.x > 100) {
                            if (!ex.completed) toggleExercise(idx);
                        } else if (info.offset.x < -100) {
                            if (ex.completed) toggleExercise(idx);
                        }
                    };

                    return (
                        <div key={idx} className="relative w-full h-[72px] rounded-[1.5rem] bg-surface-container-low dark:bg-white/5 border border-black/5 dark:border-white/10 overflow-hidden shadow-inner group">
                            {/* Swipe Instruction Text (Background) */}
                            <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none opacity-40">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1"><ChevronRight size={12}/> Swipe to Complete</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Undo</span>
                            </div>

                            {/* Draggable Card */}
                            <motion.div 
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={handleDragEnd}
                                animate={{ x: ex.completed ? 150 : 0, opacity: ex.completed ? 0 : 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className="absolute inset-0 w-full h-full bg-white dark:bg-[#1a1a1e] rounded-[1.5rem] border border-black/5 dark:border-white/10 shadow-md flex items-center justify-between px-5 cursor-grab active:cursor-grabbing z-10"
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                                        <ChevronRight size={14} className="text-on-surface-variant" />
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="font-bold text-on-surface truncate text-[15px]">{ex.name}</span>
                                        <span className="text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">{ex.sets}</span>
                                    </div>
                                    
                                    {ex.youtubeUrl && (
                                        <a href={ex.youtubeUrl} target="_blank" rel="noreferrer" className="p-2 rounded-full text-error hover:bg-error/10 transition-colors z-20 shrink-0">
                                            <Video size={18} />
                                        </a>
                                    )}
                                </div>
                            </motion.div>

                            {/* Completed State (Revealed underneath) */}
                            <div className={`absolute inset-0 flex items-center justify-between px-6 transition-all duration-500 ${ex.completed ? 'opacity-100' : 'opacity-0'} bg-blue-500/10 dark:bg-blue-500/20`}>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={20} className="text-blue-500" />
                                    <span className="font-black text-blue-500 uppercase tracking-widest text-xs">Completed</span>
                                </div>
                                <span className="font-bold text-on-surface-variant text-sm line-through opacity-50">{ex.name}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 relative z-10">
                <button 
                    onClick={handleFinish}
                    className="w-full bg-black dark:bg-white hover:scale-[0.98] text-white dark:text-black font-black uppercase tracking-widest py-5 rounded-[1.5rem] transition-all text-sm shadow-xl flex items-center justify-center gap-2"
                >
                    Finish Workout
                </button>
            </div>
        </div>
    );
}
