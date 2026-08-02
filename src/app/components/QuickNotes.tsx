'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PenTool, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { useDate } from '@/contexts/DateContext';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export default function QuickNotes() {
    const { selectedDate, isToday } = useDate();
    const { user } = useAuth();
    const [note, setNote] = useState('');
    const [isClient, setIsClient] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const loadNote = () => {
        if (!selectedDate) return;
        const saved = localStorage.getItem(`workout_os_quick_note_${selectedDate}`);
        setNote(saved || '');
    };

    useEffect(() => {
        setIsClient(true);
        loadNote();
        
        window.addEventListener('storage', loadNote);
        return () => {
            window.removeEventListener('storage', loadNote);
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [selectedDate]);

    const saveToBackend = async (noteText: string) => {
        if (!user || !selectedDate) return;
        try {
            const { data: profile } = await supabase.from('profiles').select('target_config').eq('id', user.id).single();
            const currentConfig = profile?.target_config || {};
            const updatedConfig = {
                ...currentConfig,
                quickNotes: {
                    ...(currentConfig.quickNotes || {}),
                    [selectedDate]: noteText
                }
            };
            await supabase.from('profiles').update({ target_config: updatedConfig }).eq('id', user.id);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            console.error("Error saving quick note:", err);
            setSaveStatus('idle');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setNote(val);
        setSaveStatus('saving');
        
        if (selectedDate) {
            localStorage.setItem(`workout_os_quick_note_${selectedDate}`, val);
            window.dispatchEvent(new Event('storage'));
            
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                saveToBackend(val);
            }, 1500);
        }
    };

    const clearNote = () => {
        setNote('');
        if (selectedDate) {
            localStorage.removeItem(`workout_os_quick_note_${selectedDate}`);
            window.dispatchEvent(new Event('storage'));
        }
    };

    if (!isClient) return null;

    return (
        <section className="bg-card-white dark:bg-surface-container-lowest rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/5 flex flex-col transition-all animate-fade-in relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
                <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                    <PenTool size={16} className="text-primary" /> Quick Notes
                    {saveStatus === 'saving' && <Loader2 size={12} className="text-on-surface-variant animate-spin ml-1" />}
                    {saveStatus === 'saved' && <CheckCircle2 size={14} className="text-activity-green ml-1" />}
                </h2>

                {note.trim() && (
                    <button
                        onClick={clearNote}
                        className="font-label-sm text-label-sm text-on-surface-variant hover:text-error flex items-center transition-colors gap-1 active:scale-95"
                    >
                        Clear <Trash2 size={12} />
                    </button>
                )}
            </div>

            <textarea
                value={note}
                onChange={handleChange}
                disabled={!isToday}
                rows={3}
                placeholder={isToday ? "Jot down anything raw (e.g. 2 eggs, 500ml water, 30 min run)..." : "Cannot edit historical notes."}
                className={`w-full bg-surface-container-low border border-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary font-body-md text-on-surface p-4 resize-none rounded-2xl transition-shadow custom-scrollbar ${!isToday ? 'opacity-70 cursor-not-allowed' : ''}`}
            />
        </section>
    );
}
