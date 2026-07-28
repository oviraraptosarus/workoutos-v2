'use client';

import React from 'react';
import { X } from 'lucide-react';

interface LogSleepModalProps {
    isOpen: boolean;
    onClose: () => void;
}

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useDate } from '@/contexts/DateContext';

export default function LogSleepModal({ isOpen, onClose }: LogSleepModalProps) {
    const { userProfile } = useAuth();
    const { selectedDate } = useDate();
    const [sleepHrs, setSleepHrs] = React.useState('');
    const [mood, setMood] = React.useState('5');
    const [energy, setEnergy] = React.useState('5');

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const hrs = parseFloat(sleepHrs);
        const m = parseInt(mood);
        const en = parseInt(energy);

        const { data: { user } } = await supabase.auth.getUser();
        if (user && selectedDate) {
            const { data: existing } = await supabase
                .from('daily_logs')
                .select('id')
                .eq('user_id', user.id)
                .eq('date', selectedDate)
                .single();

            const updates: any = {};
            if (!isNaN(hrs)) updates.sleep_hours = hrs;
            if (!isNaN(m)) updates.mood_rating = m;
            if (!isNaN(en)) updates.energy_rating = en;

            if (existing) {
                await supabase.from('daily_logs').update(updates).eq('id', existing.id);
            } else {
                await supabase.from('daily_logs').insert({ user_id: user.id, date: selectedDate, ...updates });
            }
            window.dispatchEvent(new Event('storage'));
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-lg overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Log sleep</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors btn-press"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Form */}
                <form className="p-5 space-y-4" onSubmit={handleSave}>
                    <div>
                        <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">Sleep duration (hrs)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={sleepHrs}
                            onChange={(e) => setSleepHrs(e.target.value)}
                            placeholder="e.g. 7.5"
                            className="w-full bg-[#f5ebd7]/40 border border-transparent rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-300 focus:bg-[#f5ebd7]/60 transition-colors placeholder:text-gray-400 font-medium"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">Mood (1-10)</label>
                            <input
                                type="number"
                                min="1" max="10"
                                value={mood}
                                onChange={(e) => setMood(e.target.value)}
                                className="w-full bg-[#f5ebd7]/40 border border-transparent rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-300 focus:bg-[#f5ebd7]/60 transition-colors font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">Energy (1-10)</label>
                            <input
                                type="number"
                                min="1" max="10"
                                value={energy}
                                onChange={(e) => setEnergy(e.target.value)}
                                className="w-full bg-[#f5ebd7]/40 border border-transparent rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-300 focus:bg-[#f5ebd7]/60 transition-colors font-medium"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full bg-[#1f4e38] hover:bg-[#163a2a] text-white font-bold py-3.5 rounded-2xl transition-colors text-[15px] shadow-sm btn-press"
                        >
                            Log sleep
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
