'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useEffect, memo } from 'react';
import { Smile, Zap, Coffee, Utensils } from 'lucide-react';
import { useDate } from '@/contexts/DateContext';
import { supabase } from '@/lib/supabase/client';

const MOOD_PREFIX = 'workout_os_mood_energy_';

interface MoodState {
    mood: number;
    energy: number;
    hunger: number;
    caffeine: number;
}

const CUP_MG = 95; // caffeine_mg is stored in mg; ~95mg per cup of coffee.

const RatingSlider = memo(({ value, activeColor, onChange, label, isToday }: { value: number, activeColor: string, onChange: (val: number) => void, label: string, isToday: boolean }) => (
    <div className="flex-1 flex gap-1" role="group" aria-label={label}>
        {Array.from({ length: 10 }).map((_, i) => (
            <button
                key={i}
                onClick={() => onChange(i + 1)}
                disabled={!isToday}
                aria-label={`${label} ${i + 1} of 10`}
                aria-pressed={i < value}
                className={`h-7 rounded-full flex-1 transition-all duration-200 ${
                    i < value ? `${activeColor} shadow-sm` : 'bg-surface-container hover:bg-surface-container-high'
                } disabled:cursor-not-allowed active:scale-90`}
            />
        ))}
    </div>
));
RatingSlider.displayName = 'RatingSlider';

export default function MoodEnergyCard() {
    const { t } = useLanguage();
    const { selectedDate, isToday } = useDate();
    const [caffeine, setCaffeine] = useState(0);
    const [mood, setMood] = useState(0);
    const [energy, setEnergy] = useState(0);
    const [hunger, setHunger] = useState(0);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!selectedDate) return;

        // Backend is the source of truth; localStorage is only a fallback for
        // rows that predate Supabase persistence.
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('daily_logs')
                    .select('mood_rating, energy_rating, hunger_rating, caffeine_mg')
                    .eq('user_id', user.id)
                    .eq('date', selectedDate)
                    .maybeSingle();

                if (data && (data.mood_rating || data.energy_rating || data.hunger_rating || data.caffeine_mg)) {
                    setMood(data.mood_rating ?? 0);
                    setEnergy(data.energy_rating ?? 0);
                    setHunger(data.hunger_rating ?? 0);
                    setCaffeine(data.caffeine_mg ? Math.round(data.caffeine_mg / CUP_MG) : 0);
                    return;
                }
            }

            try {
                const raw = localStorage.getItem(`${MOOD_PREFIX}${selectedDate}`);
                if (raw) {
                    const parsed: MoodState = JSON.parse(raw);
                    setMood(parsed.mood ?? 0);
                    setEnergy(parsed.energy ?? 0);
                    setHunger(parsed.hunger ?? 0);
                    setCaffeine(parsed.caffeine ?? 0);
                } else {
                    setMood(0); setEnergy(0); setHunger(0); setCaffeine(0);
                }
            } catch {
                setMood(0); setEnergy(0); setHunger(0); setCaffeine(0);
            }
        };

        load();
        window.addEventListener('storage', load);
        return () => window.removeEventListener('storage', load);
    }, [selectedDate]);

    const handleSave = async () => {
        if (!selectedDate || saving) return;
        setSaving(true);

        localStorage.setItem(`${MOOD_PREFIX}${selectedDate}`, JSON.stringify({ mood, energy, hunger, caffeine }));

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('daily_logs').upsert(
                    {
                        user_id: user.id,
                        date: selectedDate,
                        // Columns are CHECK (1..10), so send null rather than 0 when unset.
                        mood_rating: mood > 0 ? mood : null,
                        energy_rating: energy > 0 ? energy : null,
                        hunger_rating: hunger > 0 ? hunger : null,
                        caffeine_mg: caffeine * CUP_MG,
                    },
                    { onConflict: 'user_id,date' }
                );
            }
            window.dispatchEvent(new Event('storage'));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    // renderSegments is now RatingSlider

    return (
        <div className="bg-card-white dark:bg-surface-container-lowest rounded-2xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-black/5 dark:border-white/5 transition-all relative overflow-hidden hover:shadow-lg flex flex-col">
            <div className="flex items-baseline justify-between mb-4">
                <h3 className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">How do you feel?</h3>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Optional</span>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-[68px] flex items-center gap-1.5 text-on-surface-variant shrink-0">
                        <Smile size={14} className="text-primary" />
                        <span className="font-label-sm text-label-sm">{t('dash.mood')}</span>
                    </div>
                    <RatingSlider value={mood} activeColor="bg-[#f8b47b]" onChange={setMood} label="Mood" isToday={isToday} />
                    <span className="w-7 text-right font-label-sm text-label-sm text-on-surface-variant tabular-nums">{mood || '–'}</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-[68px] flex items-center gap-1.5 text-on-surface-variant shrink-0">
                        <Zap size={14} className="text-primary" />
                        <span className="font-label-sm text-label-sm">{t('dash.energy')}</span>
                    </div>
                    <RatingSlider value={energy} activeColor="bg-[#82a88e]" onChange={setEnergy} label="Energy" isToday={isToday} />
                    <span className="w-7 text-right font-label-sm text-label-sm text-on-surface-variant tabular-nums">{energy || '–'}</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-[68px] flex items-center gap-1.5 text-on-surface-variant shrink-0">
                        <Utensils size={14} className="text-primary" />
                        <span className="font-label-sm text-label-sm">{t('dash.hunger')}</span>
                    </div>
                    <RatingSlider value={hunger} activeColor="bg-[#a78bfa]" onChange={setHunger} label="Hunger" isToday={isToday} />
                    <span className="w-7 text-right font-label-sm text-label-sm text-on-surface-variant tabular-nums">{hunger || '–'}</span>
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-surface-variant">
                <div className="flex items-center gap-2 min-w-0">
                    <Coffee size={14} className="text-primary shrink-0" />
                    <button
                        onClick={() => setCaffeine(Math.max(0, caffeine - 1))}
                        disabled={!isToday || caffeine === 0}
                        aria-label="Remove one cup of caffeine"
                        className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface transition-transform active:scale-90 disabled:opacity-40 shrink-0"
                    >
                        −
                    </button>
                    <span className="font-label-md text-label-md text-on-surface w-4 text-center tabular-nums">{caffeine}</span>
                    <button
                        onClick={() => setCaffeine(caffeine + 1)}
                        disabled={!isToday}
                        aria-label="Add one cup of caffeine"
                        className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface transition-transform active:scale-90 disabled:opacity-40 shrink-0"
                    >
                        +
                    </button>
                    <span className="font-label-sm text-label-sm text-on-surface-variant truncate">{t('dash.cups')}</span>
                </div>

                <button
                    onClick={handleSave}
                    disabled={!isToday || saving}
                    className={`font-label-md text-label-md px-5 py-2.5 rounded-full transition-all active:scale-95 disabled:opacity-40 shrink-0 ${
                        saved ? 'bg-activity-green text-white' : 'bg-primary text-on-primary'
                    }`}
                >
                    {saved ? '✓ Saved' : 'Save'}
                </button>
            </div>
        </div>
    );
}
