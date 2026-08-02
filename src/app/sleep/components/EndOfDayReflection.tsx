'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Star, Target, CheckCircle2 } from 'lucide-react';
import { useDate } from '@/contexts/DateContext';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface ReflectionData {
    mood: string;
    energy: string;
    stress: string;
    productivity: number;
    waterIntake: string;
    screenTime: string;
    journal: string;
    highlights: string;
    gratitude: string;
    rating: number;
}

const DEFAULT_REFLECTION: ReflectionData = {
    mood: 'good',
    energy: 'medium',
    stress: 'low',
    productivity: 3,
    waterIntake: '',
    screenTime: '',
    journal: '',
    highlights: '',
    gratitude: '',
    rating: 5,
};

// Map text values to numeric ratings for daily_logs columns
function moodToRating(mood: string): number {
    return { great: 9, good: 7, okay: 5, bad: 2 }[mood] ?? 5;
}
function energyToRating(energy: string): number {
    return { high: 8, medium: 5, low: 2 }[energy] ?? 5;
}
function screenTimeToMinutes(raw: string): number | null {
    // Parse strings like "4h 30m", "2h", "90m", "1.5h"
    const match = raw.match(/(?:(\d+(?:\.\d+)?)\s*h)?(?:\s*(\d+)\s*m)?/i);
    if (!match) return null;
    const hrs = parseFloat(match[1] || '0');
    const mins = parseInt(match[2] || '0', 10);
    const total = Math.round(hrs * 60 + mins);
    return total > 0 ? total : null;
}

export default function EndOfDayReflection() {
    const { selectedDate } = useDate();
    const { user } = useAuth();

    const [reflection, setReflection] = useState<ReflectionData>(DEFAULT_REFLECTION);
    const [isSaving, setIsSaving] = useState(false);
    const [savedNotice, setSavedNotice] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load: Supabase first, fall back to localStorage
    const load = useCallback(async () => {
        if (!selectedDate) return;
        setIsLoaded(false);

        if (user) {
            const { data } = await supabase
                .from('daily_logs')
                .select('reflection, mood_rating, energy_rating, screen_time_phone_minutes')
                .eq('user_id', user.id)
                .eq('date', selectedDate)
                .maybeSingle();

            if (data?.reflection && Object.keys(data.reflection).length > 0) {
                setReflection({ ...DEFAULT_REFLECTION, ...(data.reflection as ReflectionData) });
                setIsLoaded(true);
                return;
            }
        }

        // Fall back to localStorage
        const saved = localStorage.getItem(`workout_os_reflection_${selectedDate}`);
        if (saved) {
            try { setReflection({ ...DEFAULT_REFLECTION, ...JSON.parse(saved) }); } catch {}
        } else {
            setReflection(DEFAULT_REFLECTION);
        }
        setIsLoaded(true);
    }, [selectedDate, user]);

    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        if (!selectedDate) return;
        setIsSaving(true);

        // Always persist locally first (offline resilience)
        localStorage.setItem(`workout_os_reflection_${selectedDate}`, JSON.stringify(reflection));
        window.dispatchEvent(new Event('storage'));

        if (user) {
            try {
                const row: any = {
                    user_id: user.id,
                    date: selectedDate,
                    // Structured columns that already exist
                    mood_rating: moodToRating(reflection.mood),
                    energy_rating: energyToRating(reflection.energy),
                    // Full rich reflection stored as JSONB
                    reflection,
                };

                // Map screen time string to minutes if provided
                const screenMins = screenTimeToMinutes(reflection.screenTime);
                if (screenMins !== null) row.screen_time_phone_minutes = screenMins;

                const { error } = await supabase
                    .from('daily_logs')
                    .upsert(row, { onConflict: 'user_id,date' });

                if (error) throw error;
            } catch (err) {
                console.error('Error saving reflection:', err);
            }
        }

        setIsSaving(false);
        setSavedNotice(true);
        // Dispatch so EndOfDayBanner knows reflection was saved
        window.dispatchEvent(new Event('workout_os_reflection_saved'));
        setTimeout(() => setSavedNotice(false), 3000);
    };

    const update = (field: keyof ReflectionData, value: any) =>
        setReflection(prev => ({ ...prev, [field]: value }));

    const SELECT_CLS = "w-full bg-surface-container-highest border border-transparent focus:border-secondary rounded-xl px-3 py-2 text-sm font-bold text-on-surface appearance-none transition-colors outline-none";
    const INPUT_CLS = "w-full bg-surface-container-highest border border-transparent focus:border-secondary rounded-xl px-3 py-2 text-sm font-medium text-on-surface transition-colors outline-none";
    const TEXTAREA_CLS = "w-full bg-surface-container-highest border border-transparent focus:border-secondary rounded-xl px-4 py-3 text-sm font-medium text-on-surface resize-none transition-colors outline-none";
    const LABEL_CLS = "text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1";

    return (
        <div className="bg-surface-container-low border border-surface-variant p-6 rounded-[2rem] shadow-sm space-y-6 transition-colors relative">

            {/* Saved toast */}
            {savedNotice && (
                <div className="absolute top-4 right-1/2 translate-x-1/2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold animate-in fade-in slide-in-from-top-2 shadow-lg z-10 flex items-center gap-2 whitespace-nowrap">
                    <CheckCircle2 size={14} /> Reflection Saved!
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                    <BookOpen size={18} className="text-secondary" /> End of Day Reflection
                </h2>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-secondary hover:bg-secondary-fixed text-on-secondary px-4 py-2 rounded-full text-xs font-bold transition-colors btn-press shadow-sm disabled:opacity-50"
                >
                    {isSaving ? 'Saving…' : 'Save Reflection'}
                </button>
            </div>

            {/* Core metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label className={LABEL_CLS}>Overall Mood</label>
                    <select value={reflection.mood} onChange={e => update('mood', e.target.value)} className={SELECT_CLS}>
                        <option value="great">Great 😄</option>
                        <option value="good">Good 🙂</option>
                        <option value="okay">Okay 😐</option>
                        <option value="bad">Bad 😞</option>
                    </select>
                </div>
                <div>
                    <label className={LABEL_CLS}>Energy</label>
                    <select value={reflection.energy} onChange={e => update('energy', e.target.value)} className={SELECT_CLS}>
                        <option value="high">High ⚡</option>
                        <option value="medium">Medium 🔋</option>
                        <option value="low">Low 😴</option>
                    </select>
                </div>
                <div>
                    <label className={LABEL_CLS}>Stress</label>
                    <select value={reflection.stress} onChange={e => update('stress', e.target.value)} className={SELECT_CLS}>
                        <option value="low">Low 🧘</option>
                        <option value="moderate">Moderate 😤</option>
                        <option value="high">High 🔥</option>
                    </select>
                </div>
                <div>
                    <label className={LABEL_CLS}>Productivity</label>
                    <select value={reflection.productivity} onChange={e => update('productivity', parseInt(e.target.value))} className={SELECT_CLS}>
                        {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}/5</option>)}
                    </select>
                </div>
            </div>

            {/* Water + Screen time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLS}>Water Intake</label>
                    <input
                        type="text"
                        placeholder="e.g. 3L or 2500ml"
                        value={reflection.waterIntake}
                        onChange={e => update('waterIntake', e.target.value)}
                        className={INPUT_CLS}
                    />
                </div>
                <div>
                    <label className={LABEL_CLS}>Screen Time</label>
                    <input
                        type="text"
                        placeholder="e.g. 4h 30m or 2h"
                        value={reflection.screenTime}
                        onChange={e => update('screenTime', e.target.value)}
                        className={INPUT_CLS}
                    />
                    {reflection.screenTime && screenTimeToMinutes(reflection.screenTime) !== null && (
                        <p className="text-[10px] text-secondary font-bold mt-1">
                            {screenTimeToMinutes(reflection.screenTime)} min will be saved to your log
                        </p>
                    )}
                </div>
            </div>

            {/* Text areas */}
            <div className="space-y-4">
                <div>
                    <label className={LABEL_CLS}>Journal / Thoughts</label>
                    <textarea
                        rows={2}
                        placeholder="How was your day?"
                        value={reflection.journal}
                        onChange={e => update('journal', e.target.value)}
                        className={TEXTAREA_CLS}
                    />
                </div>
                <div>
                    <label className={LABEL_CLS}>Highlights (Wins)</label>
                    <textarea
                        rows={2}
                        placeholder="What went well today?"
                        value={reflection.highlights}
                        onChange={e => update('highlights', e.target.value)}
                        className={TEXTAREA_CLS}
                    />
                </div>
                <div>
                    <label className={LABEL_CLS}>Gratitude</label>
                    <textarea
                        rows={2}
                        placeholder="What are you grateful for today?"
                        value={reflection.gratitude}
                        onChange={e => update('gratitude', e.target.value)}
                        className={TEXTAREA_CLS}
                    />
                </div>
            </div>

            {/* Star rating */}
            <div className="pt-3 border-t border-surface-variant flex items-center justify-between">
                <label className="text-sm font-bold text-on-surface uppercase tracking-wider">Overall Day Rating</label>
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => update('rating', star)}
                            className={`p-1 transition-all ${reflection.rating >= star ? 'text-white scale-110 drop-shadow-sm' : 'text-surface-container-highest hover:text-zinc-300'}`}
                        >
                            <Star size={24} fill={reflection.rating >= star ? 'currentColor' : 'none'} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Backend indicator */}
            <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-white' : 'bg-amber-400'}`} />
                <span className="text-[10px] font-bold text-on-surface-variant">
                    {user ? 'Synced to cloud (Supabase)' : 'Saved locally only — sign in to sync'}
                </span>
            </div>
        </div>
    );
}
