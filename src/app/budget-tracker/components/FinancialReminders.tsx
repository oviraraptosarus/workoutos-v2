'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Reminder {
    id: string;
    user_id: string;
    text: string;
    date: string | null;
    completed: boolean;
}

export default function FinancialReminders() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newText, setNewText] = useState('');
    const [newDate, setNewDate] = useState('');

    useEffect(() => {
        if (!user) return;

        const fetchReminders = async () => {
            const { data, error } = await supabase
                .from('financial_reminders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setReminders(data);
            }
        };

        fetchReminders();
    }, [user]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newText.trim() || !user) return;
        
        const tempId = Date.now().toString();
        const newReminder = { 
            id: tempId, 
            user_id: user.id, 
            text: newText, 
            date: newDate || null, 
            completed: false 
        };
        
        // Optimistic UI update
        setReminders([...reminders, newReminder]);
        setNewText('');
        setNewDate('');
        setIsAdding(false);

        const { data, error } = await supabase
            .from('financial_reminders')
            .insert({
                user_id: user.id,
                text: newReminder.text,
                date: newReminder.date,
                completed: newReminder.completed
            })
            .select()
            .single();

        if (!error && data) {
            setReminders(prev => prev.map(r => r.id === tempId ? data : r));
        }
    };

    const toggleComplete = async (id: string, currentStatus: boolean) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !currentStatus } : r));
        await supabase
            .from('financial_reminders')
            .update({ completed: !currentStatus })
            .eq('id', id);
    };

    const deleteReminder = async (id: string) => {
        setReminders(prev => prev.filter(r => r.id !== id));
        await supabase
            .from('financial_reminders')
            .delete()
            .eq('id', id);
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
                <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                    <Bell size={20} className="text-[#0a84ff]" /> {t('budget.reminders.title')}
                </h2>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-1 rounded-full text-on-surface-variant hover:text-on-surface-variant hover:bg-surface-container dark:hover:bg-surface-container-high transition-colors"
                >
                    <Plus size={18} />
                </button>
            </div>
            <div className="glass-card-premium p-4 sm:p-5 flex flex-col transition-colors min-h-[300px]">

                {isAdding && (
                    <form onSubmit={handleAdd} className="mb-4 bg-surface-container-low dark:bg-surface-container-high/50 p-3 rounded-xl border border-surface-variant animate-in fade-in slide-in-from-top-2">
                        <input 
                            type="text"
                            placeholder={t("budget.reminders.placeholder")}
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            className="w-full text-sm bg-card-white border border-surface-variant px-3 py-2 rounded-lg mb-2 focus:outline-none focus:border-white/20"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <input 
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="flex-1 text-sm bg-card-white border border-surface-variant px-3 py-2 rounded-lg focus:outline-none focus:border-white/20"
                            />
                            <button type="submit" className="bg-white hover:bg-white text-black font-bold px-4 rounded-lg text-xs transition-colors">
                                Add
                            </button>
                        </div>
                    </form>
                )}

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {reminders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-on-surface-variant opacity-60 min-h-[150px]">
                            <Bell size={24} className="mb-2" />
                            <p className="text-xs font-medium">{t('budget.reminders.noReminders')}</p>
                        </div>
                    ) : (
                        reminders.map(r => (
                            <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-surface-variant/50 group">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => toggleComplete(r.id, r.completed)}
                                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors shrink-0 ${r.completed ? 'bg-white border-white/20 text-black' : 'border-surface-variant dark:border-gray-600 text-transparent hover:border-white/20'}`}
                                    >
                                        <CheckCircle2 size={12} strokeWidth={4} />
                                    </button>
                                    <div>
                                        <p className={`text-sm font-semibold transition-colors ${r.completed ? 'text-on-surface-variant line-through' : 'text-on-surface dark:text-gray-200'}`}>
                                            {r.text}
                                        </p>
                                        {r.date && (
                                            <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                                                {t('budget.reminders.due')} {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => deleteReminder(r.id)}
                                    className="text-on-surface-variant hover:text-on-surface transition-colors opacity-0 group-hover:opacity-100 p-2 shrink-0"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
