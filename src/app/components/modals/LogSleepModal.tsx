'use client';

import React from 'react';
import { X } from 'lucide-react';

interface LogSleepModalProps {
    isOpen: boolean;
    onClose: () => void;
}

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useDate } from '@/contexts/DateContext';

export default function LogSleepModal({ isOpen, onClose }: LogSleepModalProps) {
    const { userProfile } = useAuth();
    const { selectedDate } = useDate();
    const [bedtime, setBedtime] = React.useState('22:00');
    const [waketime, setWaketime] = React.useState('06:00');
    const [mood, setMood] = React.useState('5');
    const [energy, setEnergy] = React.useState('5');

    const calculateHours = (start: string, end: string) => {
        if (!start || !end) return 0;
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        let startMins = h1 * 60 + m1;
        let endMins = h2 * 60 + m2;
        if (endMins < startMins) {
            endMins += 24 * 60; // Crossed midnight
        }
        return (endMins - startMins) / 60;
    };

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const hrs = calculateHours(bedtime, waketime);
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
            if (bedtime) updates.sleep_bedtime = `${bedtime}:00`;
            if (waketime) updates.sleep_waketime = `${waketime}:00`;
            updates.sleep_hours = hrs;
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
            <div className="bg-card-white rounded-3xl w-full max-w-sm shadow-lg overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-surface-variant ">
                    <h2 className="text-lg font-bold text-on-surface dark:text-white">Log sleep</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors btn-press"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Form */}
                <form className="p-5 space-y-4" onSubmit={handleSave}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[13px] font-semibold text-on-surface mb-1.5">Bedtime</label>
                            <input
                                type="time"
                                value={bedtime}
                                onChange={(e) => setBedtime(e.target.value)}
                                className="w-full bg-[#f5ebd7]/40 border border-transparent rounded-2xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-surface-variant focus:bg-[#f5ebd7]/60 transition-colors font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] font-semibold text-on-surface mb-1.5">Wake Time</label>
                            <input
                                type="time"
                                value={waketime}
                                onChange={(e) => setWaketime(e.target.value)}
                                className="w-full bg-[#f5ebd7]/40 border border-transparent rounded-2xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-surface-variant focus:bg-[#f5ebd7]/60 transition-colors font-medium"
                            />
                        </div>
                    </div>
                    
                    <div className="text-center py-2">
                        <span className="text-sm font-bold text-on-surface-variant">
                            Total Sleep: <span className="text-white">{calculateHours(bedtime, waketime).toFixed(1)} hrs</span>
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[13px] font-semibold text-on-surface mb-1.5">Mood (1-10)</label>
                            <input
                                type="number"
                                min="1" max="10"
                                value={mood}
                                onChange={(e) => setMood(e.target.value)}
                                className="w-full bg-[#f5ebd7]/40 border border-transparent rounded-2xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-surface-variant focus:bg-[#f5ebd7]/60 transition-colors font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] font-semibold text-on-surface mb-1.5">Energy (1-10)</label>
                            <input
                                type="number"
                                min="1" max="10"
                                value={energy}
                                onChange={(e) => setEnergy(e.target.value)}
                                className="w-full bg-[#f5ebd7]/40 border border-transparent rounded-2xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-surface-variant focus:bg-[#f5ebd7]/60 transition-colors font-medium"
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
