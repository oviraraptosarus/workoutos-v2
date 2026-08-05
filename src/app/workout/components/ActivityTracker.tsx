'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useEffect } from 'react';
import { Footprints, Flame, Plus, Calculator } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { supabase } from '@/lib/supabase/client';

export default function ActivityTracker() {
    const { t } = useLanguage();
    const { userProfile } = useAuth();
    const { selectedDate } = useDate();
    const [steps, setSteps] = useState(0);
    const [inputSteps, setInputSteps] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [customStrideCm, setCustomStrideCm] = useState<number | null>(null);
    
    useEffect(() => {
        const stored = localStorage.getItem('workout_os_custom_stride_cm');
        if (stored && !isNaN(Number(stored))) {
            setCustomStrideCm(Number(stored));
        }
    }, []);

    useEffect(() => {
        const fetchSteps = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            const dateKey = selectedDate || new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('daily_logs')
                .select('steps')
                .eq('user_id', user.id)
                .eq('date', dateKey)
                .maybeSingle();
                
            if (data && data.steps) {
                setSteps(data.steps);
            } else {
                setSteps(0);
            }
        };
        fetchSteps();
    }, [selectedDate]);

    // Calculate stride and calories based on height and weight
    const heightCm = userProfile?.heightCm || 170;
    const weightKg = userProfile?.currentWeight || 75;
    // Stride length estimation: custom or height * 0.414 for average
    const strideLengthMeters = customStrideCm ? customStrideCm / 100 : (heightCm * 0.414) / 100;
    const distanceKm = (steps * strideLengthMeters) / 1000;
    // Calories burned walking approx: Distance (km) * Weight (kg)
    const caloriesBurned = Math.round(distanceKm * weightKg);

    const handleAddSteps = async () => {
        const stepsToAdd = parseInt(inputSteps);
        if (isNaN(stepsToAdd) || stepsToAdd <= 0) return;
        
        setIsSaving(true);
        const newTotal = steps + stepsToAdd;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const dateKey = selectedDate || new Date().toISOString().split('T')[0];
            
            // Add to steps and also calculate how many calories to add to activity_burned
            const addedDistance = (stepsToAdd * strideLengthMeters) / 1000;
            const addedCals = Math.round(addedDistance * weightKg);

            // Fetch current activity_burned
            const { data: currentLog } = await supabase
                .from('daily_logs')
                .select('activity_burned')
                .eq('user_id', user.id)
                .eq('date', dateKey)
                .maybeSingle();
            
            const currentBurned = currentLog?.activity_burned || 0;

            await supabase
                .from('daily_logs')
                .upsert({
                    user_id: user.id,
                    date: dateKey,
                    steps: newTotal,
                    activity_burned: currentBurned + addedCals
                }, { onConflict: 'user_id,date' });
                
            setSteps(newTotal);
            setInputSteps('');
            window.dispatchEvent(new Event('workout_os_activity_updated'));
            window.dispatchEvent(new Event('storage')); // to sync any hooks listening to storage
        }
        setIsSaving(false);
    };

    const handleEditStride = () => {
        const current = customStrideCm || Math.round(heightCm * 0.414);
        const res = prompt('Enter custom stride length in cm (leave blank to auto-calculate from height):', current.toString());
        if (res === null) return; // user cancelled
        
        if (res.trim() === '') {
            localStorage.removeItem('workout_os_custom_stride_cm');
            setCustomStrideCm(null);
            return;
        }
        
        const val = Number(res);
        if (!isNaN(val) && val > 0 && val < 300) {
            localStorage.setItem('workout_os_custom_stride_cm', val.toString());
            setCustomStrideCm(val);
        } else {
            alert('Please enter a valid stride length in cm.');
        }
    };

    return (
        <div className="bg-surface-container-low backdrop-blur-xl border border-surface-variant rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                        <Footprints size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-on-surface">{t('workout.dailySteps')}</h3>
                        <p 
                            onClick={handleEditStride}
                            className="text-xs font-bold text-on-surface-variant flex items-center gap-1 cursor-pointer hover:text-on-surface transition-colors hover:underline"
                            title="Click to edit stride length"
                        >
                            <Calculator size={12} /> Stride: {(strideLengthMeters * 100).toFixed(0)}cm
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-surface-container rounded-2xl p-4 border border-surface-variant">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Total Steps</span>
                    <span className="text-2xl font-black text-on-surface">{steps.toLocaleString()}</span>
                </div>
                <div className="bg-surface-container rounded-2xl p-4 border border-surface-variant">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Burned</span>
                    <span className="text-2xl font-black text-tertiary flex items-center gap-1">
                        {caloriesBurned} <Flame size={18} />
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 w-full">
                <input
                    type="number"
                    value={inputSteps}
                    onChange={(e) => setInputSteps(e.target.value)}
                    placeholder={t('workout.addSteps')}
                    className="flex-1 min-w-0 bg-surface-container-highest border border-surface-variant rounded-xl px-4 py-3 text-sm font-bold text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-secondary transition-colors"
                />
                <button
                    onClick={handleAddSteps}
                    disabled={isSaving || !inputSteps}
                    className="bg-secondary hover:bg-secondary-fixed disabled:opacity-50 text-on-secondary font-bold px-5 py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> Add
                </button>
            </div>
        </div>
    );
}
