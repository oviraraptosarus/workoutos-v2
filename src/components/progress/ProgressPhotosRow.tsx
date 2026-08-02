'use client';

import React, { useRef, useState } from 'react';
import { Camera, Plus, ChevronRight, Loader2, Sparkles, Image as ImageIcon, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export interface ProgressPhotoItem {
    id: string;
    storage_path: string;
    uploaded_at: string;
    taken_at?: string;
    weight_snapshot?: number | null;
    notes?: string | null;
    dataUrl?: string;
    label: string;
}

interface ProgressPhotosRowProps {
    photos: ProgressPhotoItem[];
    currentWeight?: number | null;
    onPhotosUpdated: () => void;
    onOpenGallery: (initialPhotoId?: string) => void;
}

export default function ProgressPhotosRow({
    photos,
    currentWeight,
    onPhotosUpdated,
    onOpenGallery,
}: ProgressPhotosRowProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [successFlash, setSuccessFlash] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    const handleDeletePhoto = async (e: React.MouseEvent, photo: ProgressPhotoItem) => {
        e.stopPropagation();
        if (!confirm('Delete this progress photo?')) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            await supabase.from('progress_photos').delete().eq('id', photo.id).eq('user_id', user.id);
            if (photo.storage_path) {
                await supabase.storage.from('progress_photos').remove([photo.storage_path]);
            }
            onPhotosUpdated();
        } catch (err) {
            console.error('Failed to delete photo:', err);
            alert('Failed to delete photo.');
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Please sign in to upload progress photos.');
            return;
        }

        setUploading(true);
        setStatusMsg('Uploading photo...');

        try {
            const now = new Date();
            const ext = file.name.split('.').pop() || 'jpg';
            const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filePath = `${user.id}/${timestamp}.${ext}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('progress_photos')
                .upload(filePath, file);

            if (uploadError) {
                throw new Error(`Storage error: ${uploadError.message}`);
            }

            // 2. Insert metadata into progress_photos table
            const insertPayload = {
                user_id: user.id,
                storage_path: filePath,
                uploaded_at: now.toISOString(),
                taken_at: now.toISOString(),
                weight_snapshot: currentWeight ? Number(currentWeight) : null,
                notes: null,
            };

            const { error: dbError } = await supabase
                .from('progress_photos')
                .insert(insertPayload);

            if (dbError) {
                throw new Error(`Database error: ${dbError.message}`);
            }

            // 3. Success animation & refresh
            setSuccessFlash(true);
            setStatusMsg('Photo saved!');
            setTimeout(() => setSuccessFlash(false), 2000);
            onPhotosUpdated();
        } catch (err: any) {
            console.error('Progress photo upload failed:', err);
            alert(err.message || 'Failed to upload progress photo');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    };

    const triggerUpload = () => {
        // Check if mobile user agent to prefer camera
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            typeof navigator !== 'undefined' ? navigator.userAgent : ''
        );

        if (isMobile && cameraInputRef.current) {
            cameraInputRef.current.click();
        } else if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Show latest 4 photos
    const recentPhotos = photos.slice(-4);

    return (
        <div className="mt-4 pt-4 border-t border-surface-variant/40">
            {/* Hidden File Inputs */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleUpload}
            />
            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={cameraInputRef}
                className="hidden"
                onChange={handleUpload}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">photo_camera</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                        Progress Photos
                    </span>
                </div>
                <button
                    onClick={() => onOpenGallery()}
                    className="text-secondary text-[11px] font-bold uppercase tracking-wider hover:underline flex items-center gap-0.5 active:scale-95 transition-transform"
                >
                    View All ({photos.length}) <ChevronRight size={12} />
                </button>
            </div>

            {/* Horizontal Scroll Row */}
            <div className="flex gap-3 overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide pb-2 pt-1 -mx-1 px-1">
                {/* Add Photo Card */}
                <button
                    onClick={triggerUpload}
                    disabled={uploading}
                    className={`relative shrink-0 w-24 h-28 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95 ${
                        successFlash
                            ? 'border-activity-green bg-activity-green/10 text-activity-green'
                            : 'border-surface-variant hover:border-secondary bg-surface-container-lowest text-on-surface-variant'
                    }`}
                >
                    {uploading ? (
                        <>
                            <Loader2 size={22} className="animate-spin text-secondary" />
                            <span className="text-[10px] font-bold text-secondary text-center px-1">
                                Uploading...
                            </span>
                        </>
                    ) : successFlash ? (
                        <>
                            <Sparkles size={22} className="text-activity-green animate-bounce" />
                            <span className="text-[10px] font-bold text-activity-green text-center">
                                Saved!
                            </span>
                        </>
                    ) : (
                        <>
                            <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shadow-inner">
                                <Plus size={20} />
                            </div>
                            <span className="text-[10px] font-bold text-on-surface text-center">
                                Add Photo
                            </span>
                        </>
                    )}
                </button>

                {/* Thumbnails */}
                {recentPhotos.map((photo) => (
                    <div
                        key={photo.id}
                        className="group relative shrink-0 w-24 h-28 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-surface-container border border-black/5 dark:border-white/5"
                    >
                        <button
                            onClick={() => onOpenGallery(photo.id)}
                            className="w-full h-full text-left active:scale-95 transition-transform"
                        >
                            {photo.dataUrl ? (
                                <img
                                    src={photo.dataUrl}
                                    alt={photo.label}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-surface-container-high text-on-surface-variant">
                                    <ImageIcon size={24} />
                                </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-1.5">
                                {photo.weight_snapshot && (
                                    <span className="text-[10px] font-black text-white tracking-tight leading-none mb-0.5">
                                        {photo.weight_snapshot} kg
                                    </span>
                                )}
                                <span className="text-white text-[9px] font-bold leading-tight truncate">
                                    {photo.label}
                                </span>
                            </div>
                        </button>

                        {/* Delete Photo Button */}
                        <button
                            onClick={(e) => handleDeletePhoto(e, photo)}
                            className="absolute top-1 right-1 p-1.5 rounded-xl bg-black/60 text-black hover:bg-white transition-colors shadow-sm"
                            title="Delete photo"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}

                {photos.length === 0 && !uploading && (
                    <div className="flex items-center justify-center px-4 py-3 rounded-2xl bg-surface-container-lowest border border-dashed border-surface-variant text-on-surface-variant text-xs text-center flex-1">
                        No photos yet. Tap Add Photo to track your body transformation visually!
                    </div>
                )}
            </div>
        </div>
    );
}
