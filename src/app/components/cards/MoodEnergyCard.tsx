'use client';

import React, { useState, useEffect } from 'react';
import { Smile, Zap, Coffee, Utensils } from 'lucide-react';
import { useDate } from '@/contexts/DateContext';

const MOOD_PREFIX = 'workout_os_mood_energy_';

interface MoodState {
    mood: number;
    energy: number;
    hunger: number;
    caffeine: number;
}

export default function MoodEnergyCard() {
    const { selectedDate, isToday } = useDate();
    const [caffeine, setCaffeine] = useState(2);
    const [mood, setMood] = useState(7);
    const [energy, setEnergy] = useState(5);
    const [hunger, setHunger] = useState(0);
    const [saved, setSaved] = useState(false);

    // Load from localStorage when date changes
    useEffect(() => {
        if (!selectedDate) return;
        const load = () => {
            try {
                const raw = localStorage.getItem(`${MOOD_PREFIX}${selectedDate}`);
                if (raw) {
                    const data: MoodState = JSON.parse(raw);
                    setMood(data.mood ?? 7);
                    setEnergy(data.energy ?? 5);
                    setHunger(data.hunger ?? 0);
                    setCaffeine(data.caffeine ?? 2);
                } else {
                    // Reset to defaults for new day
                    setMood(7); setEnergy(5); setHunger(0); setCaffeine(2);
                }
            } catch {
                setMood(7); setEnergy(5); setHunger(0); setCaffeine(2);
            }
        };

        load();

        window.addEventListener('storage', load);
        return () => window.removeEventListener('storage', load);
    }, [selectedDate]);

    const handleSave = () => {
        if (!selectedDate) return;
        const data: MoodState = { mood, energy, hunger, caffeine };
        localStorage.setItem(`${MOOD_PREFIX}${selectedDate}`, JSON.stringify(data));
        window.dispatchEvent(new Event('storage'));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const renderSegments = (value: number, activeColor: string, onChange: (val: number) => void) => {
        return Array.from({ length: 10 }).map((_, i) => (
            <button 
                key={i} 
                onClick={() => onChange(i + 1)}
                disabled={!isToday}
                className={`h-3 rounded-full flex-1 transition-all duration-300 hover:scale-105 active:scale-95 ${i < value ? activeColor : 'bg-[#f1f1f1] hover:bg-[#e5e5e5]'} disabled:cursor-not-allowed`}
            />
        ));
    };

    return (
        <div className="bg-white border border-gray-100 p-6 shadow-sm flex flex-col bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-900 tracking-tight">How are you feeling today?</h3>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 font-medium mb-0.5">Optional</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{mood}/10</span>
                </div>
            </div>

            <div className="space-y-4 mb-6">
                {/* Mood */}
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
                    <div className="w-20 flex items-center gap-2 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        <Smile size={14} />
                        <span className="text-[11px] font-semibold">Mood</span>
                    </div>
                    <div className="flex-1 flex gap-1">
                        {renderSegments(mood, 'bg-[#f8b47b]', setMood)}
                    </div>
                </div>

                {/* Energy */}
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
                    <div className="w-20 flex items-center gap-2 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        <Zap size={14} />
                        <span className="text-[11px] font-semibold">Energy</span>
                    </div>
                    <div className="flex-1 flex gap-1">
                        {renderSegments(energy, 'bg-[#82a88e]', setEnergy)}
                    </div>
                </div>

                {/* Hunger */}
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
                    <div className="w-20 flex items-center gap-2 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        <Utensils size={14} />
                        <span className="text-[11px] font-semibold">Hunger</span>
                    </div>
                    <div className="flex-1 flex gap-1">
                        {renderSegments(hunger, 'bg-[#d1d5db]', setHunger)}
                    </div>
                    <div className="w-8 text-right text-[11px] font-medium text-gray-400 dark:text-gray-500">
                        {hunger}/10
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        <Coffee size={14} />
                        <span className="text-[11px] font-semibold">Caffeine</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setCaffeine(Math.max(0, caffeine - 1))}
                            disabled={!isToday}
                            className="w-6 h-6 rounded-full bg-[#f4f3f0] hover:bg-[#e6e2da] flex items-center justify-center text-gray-600 transition-colors disabled:opacity-50"
                        >
                            -
                        </button>
                        <span className="text-[13px] font-bold text-gray-900 w-3 text-center">{caffeine}</span>
                        <button 
                            onClick={() => setCaffeine(caffeine + 1)}
                            disabled={!isToday}
                            className="w-6 h-6 rounded-full bg-[#f4f3f0] hover:bg-[#e6e2da] flex items-center justify-center text-gray-600 transition-colors disabled:opacity-50"
                        >
                            +
                        </button>
                        <span className="text-[11px] text-gray-500 font-medium">cups</span>
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    disabled={!isToday}
                    className={`text-[11px] font-bold px-5 py-1.5 rounded-full transition-colors shadow-sm btn-press disabled:opacity-50 ${
                        saved ? 'bg-emerald-500 text-white' : 'bg-[#1f4e38] hover:bg-[#163a2a] text-white'
                    }`}
                >
                    {saved ? '✓ Saved' : 'Save'}
                </button>
            </div>
        </div>
    );
}
