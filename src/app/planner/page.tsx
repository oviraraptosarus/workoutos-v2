'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import clsx from 'clsx';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Target, BrainCircuit, Plus, Trash2, Play, Pause, GripVertical, CheckCircle2, AlignLeft, Calendar, Circle, Bookmark, Clock, Star } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
export interface SubTask {
    id: string;
    title: string;
    completed: boolean;
}

export type TaskPriority = 'high' | 'medium' | 'low' | 'none';

export interface Task {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    subTasks: SubTask[];
    completed: boolean;
    priority: TaskPriority;
}

export default function PlannerPage() {
    // --- TASK MANAGER STATE (Synced with Dashboard) ---
    const TASKS_KEY = 'workout_os_tasks';
    const PRIORITIES_KEY = 'workout_os_planner_priorities';
    const FOCUS_KEY = 'workout_os_planner_focus';
    const HABITS_KEY = 'workout_os_planner_habits';

    const [tasks, setTasks] = useState<Task[]>([]);
    const [isClient, setIsClient] = useState(false);
    const { userProfile, updateUserProfile } = useAuth();

    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newPriority, setNewPriority] = useState<TaskPriority>('none');
    const [newSubTasks, setNewSubTasks] = useState<{id: string, title: string}[]>([]);

    // --- LOCAL WIDGET STATE (Not Synced) ---
    const [priorities, setPriorities] = useState<string[]>(['', '', '']);
    const [focusSessions, setFocusSessions] = useState([false, false, false, false]);
    const [habitsList, setHabitsList] = useState(['Wake up early', 'Deep focus block', 'Workout / Movement', 'Drink 3L Water', 'Read 10 pages', 'Review goals']);
    const [habitsState, setHabitsState] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setIsClient(true);
        const loadData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            // Load Tasks
            const { data: taskData } = await supabase.from('tasks').select('*').eq('user_id', user.id);
            if (taskData) {
                setTasks(taskData.map(d => ({
                    id: d.id,
                    title: d.title,
                    description: d.description || '',
                    dueDate: d.due_date || '',
                    subTasks: d.subtasks || [],
                    completed: d.completed || false,
                    priority: d.priority || 'none'
                })));
            }

            // Load Widgets from target_config
            const config = userProfile?.targetConfig || {};
            if (config.planner_priorities) setPriorities(config.planner_priorities);
            if (config.planner_focus) setFocusSessions(config.planner_focus);
            if (config.planner_habits_state) setHabitsState(config.planner_habits_state);
            if (config.planner_habits_list) setHabitsList(config.planner_habits_list);
        };
        loadData();
    }, [userProfile?.targetConfig]);

    const updateTargetConfig = async (updates: any) => {
        const currentConfig = userProfile?.targetConfig || {};
        await updateUserProfile({ targetConfig: { ...currentConfig, ...updates } });
    };

    const saveTasks = async (newTasks: Task[]) => {
        setTasks(newTasks);
        window.dispatchEvent(new Event('workout_os_tasks_updated'));
    };

    const handleAddTask = async () => {
        if (!newTitle.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newTaskObj = {
            user_id: user.id,
            date: new Date().toISOString().split('T')[0],
            title: newTitle,
            description: newDesc,
            due_date: newDate,
            subtasks: newSubTasks.map(st => ({ id: st.id, title: st.title, completed: false })),
            completed: false
        };

        // Insert with priority; fall back without it if the column isn't migrated yet.
        let { data } = await supabase.from('tasks').insert({ ...newTaskObj, priority: newPriority }).select().single();
        if (!data) {
            ({ data } = await supabase.from('tasks').insert(newTaskObj).select().single());
        }
        if (data) {
            const newTask: Task = {
                id: data.id,
                title: data.title,
                description: data.description || '',
                dueDate: data.due_date || '',
                subTasks: data.subtasks || [],
                completed: data.completed,
                priority: data.priority || newPriority
            };
            saveTasks([newTask, ...tasks]);
        }
        setNewTitle(''); setNewDesc(''); setNewDate(''); setNewPriority('none'); setNewSubTasks([]);
    };

    // Create a task directly from a title + priority (used by the priority→tasks
    // drag-drop). Writes to Supabase and syncs the dashboard via the shared event.
    const createTaskFromPriority = async (title: string, priority: TaskPriority) => {
        const clean = title.trim();
        if (!clean) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const base = {
            user_id: user.id,
            date: new Date().toISOString().split('T')[0],
            title: clean,
            description: '',
            due_date: '',
            subtasks: [],
            completed: false
        };
        // Try with priority; if the column isn't migrated yet the insert 400s, so
        // retry without it. Task still appears either way.
        let { data } = await supabase.from('tasks').insert({ ...base, priority }).select().single();
        if (!data) {
            ({ data } = await supabase.from('tasks').insert(base).select().single());
        }
        if (data) {
            const newTask: Task = {
                id: data.id, title: data.title, description: '', dueDate: '',
                subTasks: [], completed: false, priority: data.priority || priority
            };
            saveTasks([newTask, ...tasks]);
        }
    };

    const toggleTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        saveTasks(updated);
        await supabase.from('tasks').update({ completed: !task.completed }).eq('id', taskId);
    };

    const toggleSubTask = async (taskId: string, subTaskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const updatedSubTasks = task.subTasks.map(st => st.id === subTaskId ? { ...st, completed: !st.completed } : st);
        const updated = tasks.map(t => t.id === taskId ? { ...t, subTasks: updatedSubTasks } : t);
        
        saveTasks(updated);
        await supabase.from('tasks').update({ subtasks: updatedSubTasks }).eq('id', taskId);
    };

    const deleteTask = async (taskId: string) => {
        const updated = tasks.filter(t => t.id !== taskId);
        saveTasks(updated);
        await supabase.from('tasks').delete().eq('id', taskId);
    };

    const [isFocusModeActive, setIsFocusModeActive] = useState(false);
    const [focusTimeLeft, setFocusTimeLeft] = useState(25 * 60);

    useEffect(() => {
        let timer: any;
        if (isFocusModeActive && focusTimeLeft > 0) {
            timer = setInterval(() => setFocusTimeLeft(t => t - 1), 1000);
        } else if (focusTimeLeft === 0) {
            setIsFocusModeActive(false);
            setFocusTimeLeft(25 * 60);
        }
        return () => clearInterval(timer);
    }, [isFocusModeActive, focusTimeLeft]);

    const formatFocusTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <AppLayout>
            {isFocusModeActive && (
                <div className="fixed bottom-6 right-6 z-[999] bg-[#0f172a] shadow-2xl rounded-[2rem] border border-slate-700 p-6 flex flex-col items-center justify-center animate-in slide-in-from-bottom-10 fade-in duration-300 w-80">
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-2">
                            <BrainCircuit size={24} className="text-emerald-500 animate-pulse" />
                            <h2 className="text-sm font-black text-white tracking-widest uppercase">Deep Work</h2>
                        </div>
                        <div className="text-4xl font-black text-emerald-400 tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                            {formatFocusTime(focusTimeLeft)}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium px-4">All distractions are blocked. Focus on the task at hand.</p>
                        
                        <button 
                            onClick={() => { setIsFocusModeActive(false); setFocusTimeLeft(25 * 60); }}
                            className="mt-4 px-6 py-2 rounded-full border border-slate-700 text-slate-300 text-xs font-bold hover:bg-surface-container-high hover:text-white transition-all btn-press w-full"
                        >
                            End Session Early
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="w-10 h-10 rounded-full bg-card-white shadow-sm flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors btn-press">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-on-surface tracking-tight flex items-center gap-2">
                                <Target className="text-emerald-500" /> Planner
                            </h1>
                            <p className="text-sm text-on-surface-variant font-medium mt-0.5">Organize your action items</p>
                        </div>
                    </div>
                </div>

                {/* ROW 1: TASK MANAGER */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Add Task Section */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-card-white border border-surface-variant p-6 rounded-3xl shadow-sm border-t border-surface-variant relative overflow-hidden group">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-6 flex items-center gap-2">
                                <Plus size={18} className="text-emerald-500" /> New Task
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-on-surface-variant uppercase block mb-1.5 ml-1">Title</label>
                                    <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="What needs to be done?" className="w-full bg-card-white border border-surface-variant rounded-xl px-4 py-3 font-bold text-on-surface focus:outline-none focus:border-emerald-400 shadow-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-on-surface-variant uppercase block mb-1.5 ml-1 flex items-center gap-1"><AlignLeft size={10} /> Description</label>
                                    <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Add details..." className="w-full bg-card-white border border-surface-variant rounded-xl px-4 py-3 text-sm text-on-surface-variant focus:outline-none focus:border-emerald-400 shadow-sm resize-none h-20" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-on-surface-variant uppercase block mb-1.5 ml-1 flex items-center gap-1"><Calendar size={10} /> Due Date</label>
                                    <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-card-white border border-surface-variant rounded-xl px-4 py-3 text-sm text-on-surface-variant focus:outline-none focus:border-emerald-400 shadow-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-on-surface-variant uppercase block mb-1.5 ml-1">Sub-tasks</label>
                                    <div className="space-y-2 mb-3">
                                        {newSubTasks.map((st, i) => (
                                            <div key={st.id} className="flex items-center gap-2 bg-surface-container-low border border-surface-variant rounded-lg p-2">
                                                <GripVertical size={14} className="text-on-surface-variant" />
                                                <input type="text" value={st.title} onChange={(e) => { const copy = [...newSubTasks]; copy[i].title = e.target.value; setNewSubTasks(copy); }} className="flex-1 bg-transparent border-none focus:outline-none text-sm text-on-surface font-medium" placeholder="Sub-task title..." />
                                                <button onClick={() => setNewSubTasks(newSubTasks.filter(s => s.id !== st.id))} className="text-on-surface-variant hover:text-rose-500"><Trash2 size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setNewSubTasks([...newSubTasks, { id: Date.now().toString(), title: '' }])} className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                                        <Plus size={14} /> Add Sub-task
                                    </button>
                                </div>
                                <button onClick={handleAddTask} disabled={!newTitle.trim()} className="w-full mt-4 bg-gray-900 hover:bg-black text-white font-black text-sm uppercase tracking-wider py-4 rounded-2xl flex items-center justify-center gap-2 transition-all btn-press disabled:opacity-50">
                                    <Plus size={18} /> Save Task
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Task List Section — also a drop target for priorities */}
                    <div
                        className="lg:col-span-8 space-y-4"
                        onDragOver={(e) => {
                            if (e.dataTransfer.types.includes('priority_text')) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'copy';
                            }
                        }}
                        onDrop={(e) => {
                            const pText = e.dataTransfer.getData('priority_text');
                            const pRank = e.dataTransfer.getData('priority_rank');
                            if (pText) {
                                e.preventDefault();
                                // Rank 1 → high, 2 → medium, else low.
                                const level: TaskPriority = pRank === '1' ? 'high' : pRank === '2' ? 'medium' : 'low';
                                createTaskFromPriority(pText, level);
                            }
                        }}
                    >
                        {isClient && tasks.length === 0 ? (
                            <div className="bg-card-white border border-surface-variant p-10 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                                <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-on-surface-variant mb-4"><Target size={32} /></div>
                                <h3 className="font-bold text-on-surface mb-1">No tasks yet</h3>
                                <p className="text-sm text-on-surface-variant">Add a task on the left, or drag a priority here.</p>
                            </div>
                        ) : (
                            isClient && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tasks.map((task) => (
                                    <div key={task.id} className={`bg-card-white border border-surface-variant p-5 rounded-3xl shadow-sm border-t border-surface-variant transition-all ${task.completed ? 'opacity-60 bg-surface-container-low/50' : ''}`}>
                                        <div className="flex items-start gap-3">
                                            <button onClick={() => toggleTask(task.id)} className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-surface-variant text-transparent hover:border-emerald-400'}`}>
                                                <CheckCircle2 size={16} />
                                            </button>
                                            <div 
                                                className="flex-1 min-w-0"
                                                draggable
                                                onDragStart={(e) => e.dataTransfer.setData('task_title', task.title)}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {task.priority && task.priority !== 'none' && (
                                                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                                                                task.priority === 'high' ? 'bg-error/15 text-error'
                                                                : task.priority === 'medium' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                                                : 'bg-secondary/15 text-secondary'
                                                            }`}>
                                                                {task.priority}
                                                            </span>
                                                        )}
                                                        <h3 className={`font-bold text-on-surface text-lg cursor-grab active:cursor-grabbing truncate ${task.completed ? 'line-through text-on-surface-variant' : ''}`}>{task.title}</h3>
                                                    </div>
                                                    <button onClick={() => deleteTask(task.id)} className="text-on-surface-variant hover:text-rose-500 flex-shrink-0 p-1"><Trash2 size={16} /></button>
                                                </div>
                                                {task.dueDate && <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2"><Calendar size={12} /> Due: {new Date(task.dueDate).toLocaleDateString()}</div>}
                                                {task.description && <p className="text-sm text-on-surface-variant mb-3 whitespace-pre-wrap leading-relaxed">{task.description}</p>}
                                                {task.subTasks && task.subTasks.length > 0 && (
                                                    <div className="space-y-2 mt-3 pt-3 border-t border-surface-variant">
                                                        {task.subTasks.map(st => (
                                                            <div key={st.id} className="flex items-start gap-2 group">
                                                                <button onClick={() => toggleSubTask(task.id, st.id)} className="mt-0.5 text-on-surface-variant group-hover:text-emerald-500 flex-shrink-0">
                                                                    {st.completed ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} />}
                                                                </button>
                                                                <span className={`text-sm text-on-surface-variant font-medium ${st.completed ? 'line-through text-on-surface-variant' : ''}`}>{st.title}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ROW 2: LOCAL RESTORED WIDGETS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-surface-variant">
                    
                    {/* Top Priorities — dynamic, drag into Tasks to promote */}
                    <div className="bg-card-white border border-surface-variant p-5 rounded-3xl shadow-sm">
                        <div className="text-on-surface-variant text-xs font-bold mb-4 flex items-center justify-between uppercase tracking-wider">
                            <div className="flex items-center gap-2"><Bookmark size={14} className="text-emerald-500" /> Top Priorities</div>
                            <button
                                onClick={() => {
                                    const p = [...priorities, ''];
                                    setPriorities(p);
                                    updateTargetConfig({ planner_priorities: p });
                                }}
                                className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded flex items-center gap-1 active:scale-95 transition-transform"
                            >
                                <Plus size={10} /> Add
                            </button>
                        </div>
                        <p className="text-[10px] text-on-surface-variant mb-3 -mt-2">Drag a priority into Tasks to turn it into a tracked task.</p>
                        <div className="space-y-3">
                            {priorities.map((priorityText, i) => (
                                <div
                                    key={i}
                                    draggable
                                    onDragStart={(e) => {
                                        // Carry the priority text + rank so the Tasks drop target can promote it.
                                        e.dataTransfer.setData('priority_text', priorityText || `Priority ${i + 1}`);
                                        e.dataTransfer.setData('priority_rank', String(i + 1));
                                        e.dataTransfer.setData('text/plain', i.toString());
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const taskTitle = e.dataTransfer.getData('task_title');
                                        if (taskTitle) {
                                            const p = [...priorities];
                                            p[i] = taskTitle;
                                            setPriorities(p);
                                            updateTargetConfig({ planner_priorities: p });
                                            return;
                                        }
                                        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                                        if (!isNaN(fromIdx) && fromIdx !== i) {
                                            const p = [...priorities];
                                            [p[fromIdx], p[i]] = [p[i], p[fromIdx]];
                                            setPriorities(p);
                                            updateTargetConfig({ planner_priorities: p });
                                        }
                                    }}
                                    className="flex items-center gap-2 bg-surface-container p-2 rounded-xl border border-surface-variant cursor-move hover:border-emerald-400 hover:shadow-sm transition-all group"
                                >
                                    <GripVertical size={14} className="text-on-surface-variant group-hover:text-emerald-500 transition-colors shrink-0" />
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-[10px] shrink-0">
                                        {i + 1}
                                    </div>
                                    <input
                                        type="text"
                                        value={priorityText}
                                        onChange={(e) => {
                                            const p = [...priorities];
                                            p[i] = e.target.value;
                                            setPriorities(p);
                                            updateTargetConfig({ planner_priorities: p });
                                        }}
                                        placeholder={`Priority ${i + 1}`}
                                        className="flex-1 min-w-0 bg-transparent border-none text-sm text-on-surface font-medium focus:outline-none placeholder:text-on-surface-variant/50"
                                    />
                                    {/* Non-drag fallback: promote to a task on click */}
                                    <button
                                        onClick={() => createTaskFromPriority(priorityText || `Priority ${i + 1}`, i === 0 ? 'high' : i === 1 ? 'medium' : 'low')}
                                        aria-label="Promote to task"
                                        title="Send to Tasks"
                                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-on-surface-variant hover:text-emerald-500 transition-all shrink-0 p-1"
                                    >
                                        <ArrowLeft size={13} className="rotate-[135deg]" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const p = priorities.filter((_, idx) => idx !== i);
                                            setPriorities(p);
                                            updateTargetConfig({ planner_priorities: p });
                                        }}
                                        aria-label="Remove priority"
                                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-on-surface-variant hover:text-error transition-all shrink-0 p-1"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}
                            {priorities.length === 0 && (
                                <p className="text-center text-on-surface-variant text-xs py-3">No priorities. Tap Add.</p>
                            )}
                        </div>
                    </div>

                    {/* Focus Sessions */}
                    <div className="bg-card-white border border-surface-variant p-5 rounded-3xl shadow-sm border-t border-surface-variant">
                        <div className="text-on-surface-variant text-xs font-bold mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <BrainCircuit size={14} className="text-emerald-500" /> Focus Sessions
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {[1, 2, 3, 4].map((num, i) => (
                                <div 
                                    key={i} 
                                    className={clsx("border rounded-2xl p-3 flex justify-between items-center transition-colors cursor-pointer", focusSessions[i] ? "bg-emerald-50 border-emerald-200" : "bg-surface-container border-surface-variant hover:border-surface-variant")}
                                    onClick={() => {
                                        const n = [...focusSessions];
                                        n[i] = !n[i];
                                        setFocusSessions(n);
                                        updateTargetConfig({ planner_focus: n });
                                        if (n[i]) {
                                            setIsFocusModeActive(true);
                                            setFocusTimeLeft(25 * 60);
                                        }
                                    }}
                                >
                                    <div>
                                        <div className="text-xs font-bold text-on-surface mb-0.5">SESSION {num}</div>
                                        <div className="text-[10px] text-on-surface-variant flex items-center gap-1"><Clock size={10} /> 25 MIN</div>
                                    </div>
                                    <div className={clsx("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", focusSessions[i] ? "bg-emerald-500 border-emerald-500 text-white" : "border-surface-variant")}>
                                        {focusSessions[i] && <CheckCircle2 size={12} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Habits to Build */}
                    <div className="bg-card-white border border-surface-variant p-5 rounded-3xl shadow-sm border-t border-surface-variant">
                        <div className="text-on-surface-variant text-xs font-bold mb-4 flex items-center justify-between uppercase tracking-wider">
                            <div className="flex items-center gap-2"><Star size={14} className="text-emerald-500" /> Habits</div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => {
                                        const nh = [...habitsList, 'New Habit'];
                                        setHabitsList(nh);
                                        updateTargetConfig({ planner_habits_list: nh });
                                    }}
                                    className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-100 flex items-center gap-1"
                                >
                                    <Plus size={10} /> Add
                                </button>
                                <div className="flex gap-2 text-[9px] text-on-surface-variant w-40 justify-between px-1">
                                    <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {habitsList.map((habit, i) => (
                                <div key={i} className="flex justify-between items-center gap-2 group">
                                    <div className="flex items-center gap-2 text-[13px] font-bold text-on-surface truncate pr-1 flex-1 min-w-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></div>
                                        <input
                                            type="text"
                                            value={habit}
                                            placeholder="Name this habit"
                                            onChange={(e) => {
                                                const nh = [...habitsList];
                                                nh[i] = e.target.value;
                                                setHabitsList(nh);
                                                updateTargetConfig({ planner_habits_list: nh });
                                            }}
                                            className="bg-transparent border-none focus:outline-none focus:bg-surface-container rounded px-1 py-0.5 w-full text-on-surface placeholder:text-on-surface-variant/50 hover:bg-surface-container-low transition-colors"
                                        />
                                        <button
                                            onClick={() => {
                                                const nh = habitsList.filter((_, idx) => idx !== i);
                                                setHabitsList(nh);
                                                
                                                // Reindex the check states so days don't shift onto other habits.
                                                const remapped: Record<string, boolean> = {};
                                                nh.forEach((_, newIdx) => {
                                                    const oldIdx = newIdx < i ? newIdx : newIdx + 1;
                                                    [1,2,3,4,5,6,7].forEach((day) => {
                                                        if (habitsState[`${oldIdx}_${day}`]) remapped[`${newIdx}_${day}`] = true;
                                                    });
                                                });
                                                setHabitsState(remapped);
                                                updateTargetConfig({ 
                                                    planner_habits_list: nh,
                                                    planner_habits_state: remapped 
                                                });
                                            }}
                                            aria-label={`Delete habit ${habit}`}
                                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-on-surface-variant hover:text-error transition-all flex-shrink-0 p-1"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                    <div className="flex gap-2 w-40 justify-between flex-shrink-0 items-center">
                                        {[1,2,3,4,5,6,7].map((day) => {
                                            const key = `${i}_${day}`;
                                            return (
                                                <input
                                                    key={day}
                                                    type="checkbox"
                                                    checked={habitsState[key] || false}
                                                    onChange={(e) => {
                                                        const newState = { ...habitsState, [key]: e.target.checked };
                                                        setHabitsState(newState);
                                                        updateTargetConfig({ planner_habits_state: newState });
                                                    }}
                                                    className="accent-emerald-500 w-5 h-5 cursor-pointer opacity-40 hover:opacity-100 checked:opacity-100 transition-all rounded-sm"
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            {habitsList.length === 0 && (
                                <p className="text-center text-on-surface-variant text-[13px] py-4">No habits yet. Tap Add to create one.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
