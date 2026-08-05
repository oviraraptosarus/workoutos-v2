'use client';

import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Trophy, Flame, Video, Link as LinkIcon, Plus, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

export default function ActiveSplitCard({ preset, isBuilderMode, onExitBuilder }: { preset?: any, isBuilderMode?: boolean, onExitBuilder?: () => void }) {
    const { t } = useLanguage();
    const { userProfile } = useAuth();
    const [isFinished, setIsFinished] = useState(false);
    const [addingLinkForIdx, setAddingLinkForIdx] = useState<number | null>(null);
    const [linkInput, setLinkInput] = useState('');
    
    // Timer State
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

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
        setIsFinished(true);
        
        const weightKg = userProfile?.targetWeight || 75;
        const durationHrs = Math.max(elapsedSeconds / 3600, 0.05);
        const calsBurned = Math.round(6.0 * weightKg * durationHrs);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const d = new Date();
            const todayKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            
            await supabase.from('workout_logs').insert({
                user_id: user.id,
                date: todayKey,
                session_type: preset ? preset.title : customTitle,
                exercises: [...exercises, { type: 'metadata', duration: formatTime(elapsedSeconds), volume: `${calsBurned} kcal burned` }],
                completed: true
            });
        }
        
        
        window.dispatchEvent(new Event('workout_os_recent_workouts_updated'));
    };

    if (isFinished) {
        // Calories = MET * Weight(kg) * Duration(hrs)
        const weightKg = userProfile?.targetWeight || 75;
        const durationHrs = Math.max(elapsedSeconds / 3600, 0.05); // min 3 mins for cal math avoiding 0
        const calsBurned = Math.round(6.0 * weightKg * durationHrs);

        return (
            <div className="bg-surface-container-low backdrop-blur-xl border border-surface-variant rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
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
            </div>
        );
    }

    if (isBuilderMode) {
        return (
            <div className="bg-surface-container-low backdrop-blur-xl border border-surface-variant rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
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
        <div className="bg-surface-container-low backdrop-blur-xl border border-surface-variant rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider ml-1">Today's Split</h3>
                    <h2 className="text-2xl font-black text-on-surface drop-shadow-sm mt-0.5">{preset ? preset.title : customTitle}</h2>
                </div>
                <div className="flex items-center gap-2 bg-primary-container text-on-primary-container px-3 py-1.5 rounded-full text-sm font-black shadow-sm border border-primary-container">
                    <span className="animate-pulse w-2 h-2 rounded-full bg-primary" />
                    <span className="tabular-nums">{formatTime(elapsedSeconds)}</span>
                </div>
            </div>
            
            <div className="space-y-3 mt-4">
                {exercises.map((ex: any, idx: number) => (
                    <div key={idx} className="flex flex-col p-4 rounded-2xl bg-surface-container-lowest border border-surface-variant text-xs transition-colors shadow-sm hover:bg-surface-container group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button onClick={() => toggleExercise(idx)} className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${ex.completed ? 'bg-primary border-primary text-on-primary shadow-sm' : 'bg-surface-container border-surface-variant text-transparent hover:border-on-surface-variant'}`}>
                                    <CheckCircle2 size={14} strokeWidth={3} className={ex.completed ? 'opacity-100' : 'opacity-0'} />
                                </button>
                                <span className={`font-bold text-on-surface drop-shadow-sm text-sm ${ex.completed ? 'line-through opacity-50' : ''}`}>{ex.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {ex.youtubeUrl ? (
                                    <a href={ex.youtubeUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-full text-error hover:bg-error-container transition-colors tooltip-trigger" title="Watch tutorial">
                                        <Video size={16} />
                                    </a>
                                ) : (
                                    <button 
                                        onClick={() => { setAddingLinkForIdx(addingLinkForIdx === idx ? null : idx); setLinkInput(''); }}
                                        className="p-1.5 rounded-full text-on-surface-variant hover:text-secondary hover:bg-secondary-container transition-colors opacity-0 group-hover:opacity-100"
                                        title="Add YouTube Link"
                                    >
                                        <LinkIcon size={14} />
                                    </button>
                                )}
                                <span className="text-on-surface-variant font-bold ml-1 text-sm">{ex.sets}</span>
                            </div>
                        </div>

                        {addingLinkForIdx === idx && (
                            <div className="mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <input 
                                    type="url"
                                    placeholder="Paste YouTube URL..."
                                    value={linkInput}
                                    onChange={(e) => setLinkInput(e.target.value)}
                                    className="flex-1 bg-surface-container border border-surface-variant rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary text-on-surface placeholder-on-surface-variant font-medium"
                                />
                                <button 
                                    onClick={() => handleSaveLink(idx)}
                                    className="bg-secondary hover:bg-secondary-fixed text-on-secondary px-4 py-2 rounded-xl font-bold transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-surface-variant">
                <button 
                    onClick={handleFinish}
                    className="w-full bg-secondary hover:bg-secondary-fixed text-on-secondary font-bold py-4 rounded-2xl transition-colors text-[15px] shadow-sm btn-press"
                >
                    Finish Workout
                </button>
            </div>
        </div>
    );
}
