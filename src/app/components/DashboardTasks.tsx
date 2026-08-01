'use client';

import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Circle, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Task } from '@/app/planner/page';
import { useDate } from '@/contexts/DateContext';
import { useTaskStore } from '@/store/useTaskStore';

export default function DashboardTasks() {
    const { selectedDate } = useDate();
    const { tasks, fetchTasks, toggleTask } = useTaskStore();
    const [highlight, setHighlight] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (selectedDate) {
            fetchTasks(selectedDate);
        } else {
            fetchTasks(new Date().toISOString().split('T')[0]);
        }

        const handleUpdate = () => {
            fetchTasks(selectedDate || new Date().toISOString().split('T')[0]);
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

    if (!isClient) return null;

    const pendingTasks = tasks.filter(t => !t.completed).slice(0, 3);
    const hasMore = tasks.filter(t => !t.completed).length > 3;

    return (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="font-headline-md text-lg text-on-surface flex items-center gap-2 tracking-tight">
                    <Target size={20} className="text-activity-green" /> Upcoming Tasks
                </h2>
                <Link href="/planner" className="font-label-sm text-[11px] text-on-surface-variant hover:text-secondary uppercase tracking-wider flex items-center transition-colors btn-press">
                    View All <ChevronRight size={14} />
                </Link>
            </div>

            <div className={`bg-white dark:bg-surface-container-lowest border ${highlight ? 'border-activity-green shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-black/5 dark:border-white/5'} p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] space-y-3 flex-1 transition-all duration-500 relative overflow-hidden hover:shadow-lg`}>
                {pendingTasks.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="font-label-sm text-sm text-on-surface-variant">All caught up!</p>
                        <Link href="/planner" className="font-label-sm text-[11px] text-activity-green hover:opacity-80 mt-2 inline-block transition-opacity">
                            + Add a new task
                        </Link>
                    </div>
                ) : (
                    pendingTasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-3 bg-surface-container-low p-3 rounded-xl border border-surface-variant">
                            <button 
                                onClick={() => handleToggleTask(task.id)}
                                className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-variant text-transparent hover:border-activity-green flex items-center justify-center transition-colors"
                            >
                                <CheckCircle2 size={12} />
                            </button>
                            
                            <div className="flex-1 min-w-0">
                                <h3 className="font-body-md text-sm text-on-surface truncate">{task.title}</h3>
                                {task.dueDate && (
                                    <div className="flex items-center gap-1 font-label-sm text-[10px] text-activity-green uppercase tracking-wider mt-1">
                                        <Calendar size={10} /> Due: {new Date(task.dueDate).toLocaleDateString()}
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
            </div>
        </section>
    );
}
