'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Play, BrainCircuit, Target, CheckCircle2, Loader2, Sparkles, Mic, MicOff, X, Check } from 'lucide-react';
import clsx from 'clsx';
import confetti from 'canvas-confetti';

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
    const activeTabRef = useRef(activeTab);

    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);

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
                        if (activeTabRef.current === 'brain') {
                            setBrainInput(prev => prev + finalTranscript);
                        } else if (activeTabRef.current === 'reflect') {
                            setReflectInput(prev => prev + finalTranscript);
                        }
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
        const completedToday = tasks.filter(t => t.completed && t.date === new Date().toLocaleDateString('en-CA'));
        
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

    const setPriority = async (taskId: string, priority: string) => {
        const { error } = await supabase.from('tasks').update({ priority }).eq('id', taskId);
        if (!error) {
            loadTasks();
            window.dispatchEvent(new Event('workout_os_tasks_updated'));
        }
    };

    const handleAddQuickTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const titleInput = form.elements.namedItem('taskInput') as HTMLInputElement;
        const prioritySelect = form.elements.namedItem('prioritySelect') as HTMLSelectElement;
        const goalSelect = form.elements.namedItem('goalSelect') as HTMLSelectElement;
        const dueDateInput = form.elements.namedItem('dueDateInput') as HTMLInputElement;
        
        const title = titleInput.value.trim();
        if (!title) return;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { error } = await supabase.from('tasks').insert({
            user_id: user.id,
            date: new Date().toLocaleDateString('en-CA'),
            title: title,
            priority: prioritySelect ? prioritySelect.value : 'none',
            due_date: dueDateInput && dueDateInput.value ? dueDateInput.value : null,
            goal_id: goalSelect && goalSelect.value !== 'none' ? goalSelect.value : null,
        });
        
        if (!error) {
            titleInput.value = '';
            if (dueDateInput) dueDateInput.value = '';
            if (prioritySelect) prioritySelect.value = 'none';
            if (goalSelect) goalSelect.value = 'none';
            loadTasks();
            window.dispatchEvent(new Event('workout_os_tasks_updated'));
        }
    };

    const deleteTask = async (taskId: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
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
                                if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                                    window.navigator.vibrate([50, 50, 50]);
                                }
                                confetti({
                                    particleCount: 150,
                                    spread: 70,
                                    origin: { y: 0.6 },
                                    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
                                });
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
                <header className="py-8 flex flex-col gap-4 relative z-10">
                    <div>
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-on-background via-on-surface to-on-surface-variant drop-shadow-sm">Execution OS</h1>
                        <p className="text-on-surface-variant font-body text-base sm:text-lg opacity-80 tracking-wide mt-2">Capture, process, and execute relentlessly.</p>
                    </div>
                    
                    <button 
                        onClick={() => setIsWarRoomActive(true)}
                        className="self-start glass-button-premium bg-error/90 text-white font-black tracking-[0.1em] text-sm uppercase px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-error transition-all"
                    >
                        <Target className="w-5 h-5" />
                        Enter Mission Mode
                    </button>
                </header>

                <div className="flex bg-white/5 dark:bg-black/20 backdrop-blur-2xl p-1.5 rounded-[1.25rem] mb-10 border border-white/10 dark:border-white/5 shadow-inner overflow-x-auto hide-scrollbar relative z-10">
                    {(['now', 'brain', 'goals', 'reflect'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap relative z-10",
                                activeTab === tab 
                                    ? "text-on-surface shadow-[0_4px_15px_rgba(0,0,0,0.1)] bg-surface-container-high border border-surface-variant backdrop-blur-md" 
                                    : "text-on-surface-variant hover:text-on-surface opacity-60 hover:opacity-100 hover:bg-surface-container"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="space-y-6">
                    {/* NOW HUB */}
                    {activeTab === 'now' && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-4">
                            <div className="glass-card-premium p-8 flex flex-col gap-8 min-h-[400px] group">
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                                
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-[1rem] bg-primary/20 flex items-center justify-center border border-primary/30 text-primary dark:text-white shadow-[0_0_20px_rgba(var(--c-primary)/0.3)] backdrop-blur-md">
                                        <Target className="w-7 h-7" />
                                    </div>
                                    <h2 className="text-3xl font-display font-black text-on-surface tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-on-surface to-on-surface-variant">Daily Quests</h2>
                                </div>
                                
                                <form onSubmit={handleAddQuickTask} className="flex flex-col gap-3 relative z-10">
                                    <input 
                                        name="taskInput"
                                        type="text" 
                                        placeholder="Add a new task..." 
                                        className="w-full bg-surface-container border border-surface-variant rounded-[1.25rem] px-5 py-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-inner backdrop-blur-md placeholder:text-on-surface-variant/50 font-body-md"
                                    />
                                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-3 w-full">
                                        <input 
                                            name="dueDateInput"
                                            type="date"
                                            className="col-span-1 w-full sm:flex-1 sm:min-w-[130px] bg-surface-container border border-surface-variant rounded-xl sm:rounded-[1.25rem] px-3 py-3 sm:px-4 sm:py-4 text-sm sm:text-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner backdrop-blur-md font-body-md"
                                        />
                                        <select 
                                            name="prioritySelect"
                                            className="col-span-1 w-full sm:flex-1 sm:min-w-[110px] bg-surface-container border border-surface-variant rounded-xl sm:rounded-[1.25rem] px-3 py-3 sm:px-4 sm:py-4 text-sm sm:text-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner backdrop-blur-md font-body-md appearance-none"
                                        >
                                            <option value="none">No Priority</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                        <select 
                                            name="goalSelect"
                                            className="col-span-2 w-full sm:flex-1 sm:min-w-[130px] bg-surface-container border border-surface-variant rounded-xl sm:rounded-[1.25rem] px-3 py-3 sm:px-4 sm:py-4 text-sm sm:text-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner backdrop-blur-md font-body-md appearance-none truncate"
                                        >
                                            <option value="none">No Goal</option>
                                            {goals.map(g => (
                                                <option key={g.id} value={g.id}>{g.title}</option>
                                            ))}
                                        </select>
                                        <button type="submit" className="col-span-2 w-full sm:w-auto bg-primary text-on-primary px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-[1.25rem] font-black tracking-wide transition-all active:scale-95 shadow-[0_4px_20px_rgba(var(--c-primary)/0.4)] hover:shadow-[0_4px_30px_rgba(var(--c-primary)/0.6)] flex items-center justify-center hover:-translate-y-0.5 mt-1 sm:mt-0">
                                            Add Task
                                        </button>
                                    </div>
                                </form>

                                <div className="flex flex-col gap-3 relative z-10">
                                    {tasks.filter(t => !t.completed).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 opacity-60">
                                            <CheckCircle2 className="w-12 h-12 text-on-surface-variant mb-4 opacity-50" />
                                            <p className="text-on-surface-variant font-bold tracking-wide">Your execution queue is clear.</p>
                                        </div>
                                    ) : (
                                        tasks.filter(t => !t.completed).map(task => (
                                            <div key={task.id} className="group/item flex items-center gap-4 bg-surface-container-low hover:bg-surface-container p-4 rounded-2xl border border-surface-variant hover:border-surface-variant transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5">
                                                <button 
                                                    onClick={() => completeTask(task.id)}
                                                    className="w-7 h-7 rounded-full border-2 border-on-surface-variant/30 flex-shrink-0 hover:border-activity-green hover:bg-activity-green/20 transition-all flex items-center justify-center text-transparent hover:text-activity-green shadow-inner"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-on-surface font-body-md font-semibold truncate group-hover/item:text-primary transition-colors">{task.title}</h3>
                                                    {task.goal_id && goals.find(g => g.id === task.goal_id) && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-md mt-1 inline-block truncate max-w-full">
                                                            {goals.find(g => g.id === task.goal_id)?.title}
                                                        </span>
                                                    )}
                                                </div>

                                                <select 
                                                    value={task.priority || 'none'}
                                                    onChange={(e) => setPriority(task.id, e.target.value)}
                                                    className={clsx(
                                                        "text-[10px] font-black uppercase tracking-[0.15em] px-3 py-2 rounded-xl border focus:outline-none appearance-none cursor-pointer backdrop-blur-md transition-colors shadow-sm",
                                                        task.priority === 'high' ? 'bg-error-container text-on-error-container border-error/30 hover:bg-error/20' :
                                                        task.priority === 'medium' ? 'bg-surface-container-high text-on-surface border-surface-variant hover:bg-surface-container-highest' :
                                                        task.priority === 'low' ? 'bg-secondary-container text-on-secondary-container border-secondary/30 hover:bg-secondary/20' :
                                                        'bg-surface-container text-on-surface-variant border-surface-variant hover:bg-surface-container-high'
                                                    )}
                                                >
                                                    <option value="none">No Priority</option>
                                                    <option value="high">High</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="low">Low</option>
                                                </select>

                                                <button
                                                    onClick={() => deleteTask(task.id)}
                                                    className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 hover:border-error/30 transition-all ml-1"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BRAIN HUB */}
                    {activeTab === 'brain' && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-4">
                            <div className="bg-surface-container-lowest border border-surface-variant p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col gap-8 min-h-[400px] relative overflow-hidden group">
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                                
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-[1rem] bg-secondary/20 flex items-center justify-center border border-secondary/30 text-secondary shadow-[0_0_20px_rgba(var(--c-secondary)/0.3)] backdrop-blur-md">
                                        <BrainCircuit className="w-7 h-7" />
                                    </div>
                                    <h2 className="text-3xl font-display font-black text-on-surface tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-on-surface to-on-surface-variant">Brain Dump</h2>
                                </div>
                                <p className="text-on-surface-variant font-medium leading-relaxed relative z-10">
                                    Drop your unstructured thoughts here, or hold the mic to speak. Ava will instantly process it, extract actionable tasks, and organize them into your execution pipeline.
                                </p>
                                
                                <div className="relative mb-4 z-10">
                                    <textarea
                                        value={brainInput}
                                        onChange={(e) => setBrainInput(e.target.value)}
                                        placeholder="e.g., I need to buy groceries tomorrow, finish the TPS report, and email John about the project..."
                                        className="w-full h-48 bg-surface-container border border-surface-variant rounded-[1.25rem] p-6 pb-16 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary/50 transition-all shadow-inner backdrop-blur-md placeholder:text-on-surface-variant/50 font-body-md resize-none"
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
                                    className="relative z-10 bg-secondary text-on-secondary px-8 py-4 rounded-[1.25rem] font-black tracking-wide transition-all active:scale-95 shadow-[0_4px_20px_rgba(var(--c-secondary)/0.4)] hover:shadow-[0_4px_30px_rgba(var(--c-secondary)/0.6)] flex items-center justify-center gap-3 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {isParsing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                                    {isParsing ? 'Parsing with AI...' : 'Parse & Execute'}
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
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-4">
                            <div className="bg-surface-container-lowest border border-surface-variant p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col gap-8 min-h-[400px] relative overflow-hidden group">
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                                
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-[1rem] bg-tertiary/20 flex items-center justify-center border border-tertiary/30 text-tertiary shadow-[0_0_20px_rgba(var(--c-tertiary)/0.3)] backdrop-blur-md">
                                            <Target className="w-7 h-7" />
                                        </div>
                                        <h2 className="text-3xl font-display font-black text-on-surface tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-on-surface to-on-surface-variant">Macro Goals</h2>
                                    </div>
                                    <button 
                                        onClick={() => setIsAddingGoal(!isAddingGoal)}
                                        className="bg-surface-container hover:bg-surface-container-high text-on-surface border border-surface-variant px-5 py-2.5 rounded-[1rem] font-bold text-sm transition-all shadow-sm backdrop-blur-md hover:-translate-y-0.5"
                                    >
                                        {isAddingGoal ? 'Cancel' : 'Define Vector'}
                                    </button>
                                </div>
                                <p className="text-on-surface-variant font-medium leading-relaxed relative z-10 -mt-4">
                                    Define your high-level execution vectors. Everything you do on a daily basis should map back to these North Star targets.
                                </p>

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
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-4">
                            <div className="bg-surface-container-lowest border border-surface-variant p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col gap-8 min-h-[400px] relative overflow-hidden group">
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-[1rem] bg-primary/20 flex items-center justify-center border border-primary/30 text-primary shadow-[0_0_20px_rgba(var(--c-primary)/0.3)] backdrop-blur-md">
                                        <CheckCircle2 className="w-7 h-7" />
                                    </div>
                                    <h2 className="text-3xl font-display font-black text-on-surface tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-on-surface to-on-surface-variant">End of Day Review</h2>
                                </div>
                                <p className="text-on-surface-variant font-medium leading-relaxed relative z-10 -mt-4">
                                    Did you win the day? Log your thoughts, bottlenecks, and wins. Ava will process this to adjust your behavioral patterns and tomorrow's targets.
                                </p>
                                
                                <div className="relative mb-4 z-10">
                                    <textarea
                                        value={reflectInput}
                                        onChange={(e) => setReflectInput(e.target.value)}
                                        placeholder="e.g. Executed well on work tasks, but skipped the gym because I slept poorly. Need to fix sleep hygiene."
                                        className="w-full h-32 bg-surface-container border border-surface-variant rounded-[1.25rem] p-6 pb-16 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-inner backdrop-blur-md placeholder:text-on-surface-variant/50 font-body-md resize-none"
                                    />
                                    <button 
                                        onClick={toggleRecording}
                                        className={clsx(
                                            "absolute bottom-4 right-4 p-3 rounded-full transition-all shadow-md flex items-center gap-2",
                                            isRecording ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse" : "bg-white/5 border border-white/10 text-on-surface hover:bg-white/10"
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
                                    onClick={handleReflect}
                                    disabled={isReflecting || !reflectInput.trim()}
                                    className="relative z-10 bg-primary text-on-primary px-8 py-4 rounded-[1.25rem] font-black tracking-wide transition-all active:scale-95 shadow-[0_4px_20px_rgba(var(--c-primary)/0.4)] hover:shadow-[0_4px_30px_rgba(var(--c-primary)/0.6)] flex items-center justify-center gap-3 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {isReflecting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                                    {isReflecting ? 'Processing...' : 'Analyze & Store'}
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

