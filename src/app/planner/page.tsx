'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Play, BrainCircuit, Target, CheckCircle2, Loader2, Sparkles, Mic, MicOff, X, Check } from 'lucide-react';
import clsx from 'clsx';

export default function ExecutionOSPage() {
    const { t } = useLanguage();
    const { userProfile } = useAuth();
    
    const [activeTab, setActiveTab] = useState<'now' | 'brain' | 'goals' | 'reflect'>('now');
    const [tasks, setTasks] = useState<any[]>([]);
    const [goals, setGoals] = useState<any[]>([]);
    const [isAddingGoal, setIsAddingGoal] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalArea, setNewGoalArea] = useState('Fitness');
    const [newGoalDate, setNewGoalDate] = useState('');
    const [isClient, setIsClient] = useState(false);
    
    // Brain Hub State
    const [brainInput, setBrainInput] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [brainResponse, setBrainResponse] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Reflect Hub State
    const [reflectInput, setReflectInput] = useState('');
    const [isReflecting, setIsReflecting] = useState(false);
    const [reflectResponse, setReflectResponse] = useState('');

    // War Room State
    const [isWarRoomActive, setIsWarRoomActive] = useState(false);
    const [warRoomTime, setWarRoomTime] = useState(0);

    useEffect(() => {
        setIsClient(true);
        loadTasks();

        // Setup Speech Recognition
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                
                recognitionRef.current.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript + ' ';
                        }
                    }
                    if (finalTranscript) {
                        setBrainInput(prev => prev + finalTranscript);
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsRecording(false);
                };

                recognitionRef.current.onend = () => {
                    setIsRecording(false);
                };
            }
        }
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isWarRoomActive) {
            timer = setInterval(() => {
                setWarRoomTime(prev => prev + 1);
            }, 1000);
        } else {
            setWarRoomTime(0);
        }
        return () => clearInterval(timer);
    }, [isWarRoomActive]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const loadTasks = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id);
        if (data) {
            setTasks(data);
        }
        const { data: goalData } = await supabase.from('execution_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (goalData) {
            setGoals(goalData);
        }
    };

    const handleAddGoal = async () => {
        if (!newGoalTitle.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { error } = await supabase.from('execution_goals').insert({
            user_id: user.id,
            title: newGoalTitle,
            life_area: newGoalArea,
            target_date: newGoalDate || null
        });

        if (!error) {
            setNewGoalTitle('');
            setIsAddingGoal(false);
            loadTasks();
        } else {
            console.error("Failed to add goal:", error);
            alert("Failed to add goal.");
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
        } else {
            setBrainInput(''); // Optional: clear previous or append. Let's append actually, so don't clear.
            recognitionRef.current?.start();
            setIsRecording(true);
        }
    };

    const handleBrainDump = async () => {
        if (!brainInput.trim()) return;
        setIsParsing(true);
        setBrainResponse('');
        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `I am doing a Brain Dump. Parse the following unstructured thoughts, extract actionable tasks, and call add_task for each one with logical due dates. Brain Dump: ${brainInput}`,
                    userProfile,
                    history: []
                })
            });
            const data = await res.json();
            setBrainResponse(data.result || "Tasks extracted and queued.");
            setBrainInput('');
            loadTasks();
            window.dispatchEvent(new Event('workout_os_tasks_updated'));
        } catch (e: any) {
            console.error(e);
            setBrainResponse('Failed to parse brain dump.');
        } finally {
            setIsParsing(false);
        }
    };

    const handleReflect = async () => {
        setIsReflecting(true);
        setReflectResponse('');
        const completedToday = tasks.filter(t => t.completed && t.date === new Date().toISOString().split('T')[0]);
        
        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `End of day reflection. I completed ${completedToday.length} tasks today. Here are my thoughts: ${reflectInput}. Act as the Analyst, review my day, give me a momentum score, and log any behavior patterns you notice.`,
                    userProfile,
                    history: []
                })
            });
            const data = await res.json();
            setReflectResponse(data.result || "Reflection saved.");
            setReflectInput('');
        } catch (e: any) {
            console.error(e);
            setReflectResponse('Failed to analyze reflection.');
        } finally {
            setIsReflecting(false);
        }
    };

    const completeTask = async (taskId: string) => {
        const { error } = await supabase.from('tasks').update({ completed: true }).eq('id', taskId);
        if (!error) {
            loadTasks();
            window.dispatchEvent(new Event('workout_os_tasks_updated'));
        }
    };

    if (!isClient) return null;

    // Highest probability incomplete task
    const topTask = tasks.filter(t => !t.completed)[0] || null;

    if (isWarRoomActive) {
        return (
            <AppLayout hideBottomNav={true}>
                <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-500">
                    <div className="absolute top-8 text-on-surface-variant uppercase tracking-[0.3em] text-sm font-bold animate-pulse">
                        Mission Mode Active
                    </div>
                    
                    <div className="text-8xl font-display font-black text-primary mb-12 tabular-nums">
                        {formatTime(warRoomTime)}
                    </div>

                    <div className="w-full max-w-xl bg-surface-container/30 border border-surface-variant/50 p-8 rounded-3xl mb-12 text-center shadow-2xl">
                        <p className="text-sm uppercase tracking-widest text-primary font-bold mb-4">Current Target</p>
                        <h2 className="text-3xl font-bold text-on-surface leading-tight">
                            {topTask?.title || "Focus on your current execution."}
                        </h2>
                        {topTask?.description && (
                            <p className="text-on-surface-variant mt-4 text-lg">{topTask.description}</p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
                        <button 
                            onClick={async () => {
                                if (topTask) await completeTask(topTask.id);
                                setIsWarRoomActive(false);
                            }}
                            className="flex-1 bg-primary text-on-primary py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/25"
                        >
                            <Check className="w-7 h-7" />
                            Mission Accomplished
                        </button>
                        <button 
                            onClick={() => setIsWarRoomActive(false)}
                            className="flex-1 bg-surface-container text-on-surface py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-surface-variant transition-colors border border-surface-variant"
                        >
                            <X className="w-7 h-7" />
                            Abort
                        </button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout hideBottomNav={false}>
            <div className="max-w-4xl mx-auto pt-safe pb-24 px-4 min-h-screen">
                <header className="py-6 flex flex-col gap-2">
                    <h1 className="font-display text-4xl font-bold tracking-tight text-on-background">Execution OS</h1>
                    <p className="text-on-surface-variant font-body">Capture, process, and execute relentlessly.</p>
                </header>

                <div className="flex bg-surface-container/30 backdrop-blur-md p-1 rounded-2xl mb-8 border border-surface-variant/30 overflow-x-auto hide-scrollbar">
                    {(['now', 'brain', 'goals', 'reflect'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "flex-1 py-3 px-4 rounded-xl text-sm font-label uppercase tracking-wider transition-all whitespace-nowrap",
                                activeTab === tab 
                                    ? "bg-primary text-on-primary shadow-lg scale-100" 
                                    : "text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface scale-95"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="space-y-6">
                    {/* NOW HUB */}
                    {activeTab === 'now' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="glass border border-surface-variant/30 p-8 rounded-3xl shadow-xl text-center flex flex-col items-center justify-center min-h-[300px]">
                                <Play className="w-16 h-16 text-primary mb-6" />
                                <h2 className="text-3xl font-display font-bold text-on-background mb-4">Relentless Mode</h2>
                                <p className="text-on-surface-variant mb-8 max-w-md">Lock out all distractions and focus on your single most critical execution target.</p>
                                
                                {topTask ? (
                                    <div className="bg-surface-container/50 border border-surface-variant p-6 rounded-2xl w-full max-w-md mb-8">
                                        <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Priority Target</p>
                                        <h3 className="text-xl font-bold text-on-surface">{topTask.title}</h3>
                                    </div>
                                ) : (
                                    <div className="bg-surface-container/50 border border-surface-variant p-6 rounded-2xl w-full max-w-md mb-8">
                                        <p className="text-on-surface-variant">Your execution queue is clear.</p>
                                    </div>
                                )}

                                <button 
                                    disabled={!topTask}
                                    onClick={() => setIsWarRoomActive(true)}
                                    className="btn-primary disabled:opacity-50 w-full max-w-md py-4 text-lg font-bold rounded-2xl flex items-center justify-center gap-2 group"
                                >
                                    <span>Enter War Room</span>
                                    <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* BRAIN HUB */}
                    {activeTab === 'brain' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="glass border border-surface-variant/30 p-6 rounded-3xl shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <BrainCircuit className="w-8 h-8 text-secondary" />
                                    <h2 className="text-2xl font-display font-bold text-on-surface">Brain Dump</h2>
                                </div>
                                <p className="text-on-surface-variant mb-6">Drop your unstructured thoughts here, or hold the mic to speak. Ava will organize it into your execution pipeline.</p>
                                
                                <div className="relative mb-4">
                                    <textarea
                                        value={brainInput}
                                        onChange={(e) => setBrainInput(e.target.value)}
                                        placeholder="e.g., I need to buy groceries tomorrow, finish the TPS report..."
                                        className="w-full h-48 bg-surface-container/30 border border-surface-variant/50 rounded-2xl p-4 pb-14 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/50 resize-none"
                                    />
                                    <button 
                                        onClick={toggleRecording}
                                        className={clsx(
                                            "absolute bottom-4 right-4 p-3 rounded-full transition-all shadow-md flex items-center gap-2",
                                            isRecording ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse" : "bg-surface-variant text-on-surface hover:bg-surface-variant/80"
                                        )}
                                    >
                                        {isRecording ? (
                                            <>
                                                <MicOff className="w-5 h-5" />
                                                <span className="text-sm font-bold pr-1">Stop</span>
                                            </>
                                        ) : (
                                            <>
                                                <Mic className="w-5 h-5" />
                                                <span className="text-sm font-bold pr-1">Speak</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                
                                <button 
                                    onClick={handleBrainDump}
                                    disabled={isParsing || !brainInput.trim()}
                                    className="btn-secondary w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    {isParsing ? 'Parsing...' : 'Parse & Execute'}
                                </button>

                                {brainResponse && (
                                    <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl text-on-surface">
                                        {brainResponse}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* GOALS HUB */}
                    {activeTab === 'goals' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="glass border border-surface-variant/30 p-6 rounded-3xl shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <Target className="w-8 h-8 text-tertiary" />
                                        <h2 className="text-2xl font-display font-bold text-on-surface">Macro Goals</h2>
                                    </div>
                                    <button 
                                        onClick={() => setIsAddingGoal(!isAddingGoal)}
                                        className="bg-surface-container hover:bg-surface-variant text-on-surface px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                                    >
                                        {isAddingGoal ? 'Cancel' : 'Define Vector'}
                                    </button>
                                </div>
                                <p className="text-on-surface-variant mb-6">Your high-level execution vectors.</p>

                                {isAddingGoal && (
                                    <div className="bg-surface-container/30 border border-surface-variant/50 p-6 rounded-2xl mb-8 animate-in zoom-in-95">
                                        <h3 className="font-bold text-on-surface mb-4">New Macro Goal</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">Goal Title</label>
                                                <input 
                                                    type="text" 
                                                    value={newGoalTitle}
                                                    onChange={e => setNewGoalTitle(e.target.value)}
                                                    placeholder="e.g. Launch MVP, Deadlift 200kg"
                                                    className="w-full bg-background border border-surface-variant rounded-xl p-3 text-on-surface focus:outline-none focus:border-tertiary"
                                                />
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">Life Area</label>
                                                    <select 
                                                        value={newGoalArea}
                                                        onChange={e => setNewGoalArea(e.target.value)}
                                                        className="w-full bg-background border border-surface-variant rounded-xl p-3 text-on-surface focus:outline-none focus:border-tertiary"
                                                    >
                                                        {['Fitness', 'Career', 'Learning', 'Personal', 'Finance', 'Health'].map(a => (
                                                            <option key={a} value={a}>{a}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">Target Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={newGoalDate}
                                                        onChange={e => setNewGoalDate(e.target.value)}
                                                        className="w-full bg-background border border-surface-variant rounded-xl p-3 text-on-surface focus:outline-none focus:border-tertiary"
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleAddGoal}
                                                className="w-full bg-tertiary text-on-tertiary font-bold py-3 rounded-xl mt-4 hover:scale-[1.02] transition-transform shadow-lg shadow-tertiary/25"
                                            >
                                                Save Goal
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {goals.length === 0 && !isAddingGoal ? (
                                    <div className="text-center py-12 bg-surface-container/30 border border-surface-variant/30 rounded-2xl">
                                        <p className="text-on-surface-variant mb-4">No macro goals defined yet.</p>
                                        <button onClick={() => setIsAddingGoal(true)} className="text-tertiary font-bold hover:underline">Define Vector</button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {goals.map(goal => (
                                            <div key={goal.id} className="bg-surface-container/50 border border-surface-variant p-5 rounded-2xl flex items-center justify-between group hover:border-tertiary/50 transition-colors">
                                                <div>
                                                    <span className="text-xs font-bold uppercase tracking-widest text-tertiary bg-tertiary/10 px-2 py-1 rounded-md mb-2 inline-block">
                                                        {goal.life_area}
                                                    </span>
                                                    <h3 className="font-bold text-on-surface text-lg">{goal.title}</h3>
                                                    {goal.target_date && (
                                                        <p className="text-sm text-on-surface-variant mt-1">Target: {new Date(goal.target_date).toLocaleDateString()}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
                                                        <Target className="w-4 h-4" />
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* REFLECT HUB */}
                    {activeTab === 'reflect' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="glass border border-surface-variant/30 p-6 rounded-3xl shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <CheckCircle2 className="w-8 h-8 text-primary" />
                                    <h2 className="text-2xl font-display font-bold text-on-surface">End of Day Review</h2>
                                </div>
                                <p className="text-on-surface-variant mb-6">Analyze your execution rate and log behavioral patterns to improve tomorrow.</p>
                                
                                <textarea
                                    value={reflectInput}
                                    onChange={(e) => setReflectInput(e.target.value)}
                                    placeholder="How did today go? Any bottlenecks? What drained your energy?"
                                    className="w-full h-32 bg-surface-container/30 border border-surface-variant/50 rounded-2xl p-4 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-4"
                                />
                                
                                <button 
                                    onClick={handleReflect}
                                    disabled={isReflecting}
                                    className="btn-primary w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    {isReflecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    {isReflecting ? 'Analyzing...' : 'Run Analyst Protocol'}
                                </button>

                                {reflectResponse && (
                                    <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl text-on-surface whitespace-pre-wrap">
                                        {reflectResponse}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
