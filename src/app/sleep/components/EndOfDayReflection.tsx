'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Star, Target, CheckCircle2, History } from 'lucide-react';
import { useDate } from '@/contexts/DateContext';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface JournalData {
    mood: string;
    energy: string;
    stress: string;
    productivity: number;
    waterIntake: string;
    screenTime: string;
    morning_journal: string;
    evening_reflection: string;
    free_writing: string;
    gratitude: string;
    wins: string;
    lessons: string;
    tomorrow_priorities: string;
    rating: number;
    bedtime?: string;
    waketime?: string;
}

const DEFAULT_JOURNAL: JournalData = {
    mood: 'good',
    energy: 'medium',
    stress: 'low',
    productivity: 3,
    waterIntake: '',
    screenTime: '',
    morning_journal: '',
    evening_reflection: '',
    free_writing: '',
    gratitude: '',
    wins: '',
    lessons: '',
    tomorrow_priorities: '',
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
    const { t } = useLanguage();
    const { selectedDate } = useDate();
    const { user } = useAuth();

    const [reflection, setReflection] = useState<JournalData>(DEFAULT_JOURNAL);
    const [isSaving, setIsSaving] = useState(false);
    const [savedNotice, setSavedNotice] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    // Load: Supabase first, fall back to localStorage
    const load = useCallback(async () => {
        if (!selectedDate) return;
        setIsLoaded(false);

        if (user) {
            const { data } = await supabase
                .from('daily_logs')
                .select('date, reflection, mood_rating, energy_rating, screen_time_phone_minutes')
                .eq('user_id', user.id)
                .lte('date', selectedDate)
                .order('date', { ascending: false })
                .limit(7);

            if (data && data.length > 0) {
                const todayLog = data.find(d => d.date === selectedDate);
                if (todayLog?.reflection && Object.keys(todayLog.reflection).length > 0) {
                    setReflection({ ...DEFAULT_JOURNAL, ...(todayLog.reflection as JournalData) });
                } else {
                    setReflection(DEFAULT_JOURNAL);
                }

                const historyLogs = data.filter(d => d.date !== selectedDate && d.reflection && Object.keys(d.reflection).length > 0);
                setHistory(historyLogs);
                
                setIsLoaded(true);
                return;
            }
        }

        setReflection(DEFAULT_JOURNAL);
        setHistory([]);
        setIsLoaded(true);
    }, [selectedDate, user]);

    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        if (!selectedDate) return;
        setIsSaving(true);

        
        if (user) {
            try {
                const row: any = {
                    user_id: user.id,
                    date: selectedDate,
                    // Structured columns that already exist
                    mood_rating: moodToRating(reflection.mood),
                    energy_rating: energyToRating(reflection.energy),
                    reflection: {
                        morning_journal: reflection.morning_journal,
                        evening_reflection: reflection.evening_reflection,
                        free_writing: reflection.free_writing,
                        gratitude: reflection.gratitude,
                        wins: reflection.wins,
                        lessons: reflection.lessons,
                        tomorrow_priorities: reflection.tomorrow_priorities,
                    }
                };

                // Map screen time string to minutes if provided
                const screenMins = screenTimeToMinutes(reflection.screenTime);
                if (screenMins !== null) row.screen_time_phone_minutes = screenMins;

                if (reflection.bedtime) row.sleep_bedtime = reflection.bedtime.length === 5 ? `${reflection.bedtime}:00` : reflection.bedtime;
                if (reflection.waketime) row.sleep_waketime = reflection.waketime.length === 5 ? `${reflection.waketime}:00` : reflection.waketime;

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

    const update = (field: keyof JournalData, value: any) =>
        setReflection(prev => ({ ...prev, [field]: value }));

    const SELECT_CLS = "w-full bg-surface-container-highest border border-transparent focus:border-secondary rounded-xl px-3 py-2 text-sm font-bold text-on-surface appearance-none transition-colors outline-none";
    const INPUT_CLS = "w-full bg-surface-container-highest border border-transparent focus:border-secondary rounded-xl px-3 py-2 text-sm font-medium text-on-surface transition-colors outline-none";
    const TEXTAREA_CLS = "w-full bg-surface-container-highest border border-transparent focus:border-secondary rounded-xl px-4 py-3 text-sm font-medium text-on-surface resize-none transition-colors outline-none";
    const LABEL_CLS = "text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1";

    return (
        <div className="bg-surface-container-low border border-surface-variant p-4 sm:p-5 rounded-2xl shadow-sm space-y-4 transition-colors relative">

            {/* Saved toast */}
            {savedNotice && (
                <div className="absolute top-4 right-1/2 translate-x-1/2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold animate-in fade-in slide-in-from-top-2 shadow-lg z-10 flex items-center gap-2 whitespace-nowrap">
                    <CheckCircle2 size={14} /> Reflection Saved!
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                    <BookOpen size={18} className="text-secondary" /> Daily Journal
                </h2>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-secondary hover:bg-secondary-fixed text-on-secondary px-4 py-2 rounded-full text-xs font-bold transition-colors btn-press shadow-sm disabled:opacity-50"
                >
                    {isSaving ? t('sleep.reflection.saving') : t('sleep.reflection.saveBtn')}
                </button>
            </div>

            {/* Core metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label className={LABEL_CLS}>{t('sleep.reflection.overallMood')}</label>
                    <select value={reflection.mood} onChange={e => update('mood', e.target.value)} className={SELECT_CLS}>
                        <option value="great">{t('sleep.reflection.moodGreat')}</option>
                        <option value="good">{t('sleep.reflection.moodGood')}</option>
                        <option value="okay">{t('sleep.reflection.moodOkay')}</option>
                        <option value="bad">{t('sleep.reflection.moodBad')}</option>
                    </select>
                </div>
                <div>
                    <label className={LABEL_CLS}>{t('sleep.reflection.energy')}</label>
                    <select value={reflection.energy} onChange={e => update('energy', e.target.value)} className={SELECT_CLS}>
                        <option value="high">{t('sleep.reflection.energyHigh')}</option>
                        <option value="medium">{t('sleep.reflection.energyMedium')}</option>
                        <option value="low">{t('sleep.reflection.energyLow')}</option>
                    </select>
                </div>
                <div>
                    <label className={LABEL_CLS}>{t('sleep.reflection.stress')}</label>
                    <select value={reflection.stress} onChange={e => update('stress', e.target.value)} className={SELECT_CLS}>
                        <option value="low">{t('sleep.reflection.stressLow')}</option>
                        <option value="moderate">{t('sleep.reflection.stressModerate')}</option>
                        <option value="high">{t('sleep.reflection.stressHigh')}</option>
                    </select>
                </div>
                <div>
                    <label className={LABEL_CLS}>{t('sleep.reflection.productivity')}</label>
                    <select value={reflection.productivity} onChange={e => update('productivity', parseInt(e.target.value))} className={SELECT_CLS}>
                        {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}/5</option>)}
                    </select>
                </div>
            </div>

            {/* Water + Screen time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLS}>{t('sleep.reflection.waterIntake')}</label>
                    <input
                        type="text"
                        placeholder={t("sleep.reflection.waterPlaceholder")}
                        value={reflection.waterIntake}
                        onChange={e => update('waterIntake', e.target.value)}
                        className={INPUT_CLS}
                    />
                </div>
                <div>
                    <label className={LABEL_CLS}>{t('sleep.reflection.screenTime')}</label>
                    <input
                        type="text"
                        placeholder={t("sleep.reflection.screenPlaceholder")}
                        value={reflection.screenTime}
                        onChange={e => update('screenTime', e.target.value)}
                        className={INPUT_CLS}
                    />
                    {reflection.screenTime && screenTimeToMinutes(reflection.screenTime) !== null && (
                        <p className="text-[10px] text-secondary font-bold mt-1">
                            {t('sleep.reflection.screenSaveMsg').replace('{mins}', screenTimeToMinutes(reflection.screenTime)!.toString())}
                        </p>
                    )}
                </div>
            </div>

            {/* Text areas */}
            <div className="space-y-4">
                <div>
                    <label className={LABEL_CLS}>Morning Journal / Intentions</label>
                    <textarea
                        rows={2}
                        placeholder="How do you want to show up today?"
                        value={reflection.morning_journal}
                        onChange={e => update('morning_journal', e.target.value)}
                        className={TEXTAREA_CLS}
                    />
                </div>
                <div>
                    <label className={LABEL_CLS}>Evening Reflection</label>
                    <textarea
                        rows={2}
                        placeholder="How did today go?"
                        value={reflection.evening_reflection}
                        onChange={e => update('evening_reflection', e.target.value)}
                        className={TEXTAREA_CLS}
                    />
                </div>
                <div>
                    <label className={LABEL_CLS}>Free Writing</label>
                    <textarea
                        rows={2}
                        placeholder="Dump your thoughts here..."
                        value={reflection.free_writing}
                        onChange={e => update('free_writing', e.target.value)}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={LABEL_CLS}>Wins / Highlights</label>
                        <textarea
                            rows={2}
                            placeholder="What went well?"
                            value={reflection.wins}
                            onChange={e => update('wins', e.target.value)}
                            className={TEXTAREA_CLS}
                        />
                    </div>
                    <div>
                        <label className={LABEL_CLS}>Lessons Learned</label>
                        <textarea
                            rows={2}
                            placeholder="What could be improved?"
                            value={reflection.lessons}
                            onChange={e => update('lessons', e.target.value)}
                            className={TEXTAREA_CLS}
                        />
                    </div>
                </div>
                <div>
                    <label className={LABEL_CLS}>Tomorrow's Priorities</label>
                    <textarea
                        rows={2}
                        placeholder="What's the main focus for tomorrow?"
                        value={reflection.tomorrow_priorities}
                        onChange={e => update('tomorrow_priorities', e.target.value)}
                        className={TEXTAREA_CLS}
                    />
                </div>
            </div>

            {/* Star rating */}
            <div className="pt-3 border-t border-surface-variant flex items-center justify-between">
                <label className="text-sm font-bold text-on-surface uppercase tracking-wider">{t('sleep.reflection.dayRating')}</label>
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
                    {user ? t('sleep.reflection.syncedCloud') : t('sleep.reflection.savedLocal')}
                </span>
            </div>

            {/* Recent History */}
            {history.length > 0 && (
                <div className="mt-8 pt-6 border-t border-surface-variant">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2 mb-4">
                        <History size={18} className="text-on-surface-variant" /> Recent History
                    </h3>
                    <div className="space-y-4">
                        {history.map(log => (
                            <div key={log.date} className="bg-surface-container-lowest border border-surface-variant rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-on-surface text-sm">{log.date}</h4>
                                    {log.reflection?.rating && (
                                        <div className="flex items-center gap-0.5 text-secondary">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} size={12} fill={i < log.reflection.rating ? 'currentColor' : 'none'} className={i >= log.reflection.rating ? 'text-surface-variant' : ''} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {log.reflection?.morning_journal && (
                                    <div className="mb-2">
                                        <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Morning Intentions</span>
                                        <p className="text-xs text-on-surface">{log.reflection.morning_journal}</p>
                                    </div>
                                )}
                                {log.reflection?.evening_reflection && (
                                    <div className="mb-2">
                                        <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Evening Reflection</span>
                                        <p className="text-xs text-on-surface">{log.reflection.evening_reflection}</p>
                                    </div>
                                )}
                                {log.reflection?.wins && (
                                    <div>
                                        <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Wins</span>
                                        <p className="text-xs text-on-surface">{log.reflection.wins}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
