'use client';

import React, { useState } from 'react';
import { X, Edit3, RefreshCw, Play, Save, Loader2, AlertTriangle } from 'lucide-react';
import { WorkoutTemplateService, WorkoutExercise, WorkoutTemplate } from '@/lib/workoutTemplates';
import { useAuth } from '@/contexts/AuthContext';

export interface AvaGeneratedWorkout {
    name: string;
    description?: string;
    exercises: WorkoutExercise[];
}

interface AvaWorkoutPreviewProps {
    workout: AvaGeneratedWorkout | null;
    isOpen: boolean;
    onClose: () => void;
    onSaved: (template: WorkoutTemplate) => void;
    onRegenerate: () => void;
    onStartNow: (template: WorkoutTemplate) => void;
}

export default function AvaWorkoutPreview({ workout, isOpen, onClose, onSaved, onRegenerate, onStartNow }: AvaWorkoutPreviewProps) {
    const { session } = useAuth();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [savedTemplate, setSavedTemplate] = useState<WorkoutTemplate | null>(null);

    const handleSave = async () => {
        if (!workout || !session?.user?.id) return;
        setSaving(true);
        setError(null);
        try {
            const template = await WorkoutTemplateService.create(session.user.id, {
                name: workout.name,
                description: workout.description,
                exercises: workout.exercises,
            });
            setSaved(true);
            setSavedTemplate(template);
            onSaved(template);
        } catch (err: any) {
            setError(err.message || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleStartNow = () => {
        if (savedTemplate) {
            onStartNow(savedTemplate);
        }
    };

    if (!isOpen || !workout) return null;

    const sortedExercises = [...workout.exercises].sort((a, b) => a.order - b.order);

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#111] border border-white/10 rounded-t-[32px] sm:rounded-[28px] w-full sm:max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
                    <div>
                        <p className="text-[11px] text-[#0a84ff] font-bold uppercase tracking-widest mb-1">Ava Generated</p>
                        <h2 className="text-lg font-bold text-white tracking-tight">{workout.name}</h2>
                        {workout.description && <p className="text-[12px] text-white/40 mt-0.5">{workout.description}</p>}
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors shrink-0">
                        <X size={16} />
                    </button>
                </div>

                {/* Exercise List */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                    {sortedExercises.map((ex, idx) => (
                        <div key={idx} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
                            <span className="text-[11px] text-white/25 font-mono w-5 text-center shrink-0">{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{ex.name}</p>
                                {ex.notes && <p className="text-[11px] text-white/40 mt-0.5">{ex.notes}</p>}
                            </div>
                            <span className="text-[11px] font-bold text-white/50 shrink-0 text-right">{ex.sets}</span>
                        </div>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mb-2 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 pb-6 pt-3 border-t border-white/5 space-y-2 shrink-0">
                    {!saved ? (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <><Loader2 size={15} className="animate-spin" />Saving...</> : <><Save size={15} />Save Workout</>}
                            </button>
                            <div className="flex gap-2">
                                <button onClick={onRegenerate} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5">
                                    <RefreshCw size={13} /> Regenerate
                                </button>
                                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 text-sm font-semibold transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-center py-2 text-sm text-green-400 font-semibold">✓ Workout saved to your library!</div>
                            <button onClick={handleStartNow} className="w-full py-3 rounded-xl bg-[#0a84ff] text-white text-sm font-bold hover:bg-[#0a84ff]/90 active:scale-95 transition-all flex items-center justify-center gap-2">
                                <Play size={15} fill="currentColor" /> Start Now
                            </button>
                            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 text-sm font-semibold transition-colors">
                                Close
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
