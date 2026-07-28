'use client';

import React, { useState } from 'react';
import { Plus, Moon, Activity, Heart, Frown, Smile, Zap } from 'lucide-react';

interface EnhancedSleepLoggerProps {
    onLogSaved: (data: any) => void;
}

export default function EnhancedSleepLogger({ onLogSaved }: EnhancedSleepLoggerProps) {
    const [hours, setHours] = useState('8');
    const [mood, setMood] = useState('good');
    const [energy, setEnergy] = useState('medium');
    const [stress, setStress] = useState('low');
    const [quality, setQuality] = useState('good');
    const [notes, setNotes] = useState('');
    const [dreams, setDreams] = useState('');
    const [tags, setTags] = useState('');

    const handleSave = () => {
        const numHours = parseFloat(hours);
        if (!numHours) return;

        const logData = {
            id: Date.now(),
            amount: numHours,
            type: 'Night Sleep',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            details: {
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
        // Reset form slightly
        setHours('');
        setNotes('');
        setDreams('');
        setTags('');
    };

    return (
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2 mb-2">
                <Moon size={18} className="text-indigo-500" /> Advanced Sleep Log
            </h2>

            {/* Core Sleep */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Sleep Duration (hrs)</label>
                <input 
                    type="number" step="0.5" value={hours} onChange={e => setHours(e.target.value)}
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-black text-gray-900 focus:outline-none focus:border-indigo-400"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Quality */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Quality</label>
                    <select value={quality} onChange={e => setQuality(e.target.value)} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none">
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                    </select>
                </div>
                {/* Mood */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Waking Mood</label>
                    <select value={mood} onChange={e => setMood(e.target.value)} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none">
                        <option value="great">Great</option>
                        <option value="good">Good</option>
                        <option value="okay">Okay</option>
                        <option value="groggy">Groggy</option>
                    </select>
                </div>
            </div>

            {/* Energy & Stress */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Energy</label>
                    <select value={energy} onChange={e => setEnergy(e.target.value)} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none">
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Stress</label>
                    <select value={stress} onChange={e => setStress(e.target.value)} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none">
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                    </select>
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Notes & Thoughts</label>
                <textarea 
                    rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-400"
                    placeholder="How did you sleep?"
                />
            </div>
            
            {/* Dreams */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Dreams (Optional)</label>
                <input 
                    type="text" value={dreams} onChange={e => setDreams(e.target.value)}
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none"
                    placeholder="Any vivid dreams?"
                />
            </div>

            {/* Tags */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Tags (comma separated)</label>
                <input 
                    type="text" value={tags} onChange={e => setTags(e.target.value)}
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none"
                    placeholder="e.g. late meal, hot room"
                />
            </div>

            <button 
                onClick={handleSave}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-3 flex items-center justify-center gap-2 font-black transition-all btn-press shadow-md"
            >
                <Plus size={18} /> Save Sleep Entry
            </button>
        </div>
    );
}
