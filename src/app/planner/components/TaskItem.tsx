'use client';

import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle2, X, Calendar, Bell, AlignLeft, ChevronDown, ChevronUp, Save } from 'lucide-react';
import clsx from 'clsx';
import { useSwipe } from '@/lib/hooks/useSwipe';
import { useHaptics } from '@/lib/hooks/useHaptics';
import { useRewardSystem } from '@/lib/hooks/useRewardSystem';

interface TaskItemProps {
    task: any;
    goals: any[];
    onComplete: (id: string) => void;
    onSetPriority: (id: string, priority: string) => void;
    onUpdateDetails: (id: string, details: any) => void;
    onDelete: (id: string) => void;
}

export default function TaskItem({ task, goals, onComplete, onSetPriority, onUpdateDetails, onDelete }: TaskItemProps) {
    const itemRef = useRef<HTMLDivElement>(null);
    const [showDelete, setShowDelete] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Edit state
    const [editTitle, setEditTitle] = useState(task.title || '');
    const [editNotes, setEditNotes] = useState(task.description || '');
    const [editDueDate, setEditDueDate] = useState(task.due_date || '');
    const [editDueTime, setEditDueTime] = useState(task.due_time || '');
    const [editRecurrenceRule, setEditRecurrenceRule] = useState(task.recurrence_rule || 'none');
    const [isRepeatDropdownOpen, setIsRepeatDropdownOpen] = useState(false);

    const repeatOptions = [
        { value: 'none', label: 'Does not repeat' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' }
    ];
    
    // We store reminder time as datetime-local string
    const formatDateTimeLocal = (isoString: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return '';
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };
    const [editReminderTime, setEditReminderTime] = useState(formatDateTimeLocal(task.reminder_time));

    const { hapticTap, hapticWarning } = useHaptics();
    const { triggerSuccess } = useRewardSystem();

    useEffect(() => {
        setEditTitle(task.title || '');
        setEditNotes(task.description || '');
        setEditDueDate(task.due_date || '');
        setEditDueTime(task.due_time || '');
        setEditRecurrenceRule(task.recurrence_rule || 'none');
        setEditReminderTime(formatDateTimeLocal(task.reminder_time));
    }, [task]);

    useSwipe(itemRef, {
        threshold: 40,
        onSwipeLeft: () => {
            if (!showDelete && !isExpanded) {
                hapticTap();
                setShowDelete(true);
            }
        },
        onSwipeRight: () => {
            if (showDelete) {
                hapticTap();
                setShowDelete(false);
            }
        }
    });

    const handleSave = () => {
        onUpdateDetails(task.id, {
            title: editTitle,
            description: editNotes,
            due_date: editDueDate || null,
            due_time: editDueTime || null,
            reminder_time: editReminderTime ? new Date(editReminderTime).toISOString() : null,
            recurrence_rule: editRecurrenceRule !== 'none' ? editRecurrenceRule : null,
        });
        setIsExpanded(false);
        hapticTap();
    };

    return (
        <div className="relative rounded-2xl group">
            {/* Background Delete Button (Revealed on Swipe) */}
            <div className="absolute inset-0 bg-error rounded-2xl overflow-hidden flex justify-end items-center px-6">
                <button 
                    onClick={() => {
                        hapticWarning();
                        onDelete(task.id);
                    }}
                    className="text-on-error font-bold flex items-center gap-2"
                >
                    <X size={20} /> Delete
                </button>
            </div>

            {/* Foreground Task Card */}
            <div 
                ref={itemRef}
                className={clsx(
                    "group/item flex flex-col bg-surface-container-low hover:bg-surface-container p-4 border border-surface-variant hover:border-surface-variant rounded-2xl transition-all duration-300 shadow-sm relative z-10",
                    showDelete ? "-translate-x-24" : "translate-x-0 hover:-translate-y-0.5 hover:shadow-lg"
                )}
            >
                <div className="flex items-start gap-3 sm:gap-4 w-full">
                    <button 
                        onClick={() => {
                            triggerSuccess();
                            onComplete(task.id);
                        }}
                        className="mt-0.5 w-7 h-7 rounded-full border-2 border-on-surface-variant/30 flex-shrink-0 hover:border-activity-green hover:bg-activity-green/20 transition-all flex items-center justify-center text-transparent hover:text-activity-green shadow-inner"
                    >
                        <CheckCircle2 size={18} />
                    </button>
                    
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <h3 className="text-on-surface font-body-md font-semibold group-hover/item:text-primary transition-colors leading-snug truncate pr-2">
                                {task.title}
                            </h3>
                            <button className="text-on-surface-variant hover:text-on-surface p-1 shrink-0">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>
                        
                        {!isExpanded && (
                            <div className="flex flex-wrap items-center gap-3">
                                {task.goal_id && goals.find((g: any) => g.id === task.goal_id) && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary bg-tertiary/10 px-2 py-1 rounded-md inline-block truncate max-w-full">
                                        {goals.find((g: any) => g.id === task.goal_id)?.title}
                                    </span>
                                )}
                                
                                {task.due_date && (
                                    <div className="flex items-center gap-1 font-label-sm text-[10px] text-activity-green uppercase tracking-wider">
                                        <Calendar size={10} /> Due: {new Date(task.due_date).toLocaleDateString()}
                                    </div>
                                )}
                                
                                {task.reminder_time && (
                                    <div className="flex items-center gap-1 font-label-sm text-[10px] text-secondary uppercase tracking-wider">
                                        <Bell size={10} /> {new Date(task.reminder_time).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}

                                {task.description && (
                                    <div className="flex items-center gap-1 font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider" title="Has notes">
                                        <AlignLeft size={10} /> Notes
                                    </div>
                                )}
                                
                                <select 
                                    value={task.priority || 'none'}
                                    onChange={(e) => onSetPriority(task.id, e.target.value)}
                                    className={clsx(
                                        "shrink-0 text-[10px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-md border focus:outline-none appearance-none cursor-pointer backdrop-blur-md transition-colors shadow-sm",
                                        task.priority === 'high' ? 'bg-error-container text-on-error-container border-error/30 hover:bg-error/20' :
                                        task.priority === 'medium' ? 'bg-surface-container-high text-on-surface border-surface-variant hover:bg-surface-container-highest' :
                                        task.priority === 'low' ? 'bg-secondary-container text-on-secondary-container border-secondary/30 hover:bg-secondary/20' :
                                        'bg-surface-container text-on-surface-variant border-surface-variant hover:bg-surface-container-high'
                                    )}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <option value="none">No Priority</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        )}
                    </div>
                    
                    {/* Desktop fallback for delete */}
                    {!showDelete && !isExpanded && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                hapticWarning();
                                onDelete(task.id);
                            }}
                            className="shrink-0 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 hover:border-error/30 transition-all ml-1"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Expanded Edit View */}
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-surface-variant animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Title</label>
                                <input 
                                    type="text" 
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    className="w-full bg-surface-container border border-surface-variant rounded-xl p-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Notes</label>
                                <textarea 
                                    value={editNotes}
                                    onChange={e => setEditNotes(e.target.value)}
                                    placeholder="Add details, steps, or thoughts..."
                                    rows={3}
                                    className="w-full bg-surface-container border border-surface-variant rounded-xl p-2.5 text-sm text-on-surface focus:outline-none focus:border-primary resize-y"
                                />
                            </div>

                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Due Date</label>
                                    <input 
                                        type="date" 
                                        value={editDueDate}
                                        onChange={e => setEditDueDate(e.target.value)}
                                        className="w-full bg-surface-container border border-surface-variant rounded-xl p-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 flex items-center gap-1">
                                        <Bell size={10} /> Reminder Time
                                    </label>
                                    <input 
                                        type="datetime-local" 
                                        value={editReminderTime}
                                        onChange={e => setEditReminderTime(e.target.value)}
                                        className="w-full bg-surface-container border border-surface-variant rounded-xl p-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 flex items-center gap-1">
                                    Repeat
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsRepeatDropdownOpen(!isRepeatDropdownOpen)}
                                        className="w-full bg-surface-container border border-surface-variant rounded-xl p-2.5 text-sm text-on-surface focus:outline-none focus:border-primary flex items-center justify-between text-left"
                                    >
                                        <span>{repeatOptions.find(o => o.value === editRecurrenceRule)?.label || 'Does not repeat'}</span>
                                        <ChevronDown size={16} className="text-on-surface-variant" />
                                    </button>
                                    
                                    {isRepeatDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsRepeatDropdownOpen(false)}></div>
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-surface-variant rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                                {repeatOptions.map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setEditRecurrenceRule(opt.value);
                                                            setIsRepeatDropdownOpen(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm text-on-surface hover:bg-primary/20 active:bg-primary/30 transition-colors border-b border-surface-variant last:border-0"
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-2">
                                <button 
                                    onClick={() => setIsExpanded(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSave}
                                    className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-md shadow-primary/20"
                                >
                                    <Save size={16} /> Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
