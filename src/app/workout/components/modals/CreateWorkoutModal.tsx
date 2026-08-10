'use client';

import React, { useState, useCallback } from 'react';
import { X, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { WorkoutTemplateService, WorkoutExercise, WorkoutTemplateInsert, WorkoutTemplate } from '@/lib/workoutTemplates';
import { useAuth } from '@/contexts/AuthContext';

interface ExerciseRow {
    tempId: string;
    name: string;
    sets: string;
    reps: string;
    notes: string;
}

function makeRow(): ExerciseRow {
    return { tempId: Math.random().toString(36).slice(2), name: '', sets: '3', reps: '10', notes: '' };
}

function rowToExercise(row: ExerciseRow, order: number): WorkoutExercise {
    return {
        name: row.name.trim(),
        sets: `${row.sets} sets x ${row.reps} reps`,
        notes: row.notes.trim() || undefined,
        youtubeUrl: '',
        order,
    };
}

interface CreateWorkoutModalProps {
    isOpen: boolean;
    editTemplate?: WorkoutTemplate | null;
    onClose: () => void;
    onSaved: (template: WorkoutTemplate) => void;
}

export default function CreateWorkoutModal({ isOpen, editTemplate, onClose, onSaved }: CreateWorkoutModalProps) {
    const { session } = useAuth();
    const isEditing = !!editTemplate;

    const [name, setName] = useState(editTemplate?.name || '');
    const [description, setDescription] = useState(editTemplate?.description || '');
    const [rows, setRows] = useState<ExerciseRow[]>(() => {
        if (editTemplate?.exercises?.length) {
            const sorted = [...editTemplate.exercises].sort((a, b) => a.order - b.order);
            return sorted.map(ex => {
                const match = ex.sets.match(/^(\d+)\s*sets?\s*x\s*(.+)$/i);
                return {
                    tempId: Math.random().toString(36).slice(2),
                    name: ex.name,
                    sets: match ? match[1] : '3',
                    reps: match ? match[2] : ex.sets,
                    notes: ex.notes || '',
                };
            });
        }
        return [makeRow()];
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        if (!isOpen) return;
        // Reset when opened for new or switching between templates
        setName(editTemplate?.name || '');
        setDescription(editTemplate?.description || '');
        if (editTemplate?.exercises?.length) {
            const sorted = [...editTemplate.exercises].sort((a, b) => a.order - b.order);
            setRows(sorted.map(ex => {
                const match = ex.sets.match(/^(\d+)\s*sets?\s*x\s*(.+)$/i);
                return {
                    tempId: Math.random().toString(36).slice(2),
                    name: ex.name,
                    sets: match ? match[1] : '3',
                    reps: match ? match[2] : ex.sets,
                    notes: ex.notes || '',
                };
            }));
        } else {
            setRows([makeRow()]);
        }
        setError(null);
    }, [isOpen, editTemplate?.id]);

    const updateRow = (tempId: string, field: keyof ExerciseRow, value: string) => {
        setRows(prev => prev.map(r => r.tempId === tempId ? { ...r, [field]: value } : r));
    };

    const addRow = () => setRows(prev => [...prev, makeRow()]);

    const removeRow = (tempId: string) => {
        setRows(prev => prev.length > 1 ? prev.filter(r => r.tempId !== tempId) : prev);
    };

    const moveRow = (tempId: string, dir: -1 | 1) => {
        setRows(prev => {
            const idx = prev.findIndex(r => r.tempId === tempId);
            if (idx < 0) return prev;
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= prev.length) return prev;
            const next = [...prev];
            [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
            return next;
        });
    };

    const validate = (): string | null => {
        if (!name.trim()) return 'Workout name is required.';
        const filledRows = rows.filter(r => r.name.trim());
        if (filledRows.length === 0) return 'Add at least one exercise.';
        for (const row of filledRows) {
            const s = parseInt(row.sets);
            if (isNaN(s) || s <= 0) return `Invalid sets for "${row.name}". Must be a positive number.`;
            if (!row.reps.trim()) return `Reps/duration is required for "${row.name}".`;
        }
        return null;
    };

    const handleSave = async () => {
        const validationError = validate();
        if (validationError) { setError(validationError); return; }
        if (!session?.user?.id) { setError('You must be logged in to save workouts.'); return; }

        setSaving(true);
        setError(null);

        try {
            const filledRows = rows.filter(r => r.name.trim());
            const exercises: WorkoutExercise[] = filledRows.map((row, idx) => rowToExercise(row, idx));
            const payload: WorkoutTemplateInsert = {
                name: name.trim(),
                description: description.trim() || undefined,
                exercises,
            };

            let saved: WorkoutTemplate;
            if (isEditing && editTemplate) {
                saved = await WorkoutTemplateService.update(editTemplate.id, payload);
            } else {
                saved = await WorkoutTemplateService.create(session.user.id, payload);
            }
            onSaved(saved);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save workout.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#111] border border-white/10 rounded-t-[32px] sm:rounded-[28px] w-full sm:max-w-lg max-h-[92vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">{isEditing ? 'Edit Workout' : 'Create Workout'}</h2>
                        <p className="text-[12px] text-white/40 mt-0.5">Build your reusable routine</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5 block">Workout Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Push Hypertrophy"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/25 transition-colors"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5 block">Description <span className="font-normal text-white/30">(optional)</span></label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="e.g. Chest, shoulders, triceps for hypertrophy"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/25 transition-colors"
                        />
                    </div>

                    {/* Exercises */}
                    <div>
                        <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2 block">Exercises *</label>
                        <div className="space-y-2">
                            {rows.map((row, idx) => (
                                <div key={row.tempId} className="bg-white/5 border border-white/8 rounded-2xl p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-white/30 font-bold w-5 text-center shrink-0">{idx + 1}</span>
                                        <input
                                            type="text"
                                            placeholder="Exercise name (e.g. Bench Press)"
                                            value={row.name}
                                            onChange={e => updateRow(row.tempId, 'name', e.target.value)}
                                            className="flex-1 min-w-0 bg-transparent text-white text-sm placeholder-white/25 focus:outline-none"
                                        />
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => moveRow(row.tempId, -1)} disabled={idx === 0} className="p-1 rounded text-white/30 hover:text-white disabled:opacity-20 transition-colors"><ChevronUp size={13} /></button>
                                            <button onClick={() => moveRow(row.tempId, 1)} disabled={idx === rows.length - 1} className="p-1 rounded text-white/30 hover:text-white disabled:opacity-20 transition-colors"><ChevronDown size={13} /></button>
                                            <button onClick={() => removeRow(row.tempId)} className="p-1 rounded text-white/30 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pl-7">
                                        <div className="flex-1">
                                            <label className="text-[9px] text-white/30 uppercase tracking-wider">Sets</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={row.sets}
                                                onChange={e => updateRow(row.tempId, 'sets', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs text-center focus:outline-none focus:border-white/25"
                                            />
                                        </div>
                                        <div className="flex-[2]">
                                            <label className="text-[9px] text-white/30 uppercase tracking-wider">Reps / Duration</label>
                                            <input
                                                type="text"
                                                placeholder="10 reps or 45s"
                                                value={row.reps}
                                                onChange={e => updateRow(row.tempId, 'reps', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-white/25 placeholder-white/20"
                                            />
                                        </div>
                                        <div className="flex-[2]">
                                            <label className="text-[9px] text-white/30 uppercase tracking-wider">Notes</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Slow eccentric"
                                                value={row.notes}
                                                onChange={e => updateRow(row.tempId, 'notes', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-white/25 placeholder-white/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={addRow} className="mt-2 w-full py-2.5 border border-dashed border-white/15 rounded-xl text-white/40 hover:text-white/70 hover:border-white/30 text-sm flex items-center justify-center gap-2 transition-colors">
                            <Plus size={15} /> Add Exercise
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-white/5 shrink-0">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 text-sm font-semibold transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : (isEditing ? 'Save Changes' : 'Create Workout')}
                    </button>
                </div>
            </div>
        </div>
    );
}
