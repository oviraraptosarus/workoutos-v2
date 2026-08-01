'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Star, Activity, Coffee, Smile, Target } from 'lucide-react';
import { useDate } from '@/contexts/DateContext';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export default function EndOfDayReflection() {
    const { selectedDate } = useDate();
    const [reflection, setReflection] = useState({
        mood: 'good',
        energy: 'medium',
        stress: 'low',
        productivity: 3,
        waterIntake: '',
        screenTime: '',
        journal: '',
        highlights: '',
        gratitude: '',
        rating: 5
    });
    const [isSaving, setIsSaving] = useState(false);
    const [savedNotice, setSavedNotice] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (!selectedDate) return;
        const saved = localStorage.getItem(`workout_os_reflection_${selectedDate}`);
        if (saved) {
            setReflection(JSON.parse(saved));
        } else {
            // reset
            setReflection({
                mood: 'good',
                energy: 'medium',
                stress: 'low',
                productivity: 3,
                waterIntake: '',
                screenTime: '',
                journal: '',
                highlights: '',
                gratitude: '',
                rating: 5
            });
        }
    }, [selectedDate]);

    const handleSave = async () => {
        if (!selectedDate) return;
        setIsSaving(true);
        
        // 1. Save to localStorage
        localStorage.setItem(`workout_os_reflection_${selectedDate}`, JSON.stringify(reflection));
        window.dispatchEvent(new Event('storage'));
        
        // 2. Save to Supabase (Profiles target_config)
        if (user) {
            try {
                // We'll sync this reflection to the daily_logs table in Supabase by updating a metadata column if possible, 
                // or just insert an empty daily_log if it doesn't exist, and update energy/mood.
                await supabase.from('daily_logs').upsert(
                    {
                        user_id: user.id,
                        date: selectedDate,
                        mood_rating: reflection.rating, // Using overall rating as proxy for mood_rating for now
                        energy_rating: reflection.energy === 'high' ? 8 : reflection.energy === 'medium' ? 5 : 2
                    },
                    { onConflict: 'user_id,date' }
                );

                // For the full reflection data, we'll also store it in profiles target_config temporarily since we know it's jsonb
                const { data: profile } = await supabase.from('profiles').select('target_config').eq('id', user.id).single();
                const currentConfig = profile?.target_config || {};
                const updatedConfig = {
                    ...currentConfig,
                    reflections: {
                        ...(currentConfig.reflections || {}),
                        [selectedDate]: reflection
                    }
                };
                await supabase.from('profiles').update({ target_config: updatedConfig }).eq('id', user.id);
            } catch (err) {
                console.error("Error saving reflection to backend:", err);
            }
        }
        
        setIsSaving(false);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);
    };

    const updateField = (field: string, value: any) => {
        setReflection(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="bg-surface-container-low border border-surface-variant p-6 rounded-[2rem] shadow-sm space-y-6 transition-colors relative">
            
            {savedNotice && (
                <div className="absolute top-4 right-1/2 translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold animate-in fade-in slide-in-from-top-2 shadow-lg z-10 flex items-center gap-2">
                    <Target size={14} /> Reflection Saved!
                </div>
            )}

            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                    <BookOpen size={18} className="text-secondary" /> End of Day Reflection
                </h2>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-secondary hover:bg-secondary-fixed text-on-secondary px-4 py-2 rounded-full text-xs font-bold transition-colors btn-press shadow-sm"
                >
                    {isSaving ? 'Saving...' : 'Save Reflection'}
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Core Metrics */}
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Overall Mood</label>
                    <select value={reflection.mood} onChange={e => updateField('mood', e.target.value)} className="w-full bg-surface-container-highest border border-transparent focus:border-secondary rounded-xl px-3 py-2 text-sm font-bold text-on-surface appearance-none transition-colors">
                        <option value="great">Great</option>
                        <option value="good">Good</option>
                        <option value="okay">Okay</option>
                        <option value="bad">Bad</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Energy</label>
                    <select value={reflection.energy} onChange={e => updateField('energy', e.target.value)} className="w-full bg-surface-container-highest border border-transparent focus:border-secondary rounded-xl px-3 py-2 text-sm font-bold text-on-surface appearance-none transition-colors">
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Stress</label>
                    <select value={reflection.stress} onChange={e => updateField('stress', e.target.value)} className="w-full bg-surface-container-highest border border-transparent focus:border-secondary rounded-xl px-3 py-2 text-sm font-bold text-on-surface appearance-none transition-colors">
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Productivity</label>
                    <select value={reflection.productivity} onChange={e => updateField('productivity', parseInt(e.target.value))} className="w-full bg-surface-container-highest border border-transparent focus:border-secondary rounded-xl px-3 py-2 text-sm font-bold text-on-surface appearance-none transition-colors">
                        {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}/5</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input Fields */}
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Water Intake</label>
                    <input type="text" placeholder="e.g. 3L" value={reflection.waterIntake} onChange={e => updateField('waterIntake', e.target.value)} className="w-full bg-surface-container-highest border border-transparent focus:border-secondary rounded-xl px-3 py-2 text-sm font-medium text-on-surface transition-colors" />
                </div>
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Screen Time</label>
                    <input type="text" placeholder="e.g. 4h 30m" value={reflection.screenTime} onChange={e => updateField('screenTime', e.target.value)} className="w-full bg-surface-container-highest border border-transparent focus:border-secondary rounded-xl px-3 py-2 text-sm font-medium text-on-surface transition-colors" />
                </div>
            </div>

            {/* Text Areas */}
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Journal / Thoughts</label>
                    <textarea rows={2} placeholder="How was your day?" value={reflection.journal} onChange={e => updateField('journal', e.target.value)} className="w-full bg-surface-container-highest border border-transparent focus:border-secondary rounded-xl px-4 py-3 text-sm font-medium text-on-surface resize-none transition-colors" />
                </div>
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Highlights (Wins)</label>
                    <textarea rows={2} placeholder="What went well?" value={reflection.highlights} onChange={e => updateField('highlights', e.target.value)} className="w-full bg-surface-container-highest border border-transparent focus:border-secondary rounded-xl px-4 py-3 text-sm font-medium text-on-surface resize-none transition-colors" />
                </div>
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Gratitude</label>
                    <textarea rows={2} placeholder="What are you grateful for today?" value={reflection.gratitude} onChange={e => updateField('gratitude', e.target.value)} className="w-full bg-surface-container-highest border border-transparent focus:border-secondary rounded-xl px-4 py-3 text-sm font-medium text-on-surface resize-none transition-colors" />
                </div>
            </div>

            <div className="pt-3 border-t border-surface-variant flex items-center justify-between">
                <label className="text-sm font-bold text-on-surface uppercase tracking-wider">Overall Day Rating</label>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => updateField('rating', star)}
                            className={`p-1 transition-all ${reflection.rating >= star ? 'text-yellow-400 scale-110 drop-shadow-sm' : 'text-surface-container-highest hover:text-yellow-200'}`}
                        >
                            <Star size={24} fill={reflection.rating >= star ? 'currentColor' : 'none'} />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
