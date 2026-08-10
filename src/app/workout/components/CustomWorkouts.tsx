'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Plus, Trash2, Edit2, Play, MoreHorizontal, Copy, Loader2 } from 'lucide-react';
import AvaLogo from '@/components/ui/AvaLogo';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutTemplateService, WorkoutTemplate } from '@/lib/workoutTemplates';
import CreateWorkoutModal from './modals/CreateWorkoutModal';

interface CustomWorkoutsProps {
    onPlay: (preset: any) => void;
}

export default function CustomWorkouts({ onPlay }: CustomWorkoutsProps) {
    const { session } = useAuth();
    const userId = session?.user?.id;

    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [showCreate, setShowCreate] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);

    // Per-card overflow menu
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Delete confirmation
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const loadTemplates = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        setError(null);
        try {
            const data = await WorkoutTemplateService.getAll(userId);
            setTemplates(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadTemplates();
        // Also refresh when a workout is completed so we can sync if needed
        window.addEventListener('workout_os_activity_updated', loadTemplates);
        return () => window.removeEventListener('workout_os_activity_updated', loadTemplates);
    }, [loadTemplates]);

    // Listen for Ava-generated workout event
    useEffect(() => {
        const handleAvaWorkout = async (e: any) => {
            const saved: WorkoutTemplate = e.detail;
            if (saved?.id) {
                setTemplates(prev => [saved, ...prev.filter(t => t.id !== saved.id)]);
            }
        };
        window.addEventListener('workout_os_template_saved', handleAvaWorkout);
        return () => window.removeEventListener('workout_os_template_saved', handleAvaWorkout);
    }, []);

    const handleSaved = (template: WorkoutTemplate) => {
        setTemplates(prev => {
            const exists = prev.find(t => t.id === template.id);
            if (exists) return prev.map(t => t.id === template.id ? template : t);
            return [template, ...prev];
        });
    };

    const handleDelete = async (id: string) => {
        if (deleteConfirmId !== id) {
            setDeleteConfirmId(id);
            return;
        }
        setDeletingId(id);
        setDeleteConfirmId(null);
        setOpenMenuId(null);
        try {
            await WorkoutTemplateService.delete(id);
            setTemplates(prev => prev.filter(t => t.id !== id));
        } catch (err: any) {
            alert('Error deleting workout: ' + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const handleDuplicate = async (template: WorkoutTemplate) => {
        if (!userId) return;
        setOpenMenuId(null);
        try {
            const duped = await WorkoutTemplateService.duplicate(template, userId);
            setTemplates(prev => [duped, ...prev]);
        } catch (err: any) {
            alert('Error duplicating workout: ' + err.message);
        }
    };

    const handleEdit = (template: WorkoutTemplate) => {
        setOpenMenuId(null);
        setEditingTemplate(template);
        setShowCreate(true);
    };

    const handlePlay = (template: WorkoutTemplate) => {
        const preset = WorkoutTemplateService.toPreset(template);
        onPlay(preset);
    };

    const handleAskAva = () => {
        window.dispatchEvent(new CustomEvent('open-ai-copilot', {
            detail: {
                prompt: "Generate a custom workout template for me. Ask me what I'm training for, the duration I have, my equipment, and my experience level, then create a structured plan."
            }
        }));
    };

    // Close menu on outside click
    useEffect(() => {
        if (!openMenuId) return;
        const close = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-menu]')) setOpenMenuId(null);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [openMenuId]);

    const estimateTime = (template: WorkoutTemplate) => {
        return `~${Math.max(20, template.exercises.length * 7)} min`;
    };

    return (
        <>
            <div className="bg-white dark:bg-[#0f0f0f] border border-black/5 dark:border-white/10 p-5 rounded-[28px] h-full flex flex-col font-sans shadow-sm dark:shadow-none">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/15 flex items-center justify-center text-black dark:text-white shrink-0">
                            <Dumbbell size={20} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="text-[17px] font-bold text-black dark:text-white tracking-tight leading-none">My Workouts</h3>
                            <p className="text-[12px] text-black/50 dark:text-white/40 mt-0.5">Custom routines & AI suggestions</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setEditingTemplate(null); setShowCreate(true); }}
                        className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 flex items-center justify-center text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white transition-colors active:scale-90"
                        title="Create Workout"
                    >
                        <Plus size={17} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 size={22} className="animate-spin text-black/30 dark:text-white/30" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                            <p className="text-red-500 dark:text-red-400 text-sm mb-3">{error}</p>
                            <button onClick={loadTemplates} className="text-black/50 dark:text-white/50 text-xs underline">Retry</button>
                        </div>
                    ) : templates.length === 0 ? (
                        /* ── EMPTY STATE ── */
                        <div className="min-h-[260px] flex flex-col items-center justify-center text-center px-6 border border-dashed border-black/10 dark:border-white/10 rounded-[24px]">
                            <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/8 flex items-center justify-center mb-5 text-black/30 dark:text-white/30">
                                <Dumbbell size={28} strokeWidth={1.5} />
                            </div>
                            <h4 className="text-base font-bold text-black dark:text-white mb-2 tracking-tight">No Custom Workouts</h4>
                            <p className="text-[13px] text-black/50 dark:text-white/45 mb-7 leading-relaxed max-w-[230px]">
                                Create your own routine or let Ava build one for you.
                            </p>
                            <div className="flex flex-col w-full gap-2 max-w-[200px]">
                                <button
                                    onClick={handleAskAva}
                                    className="py-2.5 bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white rounded-full text-[13px] font-bold tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <AvaLogo size={14} className="group-hover:rotate-90 transition-transform duration-500" /> Ask Ava
                                </button>
                                <button
                                    onClick={() => { setEditingTemplate(null); setShowCreate(true); }}
                                    className="py-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/8 dark:hover:bg-white/12 text-black/70 dark:text-white/70 rounded-full text-[13px] font-semibold transition-all active:scale-95"
                                >
                                    Create Workout
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ── TEMPLATE LIST ── */
                        <div className="space-y-2">
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    className="group relative bg-black/5 hover:bg-black/10 dark:bg-white/4 dark:hover:bg-white/7 border border-black/5 dark:border-white/6 rounded-2xl p-4 transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-black dark:text-white tracking-tight truncate">{template.name}</h4>
                                            <div className="flex items-center gap-2 mt-1 text-[11px] text-black/50 dark:text-white/40">
                                                <span>{template.exercises.length} exercises</span>
                                                <span>·</span>
                                                <span>{estimateTime(template)}</span>
                                                {template.description && (
                                                    <>
                                                        <span>·</span>
                                                        <span className="truncate">{template.description}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* Start button */}
                                            <button
                                                onClick={() => handlePlay(template)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-full text-[12px] font-bold hover:bg-black/90 dark:hover:bg-white/90 active:scale-95 transition-all shadow-sm"
                                            >
                                                <Play size={11} fill="currentColor" /> Start
                                            </button>

                                            {/* Overflow menu */}
                                            <div className="relative" data-menu>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === template.id ? null : template.id); setDeleteConfirmId(null); }}
                                                    className="w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors"
                                                >
                                                    <MoreHorizontal size={14} />
                                                </button>

                                                {openMenuId === template.id && (
                                                    <div className="absolute right-0 top-9 z-50 bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden w-44 animate-in fade-in slide-in-from-top-2 duration-150">
                                                        <button onClick={() => handleEdit(template)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-black/80 hover:bg-black/5 hover:text-black dark:text-white/80 dark:hover:bg-white/5 dark:hover:text-white transition-colors text-left">
                                                            <Edit2 size={14} /> Edit
                                                        </button>
                                                        <button onClick={() => handleDuplicate(template)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-black/80 hover:bg-black/5 hover:text-black dark:text-white/80 dark:hover:bg-white/5 dark:hover:text-white transition-colors text-left">
                                                            <Copy size={14} /> Duplicate
                                                        </button>
                                                        <button onClick={() => handleAskAva()} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-black/80 hover:bg-black/5 hover:text-black dark:text-white/80 dark:hover:bg-white/5 dark:hover:text-white transition-colors text-left">
                                                            <AvaLogo size={14} /> Improve with Ava
                                                        </button>
                                                        <div className="border-t border-black/5 dark:border-white/5" />
                                                        {deletingId === template.id ? (
                                                            <div className="flex items-center gap-2 px-4 py-3 text-sm text-black/40 dark:text-white/40">
                                                                <Loader2 size={13} className="animate-spin" /> Deleting...
                                                            </div>
                                                        ) : deleteConfirmId === template.id ? (
                                                            <button onClick={() => handleDelete(template.id)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left font-semibold">
                                                                <Trash2 size={14} /> Confirm Delete
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => handleDelete(template.id)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500/80 dark:text-red-400/80 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors text-left">
                                                                <Trash2 size={14} /> Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add more button at bottom when templates exist */}
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => { setEditingTemplate(null); setShowCreate(true); }}
                                    className="flex-1 py-2.5 border border-dashed border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20 rounded-xl text-black/50 hover:text-black/80 dark:text-white/35 dark:hover:text-white/60 text-[12px] flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Plus size={13} /> Create Workout
                                </button>
                                <button
                                    onClick={handleAskAva}
                                    className="flex-1 py-2.5 border border-dashed border-[#0a84ff]/20 hover:border-[#0a84ff]/40 rounded-xl text-[#0a84ff]/70 hover:text-[#0a84ff] dark:text-[#0a84ff]/50 dark:hover:text-[#0a84ff]/80 text-[12px] flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <AvaLogo size={13} className="group-hover:rotate-90 transition-transform duration-500" /> Ask Ava
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <CreateWorkoutModal
                isOpen={showCreate}
                editTemplate={editingTemplate}
                onClose={() => { setShowCreate(false); setEditingTemplate(null); }}
                onSaved={handleSaved}
            />
        </>
    );
}
