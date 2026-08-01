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
        <section className="bg-white dark:bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-black/5 dark:border-white/5 flex flex-col h-full transition-all animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 relative overflow-hidden hover:shadow-lg">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="font-headline-md text-lg text-on-surface flex items-center gap-2 tracking-tight">
                    <PenTool size={20} className="text-activity-blue" /> Quick Notes
                    {saveStatus === 'saving' && <Loader2 size={12} className="text-on-surface-variant animate-spin ml-1" />}
                    {saveStatus === 'saved' && <CheckCircle2 size={14} className="text-emerald-500 ml-1" />}
                </h2>

                <div className="flex items-center gap-2">
                    {note.trim() && (
                        <button 
                            onClick={clearNote}
                            className="font-label-sm text-[11px] text-on-surface-variant hover:text-error uppercase tracking-wider flex items-center transition-colors btn-press gap-1"
                        >
                            Clear <Trash2 size={12} />
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-surface-container-low border border-surface-variant p-1 rounded-xl shadow-sm relative group flex-1">
                <textarea 
                    value={note}
                    onChange={handleChange}
                    disabled={!isToday}
                    placeholder={isToday ? "Jot down anything raw here (e.g. 2 eggs, 500ml water, 30 min run)..." : "Cannot edit historical notes."}
                    className={`w-full bg-transparent border-none focus:outline-none font-body-md text-sm text-on-surface p-4 resize-none min-h-[150px] h-full custom-scrollbar rounded-xl ${!isToday ? 'opacity-70 cursor-not-allowed' : ''}`}
                    style={{ backgroundImage: 'linear-gradient(to right, rgba(150, 150, 150, 0.1) 1px, transparent 1px)', backgroundSize: '100% 24px' }}
                />
            </div>
        </section>
    );
}
