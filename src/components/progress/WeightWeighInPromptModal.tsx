'use client';

import React, { useRef } from 'react';
import { Camera, X, Sparkles, Scale } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface WeightWeighInPromptModalProps {
    isOpen: boolean;
    currentWeight: number | null;
    onClose: () => void;
    onPhotoUploaded: () => void;
}

export default function WeightWeighInPromptModal({
    isOpen,
    currentWeight,
    onClose,
    onPhotoUploaded,
}: WeightWeighInPromptModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = React.useState(false);

    if (!isOpen) return null;

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUploading(true);

        try {
            const now = new Date();
            const ext = file.name.split('.').pop() || 'jpg';
            const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filePath = `${user.id}/${timestamp}.${ext}`;

            // Storage Upload
            const { error: uploadError } = await supabase.storage
                .from('progress_photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Database Metadata
            const { error: dbError } = await supabase
                .from('progress_photos')
                .insert({
                    user_id: user.id,
                    storage_path: filePath,
                    uploaded_at: now.toISOString(),
                    taken_at: now.toISOString(),
                    weight_snapshot: currentWeight ? Number(currentWeight) : null,
                    notes: `Logged with weight entry (${currentWeight ?? '—'} kg)`,
                });

            if (dbError) throw dbError;

            onPhotoUploaded();
            onClose();
        } catch (err: any) {
            console.error('Failed to upload photo from weigh-in prompt:', err);
            alert(err.message || 'Failed to save photo.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    };

    const triggerCamera = () => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            typeof navigator !== 'undefined' ? navigator.userAgent : ''
        );
        if (isMobile && cameraInputRef.current) {
            cameraInputRef.current.click();
        } else if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
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

            <div className="bg-card-white dark:bg-surface-container-lowest rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-black/5 dark:border-white/10 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="w-14 h-14 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center mb-4 shadow-inner">
                    <Camera size={28} />
                </div>

                <h3 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
                    Add Progress Photo?
                </h3>
                <p className="font-body-md text-on-surface-variant text-sm mt-1.5 leading-relaxed">
                    Would you like to add a progress photo with this weigh-in?
                </p>

                {currentWeight && (
                    <div className="mt-3 bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <Scale size={14} /> Prefilled: {currentWeight} kg
                    </div>
                )}

                <div className="flex flex-col w-full gap-2.5 mt-6">
                    <button
                        onClick={triggerCamera}
                        disabled={uploading}
                        className="w-full bg-secondary hover:bg-secondary/90 text-on-secondary font-bold py-3.5 rounded-2xl transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 text-sm"
                    >
                        <Camera size={18} />
                        {uploading ? 'Saving Photo...' : 'Take Photo'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold py-3 rounded-2xl transition-colors text-sm"
                    >
                        Skip
                    </button>
                </div>
            </div>
        </div>
    );
}
