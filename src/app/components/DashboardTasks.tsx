'use client';

import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Circle, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Task } from '@/app/planner/page';
import { useDate } from '@/contexts/DateContext';

const getTasks = (date: string | null) => {
    return [];
};

export default function DashboardTasks() {
    const { selectedDate } = useDate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [highlight, setHighlight] = useState(false);
    const [isClient, setIsClient] = useState(false);

    const loadTasks = () => {
        setTasks(getTasks(selectedDate));
    };

    useEffect(() => {
        setIsClient(true);
        loadTasks();

        // Listen for custom event from Planner
        const handleUpdate = () => loadTasks();
        window.addEventListener('workout_os_tasks_updated', handleUpdate);
        
        // Listen for storage events (if changed from another tab)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === `workout_os_tasks_${selectedDate}`) loadTasks();
        };
        window.addEventListener('storage', handleStorage);
        
        const handleHighlight = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.target === 'tasks') {
                setHighlight(true);
                setTimeout(() => setHighlight(false), 2000);
            }
        };
        window.addEventListener('workout_os_highlight', handleHighlight);

        return () => {
            window.removeEventListener('workout_os_tasks_updated', handleUpdate);
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('workout_os_highlight', handleHighlight);
        };
    }, [selectedDate]);

    const toggleTask = (taskId: string) => {
        const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        setTasks(updated);
    };

    if (!isClient) return null;

    const pendingTasks = tasks.filter(t => !t.completed).slice(0, 3);
    const hasMore = tasks.filter(t => !t.completed).length > 3;

    return (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
                    <Target size={20} className="text-emerald-500" /> Upcoming Tasks
                </h2>
                <Link href="/planner" className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 uppercase tracking-wider flex items-center transition-colors btn-press">
                    View All <ChevronRight size={14} />
                </Link>
            </div>

            <div className={`bg-white dark:bg-slate-900 border ${highlight ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-gray-100 dark:border-slate-800'} p-5 rounded-3xl shadow-sm space-y-3 flex-1 transition-all duration-500`}>
                {pendingTasks.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-sm font-medium text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">All caught up!</p>
                        <Link href="/planner" className="text-xs font-bold text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 mt-2 inline-block">
                            + Add a new task
                        </Link>
                    </div>
                ) : (
                    pendingTasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-3 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-gray-100 dark:border-slate-700">
                            <button 
                                onClick={() => toggleTask(task.id)}
                                className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 dark:border-slate-600 text-transparent hover:border-emerald-400 dark:hover:border-emerald-500 flex items-center justify-center transition-colors"
                            >
                                <CheckCircle2 size={12} />
                            </button>
                            
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 dark:text-gray-200 text-sm truncate">{task.title}</h3>
                                {task.dueDate && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-1">
                                        <Calendar size={10} /> Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                )}
                                {task.subTasks && task.subTasks.length > 0 && (
                                    <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                        <Target size={10} /> {task.subTasks.filter(st => st.completed).length} / {task.subTasks.length} sub-tasks
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {hasMore && (
                    <div className="text-center pt-2">
                        <Link href="/planner" className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
                            + {tasks.filter(t => !t.completed).length - 3} more tasks...
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
