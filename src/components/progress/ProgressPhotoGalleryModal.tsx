'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Trash2,
    Edit3,
    Check,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Columns,
    Calendar,
    Scale,
    FileText,
    Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProgressPhotoItem } from './ProgressPhotosRow';

interface ProgressPhotoGalleryModalProps {
    isOpen: boolean;
    initialPhotoId?: string;
    photos: ProgressPhotoItem[];
    onClose: () => void;
    onPhotosUpdated: () => void;
}

export default function ProgressPhotoGalleryModal({
    isOpen,
    initialPhotoId,
    photos,
    onClose,
    onPhotosUpdated,
}: ProgressPhotoGalleryModalProps) {
    const { t } = useLanguage();
    const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

    // Editing State inside Single View
    const [isEditing, setIsEditing] = useState(false);
    const [editWeight, setEditWeight] = useState<string>('');
    const [editNotes, setEditNotes] = useState<string>('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Zoom State
    const [isZoomed, setIsZoomed] = useState(false);

    // Comparison Mode State
    const [compareMode, setCompareMode] = useState(false);
    const [photoAId, setPhotoAId] = useState<string | null>(null);
    const [photoBId, setPhotoBId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedPhotoId(initialPhotoId || null);
            setIsEditing(false);
            setIsZoomed(false);
            setCompareMode(false);
        }
    }, [isOpen, initialPhotoId]);

    // Reset edit state when single photo selection changes
    useEffect(() => {
        if (selectedPhotoId) {
            const current = photos.find((p) => p.id === selectedPhotoId);
            setEditWeight(current?.weight_snapshot ? String(current.weight_snapshot) : '');
            setEditNotes(current?.notes || '');
            setIsEditing(false);
            setIsZoomed(false);
        }
    }, [selectedPhotoId, photos]);

    if (!isOpen) return null;

    // Group photos by Month & Year (e.g., "August 2026")
    const groupedPhotos = photos.reduce((acc, photo) => {
        const d = new Date(photo.taken_at || photo.uploaded_at);
        const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!acc[key]) acc[key] = [];
        acc[key].push(photo);
        return acc;
    }, {} as Record<string, ProgressPhotoItem[]>);

    const sortedMonthKeys = Object.keys(groupedPhotos).sort((a, b) => {
        const dA = new Date(groupedPhotos[a][0]?.uploaded_at || 0).getTime();
        const dB = new Date(groupedPhotos[b][0]?.uploaded_at || 0).getTime();
        return dB - dA;
    });

    const activePhoto = photos.find((p) => p.id === selectedPhotoId);
    const activeIndex = photos.findIndex((p) => p.id === selectedPhotoId);

    const handleNavigate = (direction: 'next' | 'prev') => {
        if (activeIndex === -1) return;
        const nextIdx = direction === 'next' ? activeIndex + 1 : activeIndex - 1;
        if (nextIdx >= 0 && nextIdx < photos.length) {
            setSelectedPhotoId(photos[nextIdx].id);
        }
    };

    const handleDelete = async (photo: ProgressPhotoItem) => {
        if (!confirm('Are you sure you want to delete this progress photo?')) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            await supabase.from('progress_photos').delete().eq('id', photo.id).eq('user_id', user.id);
            if (photo.storage_path) {
                await supabase.storage.from('progress_photos').remove([photo.storage_path]);
            }
            if (selectedPhotoId === photo.id) {
                setSelectedPhotoId(null);
            }
            onPhotosUpdated();
        } catch (err) {
            console.error('Delete photo failed:', err);
            alert('Failed to delete photo.');
        }
    };

    const handleSaveEdits = async () => {
        if (!activePhoto) return;
        setIsSavingEdit(true);

        try {
            const parsedWeight = editWeight.trim() ? Number(editWeight) : null;
            const { error } = await supabase
                .from('progress_photos')
                .update({
                    weight_snapshot: parsedWeight,
                    notes: editNotes.trim() || null,
                })
                .eq('id', activePhoto.id);

            if (error) throw error;

            setIsEditing(false);
            onPhotosUpdated();
        } catch (err: any) {
            console.error('Failed to save photo metadata edit:', err);
            alert(err.message || 'Failed to save changes.');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const photoA = photos.find((p) => p.id === photoAId) || photos[0];
    const photoB = photos.find((p) => p.id === photoBId) || photos[photos.length - 1];

    const weightDelta =
        photoA?.weight_snapshot && photoB?.weight_snapshot
            ? (photoB.weight_snapshot - photoA.weight_snapshot).toFixed(1)
            : null;

    return (
        <div className="fixed inset-0 z-[999] bg-black/95 text-white flex flex-col animate-in fade-in duration-200 overflow-hidden">
            {/* Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <h2 className="font-headline-md text-lg font-bold flex items-center gap-2">
                        <Sparkles className="text-white" size={20} />
                        {compareMode
                            ? 'Side-by-Side Comparison'
                            : activePhoto
                            ? 'Photo Details'
                            : 'Progress Photo Gallery'}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle Compare Mode */}
                    {photos.length >= 2 && (
                        <button
                            onClick={() => {
                                setCompareMode(!compareMode);
                                if (!compareMode) {
                                    setPhotoAId(photos[0]?.id || null);
                                    setPhotoBId(photos[photos.length - 1]?.id || null);
                                }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                                compareMode
                                    ? 'bg-amber-400 text-black border-white/20'
                                    : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                            }`}
                        >
                            <Columns size={14} />
                            {compareMode ? 'Exit Compare' : 'Compare Photos'}
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full custom-scrollbar">
                {/* ── MODE 1: SIDE-BY-SIDE COMPARISON MODE ── */}
                {compareMode && photos.length >= 2 ? (
                    <div className="space-y-6 animate-in zoom-in-95 duration-200">
                        {/* Selector Controls & Delta Summary */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <span className="text-xs font-bold text-white/60">Photo A:</span>
                                <select
                                    value={photoAId || ''}
                                    onChange={(e) => setPhotoAId(e.target.value)}
                                    className="bg-black/60 border border-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-white/20 flex-1"
                                >
                                    {photos.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.label} {p.weight_snapshot ? `(${p.weight_snapshot} kg)` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {weightDelta !== null && (
                                <div className="bg-amber-400/10 text-white border border-white/20/30 px-4 py-1.5 rounded-full text-xs font-bold text-center">
                                    Weight Change: {Number(weightDelta) > 0 ? `+${weightDelta}` : weightDelta} kg
                                </div>
                            )}

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <span className="text-xs font-bold text-white/60">Photo B:</span>
                                <select
                                    value={photoBId || ''}
                                    onChange={(e) => setPhotoBId(e.target.value)}
                                    className="bg-black/60 border border-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-white/20 flex-1"
                                >
                                    {photos.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.label} {p.weight_snapshot ? `(${p.weight_snapshot} kg)` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Side by Side Split Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Card A */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-3 flex flex-col items-center">
                                <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black mb-3 border border-white/10">
                                    <img
                                        src={photoA?.dataUrl}
                                        alt={photoA?.label}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-white text-xs font-bold uppercase tracking-wider">
                                        BEFORE / START
                                    </p>
                                    <p className="text-sm font-bold mt-0.5">{photoA?.label}</p>
                                    {photoA?.weight_snapshot && (
                                        <p className="text-xs text-white/70 font-semibold mt-0.5">
                                            {photoA.weight_snapshot} kg
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Card B */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-3 flex flex-col items-center">
                                <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black mb-3 border border-white/10">
                                    <img
                                        src={photoB?.dataUrl}
                                        alt={photoB?.label}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-white text-xs font-bold uppercase tracking-wider">
                                        CURRENT / LATER
                                    </p>
                                    <p className="text-sm font-bold mt-0.5">{photoB?.label}</p>
                                    {photoB?.weight_snapshot && (
                                        <p className="text-xs text-white/70 font-semibold mt-0.5">
                                            {photoB.weight_snapshot} kg
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activePhoto ? (
                    /* ── MODE 2: SINGLE PHOTO LIGHTBOX VIEW ── */
                    <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-200">
                        {/* Image Viewer Container */}
                        <div className="relative w-full max-w-lg aspect-[3/4] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center group">
                            <img
                                src={activePhoto.dataUrl}
                                alt={activePhoto.label}
                                className={`w-full h-full object-contain transition-transform duration-300 ${
                                    isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                                }`}
                                onClick={() => setIsZoomed(!isZoomed)}
                            />

                            {/* Prev / Next Arrows */}
                            {activeIndex > 0 && (
                                <button
                                    onClick={() => handleNavigate('prev')}
                                    className="absolute left-3 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-all active:scale-95"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            {activeIndex < photos.length - 1 && (
                                <button
                                    onClick={() => handleNavigate('next')}
                                    className="absolute right-3 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-all active:scale-95"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            )}

                            {/* Zoom & Back Controls */}
                            <div className="absolute top-3 right-3 flex items-center gap-2">
                                <button
                                    onClick={() => setIsZoomed(!isZoomed)}
                                    className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-colors"
                                >
                                    {isZoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Metadata Details Card */}
                        <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
                                        Upload Date
                                    </p>
                                    <p className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                                        <Calendar size={16} className="text-white" />
                                        {activePhoto.label}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1"
                                        >
                                            <Edit3 size={14} /> Edit Details
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSaveEdits}
                                            disabled={isSavingEdit}
                                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-white text-black text-xs font-bold transition-colors flex items-center gap-1"
                                        >
                                            <Check size={14} /> {isSavingEdit ? 'Saving...' : 'Save'}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDelete(activePhoto)}
                                        className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
                                        title="Delete photo"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Editable Weight & Notes */}
                            {isEditing ? (
                                <div className="space-y-3 pt-2 border-t border-white/10">
                                    <div>
                                        <label className="text-xs font-bold text-white/60 block mb-1">
                                            Weight Snapshot (kg)
                                        </label>
                                        <input
                                            type="number"
                                            value={editWeight}
                                            onChange={(e) => setEditWeight(e.target.value)}
                                            placeholder="e.g. 75.0"
                                            className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-white/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-white/60 block mb-1">
                                            Notes / Caption
                                        </label>
                                        <textarea
                                            value={editNotes}
                                            onChange={(e) => setEditNotes(e.target.value)}
                                            placeholder="Write notes about your physique, pump, diet..."
                                            rows={2}
                                            className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-white/20"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                                    <div className="bg-black/40 rounded-2xl p-3 border border-white/5">
                                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1">
                                            <Scale size={12} className="text-white" /> Weight Snapshot
                                        </p>
                                        <p className="text-sm font-bold text-white mt-1">
                                            {activePhoto.weight_snapshot
                                                ? `${activePhoto.weight_snapshot} kg`
                                                : 'Not recorded'}
                                        </p>
                                    </div>
                                    <div className="bg-black/40 rounded-2xl p-3 border border-white/5">
                                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1">
                                            <FileText size={12} className="text-white" /> Notes
                                        </p>
                                        <p className="text-xs text-white/80 mt-1 truncate">
                                            {activePhoto.notes || 'No notes added'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Back to Gallery List Button */}
                            <button
                                onClick={() => setSelectedPhotoId(null)}
                                className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                            >
                                ← Back to All Photos
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── MODE 3: TIMELINE / MONTH GROUPED GALLERY ── */
                    <div className="space-y-6">
                        {sortedMonthKeys.map((monthKey) => (
                            <div key={monthKey} className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-white border-b border-white/10 pb-1">
                                    {monthKey} ({groupedPhotos[monthKey].length})
                                </h3>

                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {groupedPhotos[monthKey].map((photo) => (
                                        <div
                                            key={photo.id}
                                            className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all text-left"
                                        >
                                            <button
                                                onClick={() => setSelectedPhotoId(photo.id)}
                                                className="w-full h-full text-left active:scale-95 transition-transform"
                                            >
                                                <img
                                                    src={photo.dataUrl}
                                                    alt={photo.label}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                                                    {photo.weight_snapshot && (
                                                        <span className="text-[10px] font-black text-white leading-none mb-0.5">
                                                            {photo.weight_snapshot} kg
                                                        </span>
                                                    )}
                                                    <span className="text-white text-[10px] font-bold truncate">
                                                        {photo.label}
                                                    </span>
                                                </div>
                                            </button>

                                            {/* Corner Delete Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(photo);
                                                }}
                                                className="absolute top-1.5 right-1.5 p-1.5 rounded-xl bg-black/60 text-black hover:bg-white transition-colors backdrop-blur-sm"
                                                title="Delete photo"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {sortedMonthKeys.length === 0 && (
                            <div className="text-center py-16 text-white/50 text-sm font-medium">
                                No progress photos uploaded yet. Tap "Add Photo" to start tracking your physique over time.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
