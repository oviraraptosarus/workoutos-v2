'use client';

import React, { useState, useEffect } from 'react';
import { PenTool, Trash2, Sparkles } from 'lucide-react';
import RawDataAITransformerModal from './RawDataAITransformerModal';
import { useDate } from '@/contexts/DateContext';

export default function QuickNotes() {
    const { selectedDate, isToday } = useDate();
    const [note, setNote] = useState('');
    const [isClient, setIsClient] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    const loadNote = () => {
        setNote('');
    };

    useEffect(() => {
        setIsClient(true);
        loadNote();
        
        window.addEventListener('storage', loadNote);
        return () => window.removeEventListener('storage', loadNote);
    }, [selectedDate]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setNote(val);
    };

    const clearNote = () => {
        setNote('');
    };

    if (!isClient) return null;

    return (
        <section className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-full transition-colors animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
                    <PenTool size={20} className="text-amber-500" /> Quick Notes
                </h2>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsAIModalOpen(true)}
                        className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-500/20 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all btn-press shadow-sm"
                        title="AI Transform Raw Notes into App Logs"
                    >
                        <Sparkles size={12} className="text-amber-600 dark:text-amber-400" /> AI Log Transformer
                    </button>

                    {note.trim() && (
                        <button 
                            onClick={clearNote}
                            className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 uppercase tracking-wider flex items-center transition-colors btn-press gap-1"
                        >
                            Clear <Trash2 size={12} />
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-gray-100 dark:border-amber-900/40 p-1 rounded-3xl shadow-sm relative group flex-1">
                <textarea 
                    value={note}
                    onChange={handleChange}
                    disabled={!isToday}
                    placeholder={isToday ? "Jot down anything raw here (e.g. 2 eggs, 500ml water, 30 min run)... AI can auto-sort it!" : "Cannot edit historical notes."}
                    className={`w-full bg-transparent border-none focus:outline-none text-sm text-gray-700 dark:text-amber-100/90 font-medium p-4 resize-none min-h-[150px] h-full custom-scrollbar rounded-3xl ${!isToday ? 'opacity-70 cursor-not-allowed' : ''}`}
                    style={{ backgroundImage: 'linear-gradient(to right, rgba(245, 158, 11, 0.1) 1px, transparent 1px)', backgroundSize: '100% 24px' }}
                />
            </div>

            {/* Universal AI Raw Data Transformer Modal */}
            <RawDataAITransformerModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
            />
        </section>
    );
}
