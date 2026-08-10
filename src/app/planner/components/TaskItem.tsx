'use client';

import React, { useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import clsx from 'clsx';
import { useSwipe } from '@/lib/hooks/useSwipe';
import { useHaptics } from '@/lib/hooks/useHaptics';
import { useRewardSystem } from '@/lib/hooks/useRewardSystem';

interface TaskItemProps {
    task: any;
    goals: any[];
    onComplete: (id: string) => void;
    onSetPriority: (id: string, priority: string) => void;
    onDelete: (id: string) => void;
}

export default function TaskItem({ task, goals, onComplete, onSetPriority, onDelete }: TaskItemProps) {
    const itemRef = useRef<HTMLDivElement>(null);
    const [showDelete, setShowDelete] = useState(false);
    const { hapticTap, hapticWarning } = useHaptics();
    const { triggerSuccess } = useRewardSystem();

    useSwipe(itemRef, {
        threshold: 40,
        onSwipeLeft: () => {
            if (!showDelete) {
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

    return (
        <div className="relative overflow-hidden rounded-2xl group">
            {/* Background Delete Button (Revealed on Swipe) */}
            <div className="absolute inset-0 bg-error flex justify-end items-center px-6">
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
                    "group/item flex items-start gap-3 sm:gap-4 bg-surface-container-low hover:bg-surface-container p-4 border border-surface-variant hover:border-surface-variant transition-all duration-300 shadow-sm relative z-10",
                    showDelete ? "-translate-x-24" : "translate-x-0 hover:-translate-y-0.5 hover:shadow-lg"
                )}
            >
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
                    <h3 className="text-on-surface font-body-md font-semibold group-hover/item:text-primary transition-colors leading-snug">{task.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-2">
                        {task.goal_id && goals.find((g: any) => g.id === task.goal_id) && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary bg-tertiary/10 px-2 py-1 rounded-md inline-block truncate max-w-full">
                                {goals.find((g: any) => g.id === task.goal_id)?.title}
                            </span>
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
                        >
                            <option value="none">No Priority</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>
                
                {/* Desktop fallback for delete */}
                {!showDelete && (
                    <button
                        onClick={() => {
                            hapticWarning();
                            onDelete(task.id);
                        }}
                        className="shrink-0 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 hover:border-error/30 transition-all ml-1"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
