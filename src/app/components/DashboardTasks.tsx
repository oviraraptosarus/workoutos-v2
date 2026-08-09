'use client';

import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Circle, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Task } from '@/store/useTaskStore';
import { useDate } from '@/contexts/DateContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaskStore } from '@/store/useTaskStore';

export default function DashboardTasks() {
    const { selectedDate } = useDate();
    const { t } = useLanguage();
    const { tasks, fetchTasks, toggleTask, addTask } = useTaskStore();
    const [highlight, setHighlight] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    useEffect(() => {
        setIsClient(true);
        if (selectedDate) {
            fetchTasks(selectedDate);
        } else {
            fetchTasks(new Date().toLocaleDateString('en-CA'));
        }

        const handleUpdate = () => {
            fetchTasks(selectedDate || new Date().toLocaleDateString('en-CA'));
        };
        window.addEventListener('workout_os_tasks_updated', handleUpdate);

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
            window.removeEventListener('workout_os_highlight', handleHighlight);
        };
    }, [selectedDate, fetchTasks]);

    const handleToggleTask = async (taskId: string) => {
        await toggleTask(taskId);
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        await addTask({ title: newTaskTitle.trim(), priority: 'none' });
        setNewTaskTitle('');
        // Let the store handle the local update optimistically, or fetch again
        fetchTasks(selectedDate || new Date().toLocaleDateString('en-CA'));
    };

    if (!isClient) return null;

    const pendingTasks = tasks.filter(t => !t.completed).slice(0, 3);
    const hasMore = tasks.filter(t => !t.completed).length > 3;

    return (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                    <Target size={20} className="text-primary" /> {t('dash.tasks')}
                </h2>
                <Link href="/planner" className="font-label-sm text-[11px] text-on-surface-variant hover:text-secondary uppercase tracking-wider flex items-center transition-colors btn-press">
                    View All <ChevronRight size={14} />
                </Link>
            </div>

            <div className={`glass-card-premium border ${highlight ? 'border-activity-green shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-white/10'} p-6 space-y-4 flex-1 transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)]`}>
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                
                {pendingTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-6">
                        <div className="w-12 h-12 rounded-full bg-surface-container-high dark:bg-surface-container-high flex items-center justify-center text-activity-green shadow-inner">
                            <Target size={24} />
                        </div>
                        <div className="text-center">
                            <p className="font-label-md font-bold text-on-surface">{t('tasks.allCaughtUp')}</p>
                            <p className="font-label-sm text-xs text-on-surface-variant mt-0.5">{t('tasks.noPending')}</p>
                        </div>
                    </div>
                ) : (
                    pendingTasks.map((task) => (
                        <div key={task.id} className="group/item flex items-start gap-3 bg-white/5 dark:bg-white/5 hover:bg-white/10 backdrop-blur-md p-3.5 rounded-[1rem] border border-white/5 hover:border-white/20 transition-all duration-300 shadow-sm relative z-10">
                            <button 
                                onClick={() => handleToggleTask(task.id)}
                                className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-on-surface-variant/30 hover:border-activity-green hover:bg-activity-green/20 transition-all flex items-center justify-center text-transparent hover:text-activity-green shadow-inner"
                            >
                                <CheckCircle2 size={12} />
                            </button>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    {task.priority && task.priority !== 'none' && (
                                        <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                                            task.priority === 'high' ? 'bg-error/15 text-error'
                                            : task.priority === 'medium' ? 'bg-white/15 text-white dark:text-white'
                                            : 'bg-secondary/15 text-secondary'
                                        }`}>
                                            {task.priority}
                                        </span>
                                    )}
                                    <h3 className="font-body-md text-sm text-on-surface truncate" title={task.full_title || task.title}>
                                        {task.title}
                                    </h3>
                                </div>
                                {task.due_date && (
                                    <div className="flex items-center gap-1 font-label-sm text-[10px] text-activity-green uppercase tracking-wider mt-1">
                                        <Calendar size={10} /> Due: {new Date(task.due_date).toLocaleDateString()}
                                    </div>
                                )}
                                {task.subTasks && task.subTasks.length > 0 && (
                                    <div className="font-label-sm text-[11px] text-on-surface-variant mt-1 flex items-center gap-1">
                                        <Target size={10} /> {task.subTasks.filter(st => st.completed).length} / {task.subTasks.length} sub-tasks
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {hasMore && (
                    <div className="text-center pt-2">
                        <Link href="/planner" className="font-label-sm text-xs text-on-surface-variant hover:text-on-surface transition-colors">
                            + {tasks.filter(t => !t.completed).length - 3} more tasks...
                        </Link>
                    </div>
                )}

                <form onSubmit={handleAddTask} className="mt-auto pt-4 border-t border-white/10 flex gap-2 relative z-10">
                    <input 
                        type="text" 
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Add a new task..." 
                        className="glass-input-premium flex-1 rounded-[1rem] px-4 py-3 text-sm text-on-surface"
                    />
                    <button type="submit" disabled={!newTaskTitle.trim()} className="glass-button-premium px-4 py-3 rounded-[1rem] text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        Add
                    </button>
                </form>
            </div>
        </section>
    );
}

