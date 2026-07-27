'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Target, Calendar, CheckCircle2, Circle, Plus, Trash2, ArrowLeft, AlignLeft, GripVertical, Bookmark, BrainCircuit, Star, Clock } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

export interface SubTask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    subTasks: SubTask[];
    completed: boolean;
}

export default function PlannerPage() {
    // --- TASK MANAGER STATE (Synced with Dashboard) ---
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isClient, setIsClient] = useState(false);

    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newSubTasks, setNewSubTasks] = useState<{id: string, title: string}[]>([]);

    // --- LOCAL WIDGET STATE (Not Synced) ---
    const [priorities, setPriorities] = useState(['', '', '']);
    const [focusSessions, setFocusSessions] = useState([false, false, false, false]);
    const habitsList = ['Wake up early', 'Deep focus block', 'Workout / Movement', 'Drink 3L Water', 'Read 10 pages', 'Review goals'];
    const [habitsState, setHabitsState] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setIsClient(true);
    }, []);

    const saveTasks = (newTasks: Task[]) => {
        setTasks(newTasks);
        window.dispatchEvent(new Event('workout_os_tasks_updated'));
    };

    const handleAddTask = () => {
        if (!newTitle.trim()) return;
        const newTask: Task = {
            id: Date.now().toString(),
            title: newTitle,
            description: newDesc,
            dueDate: newDate,
            subTasks: newSubTasks.map(st => ({ id: st.id, title: st.title, completed: false })),
            completed: false
        };
        saveTasks([newTask, ...tasks]);
        setNewTitle(''); setNewDesc(''); setNewDate(''); setNewSubTasks([]);
    };

    const toggleTask = (taskId: string) => {
        const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        saveTasks(updated);
    };

    const toggleSubTask = (taskId: string, subTaskId: string) => {
        const updated = tasks.map(t => {
            if (t.id === taskId) {
                const updatedSubTasks = t.subTasks.map(st => st.id === subTaskId ? { ...st, completed: !st.completed } : st);
                return { ...t, subTasks: updatedSubTasks };
            }
            return t;
        });
        saveTasks(updated);
    };

    const deleteTask = (taskId: string) => {
        const updated = tasks.filter(t => t.id !== taskId);
        saveTasks(updated);
    };

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors btn-press">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                <Target className="text-emerald-500" /> Planner
                            </h1>
                            <p className="text-sm text-gray-500 font-medium mt-0.5">Organize your action items</p>
                        </div>
                    </div>
                </div>

                {/* ROW 1: TASK MANAGER */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Add Task Section */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm border-t border-gray-200 relative overflow-hidden group">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-6 flex items-center gap-2">
                                <Plus size={18} className="text-emerald-500" /> New Task
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 ml-1">Title</label>
                                    <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="What needs to be done?" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:border-emerald-400 shadow-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 ml-1 flex items-center gap-1"><AlignLeft size={10} /> Description</label>
                                    <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Add details..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-emerald-400 shadow-sm resize-none h-20" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 ml-1 flex items-center gap-1"><Calendar size={10} /> Due Date</label>
                                    <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-emerald-400 shadow-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 ml-1">Sub-tasks</label>
                                    <div className="space-y-2 mb-3">
                                        {newSubTasks.map((st, i) => (
                                            <div key={st.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-2">
                                                <GripVertical size={14} className="text-gray-300" />
                                                <input type="text" value={st.title} onChange={(e) => { const copy = [...newSubTasks]; copy[i].title = e.target.value; setNewSubTasks(copy); }} className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-800 font-medium" placeholder="Sub-task title..." />
                                                <button onClick={() => setNewSubTasks(newSubTasks.filter(s => s.id !== st.id))} className="text-gray-400 hover:text-rose-500"><Trash2 size={14} /></button>
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

                    {/* Task List Section */}
                    <div className="lg:col-span-8 space-y-4">
                        {isClient && tasks.length === 0 ? (
                            <div className="bg-white border border-gray-100 p-10 rounded-3xl shadow-sm border-t border-gray-200 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-4"><Target size={32} /></div>
                                <h3 className="font-bold text-gray-900 mb-1">No tasks yet</h3>
                                <p className="text-sm text-gray-500">Add a task on the left to get started.</p>
                            </div>
                        ) : (
                            isClient && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tasks.map((task) => (
                                    <div key={task.id} className={`bg-white border border-gray-100 p-5 rounded-3xl shadow-sm border-t border-gray-200 transition-all ${task.completed ? 'opacity-60 bg-gray-50/50' : ''}`}>
                                        <div className="flex items-start gap-3">
                                            <button onClick={() => toggleTask(task.id)} className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-transparent hover:border-emerald-400'}`}>
                                                <CheckCircle2 size={16} />
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h3 className={`font-bold text-gray-900 text-lg ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</h3>
                                                    <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-rose-500 flex-shrink-0 p-1"><Trash2 size={16} /></button>
                                                </div>
                                                {task.dueDate && <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2"><Calendar size={12} /> Due: {new Date(task.dueDate).toLocaleDateString()}</div>}
                                                {task.description && <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap leading-relaxed">{task.description}</p>}
                                                {task.subTasks && task.subTasks.length > 0 && (
                                                    <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                                                        {task.subTasks.map(st => (
                                                            <div key={st.id} className="flex items-start gap-2 group">
                                                                <button onClick={() => toggleSubTask(task.id, st.id)} className="mt-0.5 text-gray-400 group-hover:text-emerald-500 flex-shrink-0">
                                                                    {st.completed ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} />}
                                                                </button>
                                                                <span className={`text-sm text-gray-700 font-medium ${st.completed ? 'line-through text-gray-400' : ''}`}>{st.title}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
                    
                    {/* Top Priorities */}
                    <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm border-t border-gray-200">
                        <div className="text-gray-700 text-xs font-bold mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <Bookmark size={14} className="text-emerald-500" /> Top Priorities
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((num, i) => (
                                <div key={i} className="flex items-center gap-3 bg-gray-100 p-2 rounded-xl border border-gray-100">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-[10px]">
                                        {num}
                                    </div>
                                    <input 
                                        type="text" 
                                        value={priorities[i]}
                                        onChange={(e) => {
                                            const p = [...priorities];
                                            p[i] = e.target.value;
                                            setPriorities(p);
                                        }}
                                        placeholder={`Priority ${num}`}
                                        className="flex-1 bg-transparent border-none text-sm text-gray-900 font-medium focus:outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Focus Sessions */}
                    <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm border-t border-gray-200">
                        <div className="text-gray-700 text-xs font-bold mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <BrainCircuit size={14} className="text-emerald-500" /> Focus Sessions
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {[1, 2, 3, 4].map((num, i) => (
                                <div 
                                    key={i} 
                                    className={clsx("border rounded-2xl p-3 flex justify-between items-center transition-colors cursor-pointer", focusSessions[i] ? "bg-emerald-50 border-emerald-200" : "bg-gray-100 border-gray-100 hover:border-gray-300")}
                                    onClick={() => {
                                        const n = [...focusSessions];
                                        n[i] = !n[i];
                                        setFocusSessions(n);
                                    }}
                                >
                                    <div>
                                        <div className="text-xs font-bold text-gray-900 mb-0.5">SESSION {num}</div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={10} /> 25 MIN</div>
                                    </div>
                                    <div className={clsx("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", focusSessions[i] ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300")}>
                                        {focusSessions[i] && <CheckCircle2 size={12} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Habits to Build */}
                    <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm border-t border-gray-200">
                        <div className="text-gray-700 text-xs font-bold mb-4 flex items-center justify-between uppercase tracking-wider">
                            <div className="flex items-center gap-2"><Star size={14} className="text-emerald-500" /> Habits</div>
                            <div className="flex gap-2 text-[9px] text-gray-400 w-32 justify-between px-1">
                                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {habitsList.map((habit, i) => (
                                <div key={i} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-700 truncate pr-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></div>
                                        {habit}
                                    </div>
                                    <div className="flex gap-2 w-32 justify-between flex-shrink-0">
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
                                                    }}
                                                    className="accent-emerald-500 w-3 h-3 cursor-pointer opacity-40 hover:opacity-100 checked:opacity-100" 
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
