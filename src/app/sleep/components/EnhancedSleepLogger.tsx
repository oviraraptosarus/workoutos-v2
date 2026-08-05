'use client';

import React, { useState } from 'react';
import { Plus, Moon, Activity, Heart, Frown, Smile, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface EnhancedSleepLoggerProps {
    onLogSaved: (data: any) => void;
}

export default function EnhancedSleepLogger({ onLogSaved }: EnhancedSleepLoggerProps) {
    const { t } = useLanguage();
    const [bedtime, setBedtime] = useState('23:00');
    const [waketime, setWaketime] = useState('07:00');
    const [hours, setHours] = useState('8');
    const [mood, setMood] = useState('good');
    const [energy, setEnergy] = useState('medium');
    const [stress, setStress] = useState('low');
    const [quality, setQuality] = useState('good');
    const [notes, setNotes] = useState('');
    const [dreams, setDreams] = useState('');
    const [tags, setTags] = useState('');

    // Derive duration from bed/wake, handling the overnight wrap (e.g. 23:00 → 07:00).
    const computeHours = (bed: string, wake: string): number => {
        const [bh, bm] = bed.split(':').map(Number);
        const [wh, wm] = wake.split(':').map(Number);
        if ([bh, bm, wh, wm].some(Number.isNaN)) return 0;
        let mins = (wh * 60 + wm) - (bh * 60 + bm);
        if (mins <= 0) mins += 24 * 60;
        return Math.round((mins / 60) * 10) / 10;
    };

    const handleBed = (v: string) => { setBedtime(v); setHours(String(computeHours(v, waketime))); };
    const handleWake = (v: string) => { setWaketime(v); setHours(String(computeHours(bedtime, v))); };

    const handleSave = () => {
        const numHours = parseFloat(hours);
        if (!numHours) return;

        const logData = {
            id: Date.now(),
            amount: numHours,
            type: 'Night Sleep',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            details: {
                bedtime,
                waketime,
                mood,
                energy,
                stress,
                quality,
                notes,
                dreams,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean)
            }
        };

        onLogSaved(logData);
        // Reset text fields; keep times/duration for quick re-entry.
        setNotes('');
        setDreams('');
        setTags('');
    };

    return (
        <div className="bg-surface-container-low border border-surface-variant p-4 sm:p-5 rounded-2xl shadow-sm space-y-4 transition-colors">
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2 mb-2">
                <Moon size={18} className="text-secondary" /> Advanced Sleep Log
            </h2>

            {/* Bed & Wake times */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('sleep.logger.bedtime')}</label>
                    <input
                        type="time" value={bedtime} onChange={e => handleBed(e.target.value)}
                        className="w-full mt-1.5 bg-surface-container-highest border border-transparent rounded-2xl px-4 py-3 font-bold text-on-surface focus:outline-none focus:border-secondary transition-colors"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('sleep.logger.waketime')}</label>
                    <input
                        type="time" value={waketime} onChange={e => handleWake(e.target.value)}
                        className="w-full mt-1.5 bg-surface-container-highest border border-transparent rounded-2xl px-4 py-3 font-bold text-on-surface focus:outline-none focus:border-secondary transition-colors"
                    />
                </div>
            </div>

            {/* Core Sleep — duration auto-computed from times, still editable */}
            <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('sleep.logger.duration')}</label>
                <input
                    type="number" step="0.5" value={hours} onChange={e => setHours(e.target.value)}
                    className="w-full mt-1.5 bg-surface-container-highest border border-transparent rounded-2xl px-4 py-3 font-black text-on-surface focus:outline-none focus:border-secondary transition-colors"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Quality */}
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('sleep.logger.quality')}</label>
                    <select value={quality} onChange={e => setQuality(e.target.value)} className="w-full mt-1.5 bg-surface-container-highest border border-transparent rounded-2xl px-3 py-3 text-sm font-bold text-on-surface focus:outline-none focus:border-secondary appearance-none transition-colors">
                        <option value="excellent">{t('sleep.logger.qualityExcellent')}</option>
                        <option value="good">{t('sleep.logger.qualityGood')}</option>
                        <option value="fair">{t('sleep.logger.qualityFair')}</option>
                        <option value="poor">{t('sleep.logger.qualityPoor')}</option>
                    </select>
                </div>
                {/* Mood */}
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('sleep.logger.wakingMood')}</label>
                    <select value={mood} onChange={e => setMood(e.target.value)} className="w-full mt-1.5 bg-surface-container-highest border border-transparent rounded-2xl px-3 py-3 text-sm font-bold text-on-surface focus:outline-none focus:border-secondary appearance-none transition-colors">
                        <option value="great">{t('sleep.logger.moodGreat')}</option>
                        <option value="good">{t('sleep.logger.qualityGood')}</option>
                        <option value="okay">{t('sleep.logger.moodOkay')}</option>
                        <option value="groggy">{t('sleep.logger.moodGroggy')}</option>
                    </select>
                </div>
            </div>

            {/* Energy & Stress */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('sleep.logger.energy')}</label>
                    <select value={energy} onChange={e => setEnergy(e.target.value)} className="w-full mt-1.5 bg-surface-container-highest border border-transparent rounded-2xl px-3 py-3 text-sm font-bold text-on-surface focus:outline-none focus:border-secondary appearance-none transition-colors">
                        <option value="high">{t('sleep.logger.energyHigh')}</option>
                        <option value="medium">{t('sleep.logger.energyMedium')}</option>
                        <option value="low">{t('sleep.logger.energyLow')}</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('sleep.logger.stress')}</label>
                    <select value={stress} onChange={e => setStress(e.target.value)} className="w-full mt-1.5 bg-surface-container-highest border border-transparent rounded-2xl px-3 py-3 text-sm font-bold text-on-surface focus:outline-none focus:border-secondary appearance-none transition-colors">
                        <option value="low">{t('sleep.logger.energyLow')}</option>
                        <option value="moderate">{t('sleep.logger.stressModerate')}</option>
                        <option value="high">{t('sleep.logger.energyHigh')}</option>
                    </select>
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('sleep.logger.notes')}</label>
                <textarea 
                    rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                    className="w-full mt-1.5 bg-surface-container-highest border border-transparent rounded-2xl px-4 py-3 text-sm font-medium text-on-surface focus:outline-none focus:border-secondary transition-colors"
                    placeholder={t('sleep.logger.notesPlaceholder')}
                />
            </div>
            
            {/* Dreams */}
            <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('sleep.logger.dreams')}</label>
                <input 
                    type="text" value={dreams} onChange={e => setDreams(e.target.value)}
                    className="w-full mt-1.5 bg-surface-container-highest border border-transparent rounded-2xl px-4 py-3 text-sm font-medium text-on-surface focus:outline-none focus:border-secondary transition-colors"
                    placeholder={t('sleep.logger.dreamsPlaceholder')}
                />
            </div>

            {/* Tags */}
            <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('sleep.logger.tags')}</label>
                <input 
                    type="text" value={tags} onChange={e => setTags(e.target.value)}
                    className="w-full mt-1.5 bg-surface-container-highest border border-transparent rounded-2xl px-4 py-3 text-sm font-medium text-on-surface focus:outline-none focus:border-secondary transition-colors"
                    placeholder={t('sleep.logger.tagsPlaceholder')}
                />
            </div>

            <button 
                onClick={handleSave}
                className="w-full bg-secondary hover:bg-secondary-fixed text-on-secondary rounded-2xl p-4 flex items-center justify-center gap-2 font-black transition-all btn-press mt-4"
            >
                <Plus size={18} /> Save Sleep Entry
            </button>
        </div>
    );
}
