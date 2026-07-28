'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Star, Activity, Coffee, Smile, Target } from 'lucide-react';
import { useDate } from '@/contexts/DateContext';

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

    const handleSave = () => {
        if (!selectedDate) return;
        localStorage.setItem(`workout_os_reflection_${selectedDate}`, JSON.stringify(reflection));
        window.dispatchEvent(new Event('storage'));
        // Optional: show toast or success message here
    };

    const updateField = (field: string, value: any) => {
        setReflection(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                    <BookOpen size={18} className="text-purple-500" /> End of Day Reflection
                </h2>
                <button 
                    onClick={handleSave}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-full text-xs font-bold transition-colors btn-press"
                >
                    Save Reflection
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Core Metrics */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Overall Mood</label>
                    <select value={reflection.mood} onChange={e => updateField('mood', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold">
                        <option value="great">Great</option>
                        <option value="good">Good</option>
                        <option value="okay">Okay</option>
                        <option value="bad">Bad</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Energy</label>
                    <select value={reflection.energy} onChange={e => updateField('energy', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold">
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Stress</label>
                    <select value={reflection.stress} onChange={e => updateField('stress', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold">
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Productivity</label>
                    <select value={reflection.productivity} onChange={e => updateField('productivity', parseInt(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold">
                        {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}/5</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input Fields */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Water Intake</label>
                    <input type="text" placeholder="e.g. 3L" value={reflection.waterIntake} onChange={e => updateField('waterIntake', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Screen Time</label>
                    <input type="text" placeholder="e.g. 4h 30m" value={reflection.screenTime} onChange={e => updateField('screenTime', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium" />
                </div>
            </div>

            {/* Text Areas */}
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Journal / Thoughts</label>
                    <textarea rows={2} placeholder="How was your day?" value={reflection.journal} onChange={e => updateField('journal', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium resize-none" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Highlights (Wins)</label>
                    <textarea rows={2} placeholder="What went well?" value={reflection.highlights} onChange={e => updateField('highlights', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium resize-none" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Gratitude</label>
                    <textarea rows={2} placeholder="What are you grateful for today?" value={reflection.gratitude} onChange={e => updateField('gratitude', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium resize-none" />
                </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <label className="text-sm font-bold text-gray-700 uppercase">Overall Day Rating</label>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => updateField('rating', star)}
                            className={`p-1 transition-all ${reflection.rating >= star ? 'text-yellow-400 scale-110' : 'text-gray-200 hover:text-yellow-200'}`}
                        >
                            <Star size={20} fill={reflection.rating >= star ? 'currentColor' : 'none'} />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
