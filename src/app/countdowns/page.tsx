'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Hourglass, Calendar, Trash2 } from 'lucide-react';
import clsx from 'clsx';

interface Countdown {
    id: string;
    title: string;
    target_date: string;
}

export default function CountdownsPage() {
    const { userProfile, session } = useAuth();
    const [countdowns, setCountdowns] = useState<Countdown[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState('');

    useEffect(() => {
        if (session?.user) {
            loadCountdowns();
        }
    }, [session]);

    const loadCountdowns = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('countdowns')
            .select('*')
            .order('target_date', { ascending: true });
            
        if (!error && data) {
            setCountdowns(data);
        }
        setIsLoading(false);
    };

    const handleAddCountdown = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newDate || !session?.user) return;

        const { data, error } = await supabase
            .from('countdowns')
            .insert({
                user_id: session.user.id,
                title: newTitle.trim(),
                target_date: newDate
            })
            .select()
            .single();

        if (!error && data) {
            setCountdowns(prev => [...prev, data].sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime()));
            setNewTitle('');
            setNewDate('');
            setIsAdding(false);
        } else {
            console.error('Failed to add countdown', error);
            alert('Failed to add countdown.');
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('countdowns').delete().eq('id', id);
        if (!error) {
            setCountdowns(prev => prev.filter(c => c.id !== id));
        }
    };

    const getDaysRemaining = (targetDate: string) => {
        const target = new Date(targetDate);
        target.setHours(23, 59, 59, 999); // End of the target day
        const today = new Date();
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <AppLayout>
            <div className="space-y-6 pb-12 animate-in fade-in duration-700">
                <div className="pb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-on-surface">
                            Countdowns
                        </h1>
                    </div>
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-[#0a84ff] text-white p-2 sm:px-4 sm:py-2 rounded-full font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">{isAdding ? 'Cancel' : 'New Target'}</span>
                    </button>
                </div>

                {isAdding && (
                    <form onSubmit={handleAddCountdown} className="glass-card-premium p-6 rounded-[2rem] flex flex-col gap-4 animate-in slide-in-from-top-4 relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent"></div>
                        <h3 className="font-bold text-on-surface text-lg">Define New Target</h3>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Event Title</label>
                                <input 
                                    type="text" 
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    placeholder="e.g. Marathon, Launch MVP, Vacation"
                                    className="w-full bg-surface-container border border-surface-variant rounded-xl p-4 text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all shadow-inner font-body"
                                    required
                                />
                            </div>
                            <div className="sm:w-48">
                                <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Target Date</label>
                                <input 
                                    type="date" 
                                    value={newDate}
                                    onChange={e => setNewDate(e.target.value)}
                                    className="w-full bg-surface-container border border-surface-variant rounded-xl p-4 text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all shadow-inner font-body"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end mt-2">
                            <button 
                                type="submit"
                                className="bg-secondary text-on-secondary px-8 py-3.5 rounded-xl font-bold tracking-wide transition-all active:scale-95 shadow-[0_4px_15px_rgba(var(--c-secondary)/0.4)] hover:-translate-y-0.5"
                            >
                                Start Countdown
                            </button>
                        </div>
                    </form>
                )}

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Hourglass className="w-8 h-8 text-secondary animate-spin" />
                    </div>
                ) : countdowns.length === 0 ? (
                    <div className="text-center py-20 bg-surface-container-lowest border border-surface-variant/30 rounded-[2rem] shadow-sm">
                        <Hourglass className="w-12 h-12 text-on-surface-variant opacity-30 mx-auto mb-4" />
                        <h3 className="text-xl font-display font-bold text-on-surface mb-2">No active targets</h3>
                        <p className="text-on-surface-variant mb-6">Create a countdown for your next big mission.</p>
                        <button 
                            onClick={() => setIsAdding(true)} 
                            className="text-secondary font-bold hover:underline"
                        >
                            + Add your first target
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        {countdowns.map((countdown, index) => {
                            const daysLeft = getDaysRemaining(countdown.target_date);
                            const isPast = daysLeft < 0;
                            const isToday = daysLeft === 0;
                            
                            return (
                                <div 
                                    key={countdown.id} 
                                    className={clsx(
                                        "group relative overflow-hidden rounded-[22px] p-4 flex flex-col justify-between aspect-square transition-all duration-300",
                                        isPast ? "bg-[#1c1c1e]/50 opacity-50" : 
                                        isToday ? "bg-gradient-to-br from-[#0a84ff] to-[#0051a8] text-white shadow-lg shadow-[#0a84ff]/20" :
                                        "bg-[#1c1c1e] shadow-sm"
                                    )}
                                >
                                    {/* Delete Button */}
                                    <button
                                        onClick={() => handleDelete(countdown.id)}
                                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 text-white/70 hover:text-white hover:bg-error/80 transition-colors opacity-0 group-hover:opacity-100 z-20"
                                        aria-label="Delete countdown"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Top Section: Icon & Title */}
                                    <div className="z-10 w-full">
                                        <div className="flex items-center gap-1.5 mb-1 opacity-60">
                                            <Calendar className={clsx("w-3 h-3", isToday ? "text-white" : "text-[#0a84ff]")} />
                                            <span className={clsx("text-[10px] font-bold tracking-widest uppercase", isToday ? "text-white" : "text-on-surface-variant")}>
                                                Mission
                                            </span>
                                        </div>
                                        <h3 className={clsx("text-base font-semibold leading-tight line-clamp-2", isToday ? "text-white" : "text-on-surface")}>
                                            {countdown.title}
                                        </h3>
                                        <div className={clsx("text-xs mt-0.5 font-medium", isToday ? "text-white/70" : "text-on-surface-variant")}>
                                            {`${String(new Date(countdown.target_date).getDate()).padStart(2, '0')}/${String(new Date(countdown.target_date).getMonth() + 1).padStart(2, '0')}/${String(new Date(countdown.target_date).getFullYear()).slice(-2)}`}
                                        </div>
                                    </div>
                                    
                                    {/* Bottom Section: Days */}
                                    <div className="flex flex-col items-start mt-auto">
                                        {isPast ? (
                                            <div className="text-xl font-bold uppercase tracking-wide text-white/50">
                                                DONE
                                            </div>
                                        ) : isToday ? (
                                            <div className="text-3xl font-black tracking-tight uppercase">
                                                TODAY
                                            </div>
                                        ) : (
                                            <div className="flex items-baseline gap-1">
                                                <span className={clsx(
                                                    "text-[2.75rem] font-bold tracking-tighter tabular-nums leading-none",
                                                    daysLeft <= 3 ? "text-error" : "text-[#0a84ff]"
                                                )}>
                                                    {daysLeft}
                                                </span>
                                                <span className="text-[11px] font-bold uppercase tracking-wider opacity-60 pb-1">
                                                    {daysLeft === 1 ? 'Day' : 'Days'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
