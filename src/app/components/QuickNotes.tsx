'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useEffect, useRef } from 'react';
import { PenTool, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { useDate } from '@/contexts/DateContext';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function QuickNotes() {
    const { t } = useLanguage();
    const { selectedDate, isToday } = useDate();
    const { user } = useAuth();
    const [note, setNote] = useState('');
    const [isClient, setIsClient] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const loadNote = async () => {
        if (!selectedDate || !user) return;
        const { data } = await supabase.from('profiles').select('target_config').eq('id', user.id).single();
        const note = data?.target_config?.quickNotes?.[selectedDate] || '';
        setNote(note);
    };

    useEffect(() => {
        setIsClient(true);
        loadNote();
        
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [selectedDate, user]);

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
            
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                saveToBackend(val);
            }, 500);
        }
    };

    const handleBlur = () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        if (selectedDate && note !== undefined) {
            saveToBackend(note);
        }
    };

    const clearNote = () => {
        setNote('');
        if (selectedDate) {
            saveToBackend('');
        }
    };

    if (!isClient) return null;

    return (
        <section className="glass-card-premium p-6 flex flex-col transition-all animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
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
                onBlur={handleBlur}
                disabled={!isToday}
                rows={3}
                placeholder={isToday ? "Jot down anything raw (e.g. 2 eggs, 500ml water, 30 min run)..." : "Cannot edit historical notes."}
                className={`glass-input-premium w-full font-body-md text-on-surface p-4 resize-none rounded-[1.25rem] relative z-10 custom-scrollbar ${!isToday ? 'opacity-70 cursor-not-allowed' : ''}`}
            />
        </section>
    );
}
