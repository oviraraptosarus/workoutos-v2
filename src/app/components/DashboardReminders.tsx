'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Circle, Loader2, Target, Calendar } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';
import { useRewardSystem } from '@/lib/hooks/useRewardSystem';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';

export default function DashboardReminders() {
    const { upcomingReminders, fetchUpcomingReminders, toggleTask, addTask } = useTaskStore();
    const { user } = useAuth();
    const { triggerSuccess } = useRewardSystem();
    const { isSupported, isSubscribed, subscribeToPush } = usePushNotifications();
    const [aiInput, setAiInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (user) {
            fetchUpcomingReminders();
        }
    }, [user, fetchUpcomingReminders]);

    const handleToggleReminder = async (taskId: string) => {
        triggerSuccess();
        await toggleTask(taskId);
        setTimeout(() => fetchUpcomingReminders(), 500);
    };

    const handleAddReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiInput.trim()) return;

        setIsGenerating(true);
        try {
            // We just hit our AI endpoint with a strict command
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `remind me to ${aiInput}`,
                    appState: { 
                        localTime: new Date().toISOString(),
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
                    },
                    currentDateTime: new Date().toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
                })
            });

            if (!res.ok) throw new Error('Failed to set reminder');
            
            const data = await res.json();
            
            // Execute the tool locally if the AI provided one
            if (data.functionCall && data.functionCall.name === 'add_task') {
                const args = data.functionCall.arguments || {};
                await addTask({
                    title: args.title || aiInput,
                    due_date: args.dueDate || new Date().toLocaleDateString('en-CA'),
                    due_time: args.dueTime || null,
                    reminder_time: args.reminderTime || null,
                    recurrenceRule: args.recurrenceRule || null,
                    priority: args.priority || 'medium',
                    category: args.category || 'General'
                });
            } else {
                throw new Error("AI didn't understand the reminder format.");
            }
            
            setAiInput('');
            setTimeout(() => fetchUpcomingReminders(), 1000);
        } catch (err: any) {
            alert('Failed to set reminder: ' + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                    <Bell size={20} className="text-secondary" /> Reminders
                </h2>
                {isSupported && !isSubscribed && (
                    <button 
                        onClick={subscribeToPush}
                        className="text-[10px] font-bold bg-secondary/10 text-secondary hover:bg-secondary/20 px-2 py-1 rounded-md transition-colors"
                    >
                        Enable Push
                    </button>
                )}
            </div>

            <div className="relative glass-card-premium border border-white/10 p-6 space-y-4 flex-1 transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] flex flex-col">
                
                {/* AI Quick Add Input */}
                <form onSubmit={handleAddReminder} className="relative z-10 flex gap-2">
                    <input 
                        type="text" 
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder="e.g. make my bed at 9pm" 
                        disabled={isGenerating}
                        className="glass-input-premium flex-1 rounded-[1rem] px-4 py-3 text-sm text-on-surface disabled:opacity-50"
                    />
                    <button 
                        type="submit" 
                        disabled={!aiInput.trim() || isGenerating} 
                        className="glass-button-premium px-4 py-3 rounded-[1rem] text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[70px]"
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : 'Set'}
                    </button>
                </form>

                <div className="pt-2 flex-1 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {upcomingReminders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-6 h-full text-on-surface-variant">
                            <Bell size={24} className="opacity-50" />
                            <p className="text-xs font-medium">No upcoming reminders</p>
                        </div>
                    ) : (
                        upcomingReminders.map((task) => (
                            <div key={task.id} className="group/item flex items-start gap-3 bg-white/5 dark:bg-white/5 hover:bg-white/10 backdrop-blur-md p-3.5 rounded-[1rem] border border-white/5 hover:border-white/20 transition-all duration-300 shadow-sm relative z-10">
                                <button 
                                    onClick={() => handleToggleReminder(task.id)}
                                    className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-on-surface-variant/30 hover:border-activity-green hover:bg-activity-green/20 transition-all flex items-center justify-center text-transparent hover:text-activity-green shadow-inner"
                                >
                                    <CheckCircle2 size={12} />
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-body-md text-sm text-on-surface truncate" title={task.full_title || task.title}>
                                        {task.title}
                                    </h3>
                                    
                                    {task.reminder_time && (
                                        <div className="flex items-center gap-1 font-label-sm text-[10px] text-secondary uppercase tracking-wider mt-1">
                                            <Bell size={10} /> {new Date(task.reminder_time).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
