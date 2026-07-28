'use client';

import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Trophy, Flame, Video, Link as LinkIcon, Plus, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ActiveSplitCard({ preset, isBuilderMode, onExitBuilder }: { preset?: any, isBuilderMode?: boolean, onExitBuilder?: () => void }) {
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

    const [exercises, setExercises] = useState(
        preset ? preset.exercises.map((e: any) => ({ ...e, completed: false })) : []
    );

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

    const handleFinish = () => {
        setIsFinished(true);
        
        const weightKg = userProfile?.targetWeight || 75;
        const durationHrs = Math.max(elapsedSeconds / 3600, 0.05);
        const calsBurned = Math.round(6.0 * weightKg * durationHrs);
        
        const newWorkout = {
            id: Date.now(),
            name: preset ? preset.title : customTitle,
            duration: formatTime(elapsedSeconds),
            volume: `${calsBurned} kcal burned`,
            date: 'Today',
        };
        
        let recents: any[] = [];
        try { recents = JSON.parse(localStorage.getItem('workout_os_recent_workouts') || '[]'); } catch(e) {}
        recents = [newWorkout, ...recents];
        localStorage.setItem('workout_os_recent_workouts', JSON.stringify(recents));
        
        // Populate dashboard checklist
        const d = new Date();
        const todayKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        const checklist = exercises.map((ex: any, idx: number) => ({ id: idx + Date.now(), name: ex.name, done: true }));
        localStorage.setItem(`workout_os_workout_exercises_${todayKey}`, JSON.stringify(checklist));
        
        window.dispatchEvent(new Event('storage'));
    };

    if (isFinished) {
        // Calories = MET * Weight(kg) * Duration(hrs)
        const weightKg = userProfile?.targetWeight || 75;
        const durationHrs = Math.max(elapsedSeconds / 3600, 0.05); // min 3 mins for cal math avoiding 0
        const calsBurned = Math.round(6.0 * weightKg * durationHrs);

        return (
            <div className="bg-white border border-gray-100 border-gray-200 rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-200">
                    <Trophy size={32} />
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-1">Workout Complete!</h2>
                <p className="text-sm text-gray-600 font-medium mb-6">Great job crushing {preset ? preset.title : customTitle}.</p>
                
                <div className="flex justify-center gap-6 text-left border-t border-gray-100 pt-5">
                    <div>
                        <span className="text-xs font-bold text-gray-500 uppercase">Duration</span>
                        <p className="text-lg font-black text-gray-900 mt-0.5">{formatTime(elapsedSeconds)}</p>
                    </div>
                    <div className="w-px bg-gray-200" />
                    <div>
                        <span className="text-xs font-bold text-gray-500 uppercase">Burned</span>
                        <p className="text-lg font-black text-orange-500 mt-0.5 flex items-center gap-1">
                            {calsBurned} kcal <Flame size={14} className="text-orange-500" />
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (isBuilderMode) {
        return (
            <div className="bg-white border border-gray-100 border-gray-200 rounded-3xl p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-4">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1">Plan Workout</h3>
                    <input 
                        type="text" 
                        value={customTitle} 
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full text-xl font-black text-gray-900 drop-shadow-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-300 transition-colors"
                    />
                </div>
                
                <div className="space-y-2 mt-4">
                    {exercises.map((ex: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs shadow-sm">
                            <span className="font-bold text-gray-900 drop-shadow-sm">{ex.name}</span>
                            <span className="text-gray-500 font-bold">{ex.sets}</span>
                        </div>
                    ))}
                    
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-gray-100">
                        <input 
                            type="text" 
                            placeholder="Exercise Name (e.g. Squat)" 
                            value={newExName} 
                            onChange={(e) => setNewExName(e.target.value)}
                            className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-300"
                        />
                        <input 
                            type="number" 
                            placeholder="Sets (e.g. 3)" 
                            value={newExSets} 
                            onChange={(e) => setNewExSets(e.target.value)}
                            className="w-full sm:w-20 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-300"
                        />
                        <input 
                            type="number" 
                            placeholder="Reps (e.g. 10)" 
                            value={newExReps} 
                            onChange={(e) => setNewExReps(e.target.value)}
                            className="w-full sm:w-20 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-300"
                        />
                        <button onClick={handleAddCustomExercise} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1">
                            <Plus size={14} /> Add
                        </button>
                    </div>
                </div>

                <div className="mt-5 pt-5 border-t border-gray-200">
                    <button 
                        onClick={handleStartCustom}
                        disabled={exercises.length === 0}
                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-3.5 rounded-2xl transition-colors text-[14px] shadow-sm btn-press flex items-center justify-center gap-2"
                    >
                        <Play size={16} fill="currentColor" /> Start Workout
                    </button>
                </div>
            </div>
        );
    }

    if (exercises.length === 0 && !isBuilderMode) return null;

    return (
        <div className="bg-white border border-gray-100 border-gray-200 rounded-3xl p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Today's Split</h3>
                    <h2 className="text-xl font-black text-gray-900 drop-shadow-sm mt-0.5">{preset ? preset.title : customTitle}</h2>
                </div>
                <div className="flex items-center gap-2 bg-emerald-100/80 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-black shadow-sm border border-emerald-200/50">
                    <span className="animate-pulse w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-mono">{formatTime(elapsedSeconds)}</span>
                </div>
            </div>
            
            <div className="space-y-2 mt-4">
                {exercises.map((ex: any, idx: number) => (
                    <div key={idx} className="flex flex-col p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs transition-colors shadow-sm hover:bg-gray-100 group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${ex.completed ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm' : 'bg-gray-50 border-gray-300 text-transparent hover:border-gray-400'}`}>
                                    <CheckCircle2 size={12} strokeWidth={3} className={ex.completed ? 'opacity-100' : 'opacity-0'} />
                                </button>
                                <span className={`font-bold text-gray-900 drop-shadow-sm ${ex.completed ? 'line-through text-gray-400' : ''}`}>{ex.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {ex.youtubeUrl ? (
                                    <a href={ex.youtubeUrl} target="_blank" rel="noreferrer" className="p-1 rounded-full text-red-500 hover:bg-red-50 transition-colors tooltip-trigger" title="Watch tutorial">
                                        <Video size={16} />
                                    </a>
                                ) : (
                                    <button 
                                        onClick={() => { setAddingLinkForIdx(addingLinkForIdx === idx ? null : idx); setLinkInput(''); }}
                                        className="p-1 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Add YouTube Link"
                                    >
                                        <LinkIcon size={14} />
                                    </button>
                                )}
                                <span className="text-gray-500 font-bold ml-1">{ex.sets}</span>
                            </div>
                        </div>

                        {addingLinkForIdx === idx && (
                            <div className="mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <input 
                                    type="url"
                                    placeholder="Paste YouTube URL..."
                                    value={linkInput}
                                    onChange={(e) => setLinkInput(e.target.value)}
                                    className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-300 text-gray-800 placeholder:text-gray-400 font-medium"
                                />
                                <button 
                                    onClick={() => handleSaveLink(idx)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-5 pt-5 border-t border-gray-200">
                <button 
                    onClick={handleFinish}
                    className="w-full bg-[#1f4e38] hover:bg-[#163a2a] text-white font-bold py-3.5 rounded-2xl transition-colors text-[14px] shadow-sm btn-press"
                >
                    Finish Workout
                </button>
            </div>
        </div>
    );
}
