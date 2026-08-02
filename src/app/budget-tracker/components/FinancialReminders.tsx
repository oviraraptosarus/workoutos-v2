'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Reminder {
    id: string;
    text: string;
    date: string;
    completed: boolean;
}

const REMINDERS_KEY = 'workout_os_financial_reminders';

export default function FinancialReminders() {
    const { t } = useLanguage();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newText, setNewText] = useState('');
    const [newDate, setNewDate] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem(REMINDERS_KEY);
        if (saved) {
            setReminders(JSON.parse(saved));
        } else {
            // Default sample reminders
            const defaultReminders = [
                { id: '1', text: 'Pay Car Insurance', date: '2026-08-15', completed: false },
                { id: '2', text: 'Check Passive Income Dividends', date: '2026-08-01', completed: false }
            ];
            setReminders(defaultReminders);
            localStorage.setItem(REMINDERS_KEY, JSON.stringify(defaultReminders));
        }
    }, []);

    const save = (updated: Reminder[]) => {
        setReminders(updated);
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newText.trim()) return;
        const updated = [...reminders, { id: Date.now().toString(), text: newText, date: newDate, completed: false }];
        save(updated);
        setNewText('');
        setNewDate('');
        setIsAdding(false);
    };

    const toggleComplete = (id: string) => {
        const updated = reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r);
        save(updated);
    };

    const deleteReminder = (id: string) => {
        const updated = reminders.filter(r => r.id !== id);
        save(updated);
    };

    return (
        <div className="bg-card-white  border border-surface-variant  p-6 rounded-3xl shadow-sm transition-colors h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-white/5 dark:bg-amber-900/30 text-white shadow-sm border border-surface-variant ">
                        <Bell size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-on-surface dark:text-white tracking-tight">{t('budget.reminders.title')}</h3>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-1 rounded-full text-on-surface-variant hover:text-on-surface-variant hover:bg-surface-container dark:hover:bg-surface-container-high transition-colors"
                >
                    <Plus size={18} />
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAdd} className="mb-4 bg-surface-container-low dark:bg-surface-container-high/50 p-3 rounded-xl border border-surface-variant  animate-in fade-in slide-in-from-top-2">
                    <input 
                        type="text"
                        placeholder={t("budget.reminders.placeholder")}
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        className="w-full text-sm bg-card-white  border border-surface-variant  px-3 py-2 rounded-lg mb-2 focus:outline-none focus:border-white/20"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <input 
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="flex-1 text-sm bg-card-white  border border-surface-variant  px-3 py-2 rounded-lg focus:outline-none focus:border-white/20"
                        />
                        <button type="submit" className="bg-white hover:bg-white text-black font-bold px-4 rounded-lg text-xs transition-colors">
                            Add
                        </button>
                    </div>
                </form>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {reminders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-on-surface-variant opacity-60">
                        <Bell size={24} className="mb-2" />
                        <p className="text-xs font-medium">{t('budget.reminders.noReminders')}</p>
                    </div>
                ) : (
                    reminders.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-surface-variant/50 group">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => toggleComplete(r.id)}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${r.completed ? 'bg-white border-white/20 text-black' : 'border-surface-variant dark:border-gray-600 text-transparent hover:border-white/20'}`}
                                >
                                    <CheckCircle2 size={12} strokeWidth={4} />
                                </button>
                                <div>
                                    <p className={`text-sm font-semibold transition-colors ${r.completed ? 'text-on-surface-variant line-through' : 'text-on-surface dark:text-gray-200'}`}>
                                        {r.text}
                                    </p>
                                    {r.date && (
                                        <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                                            {t('budget.reminders.due')} {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={() => deleteReminder(r.id)}
                                className="text-on-surface-variant hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
