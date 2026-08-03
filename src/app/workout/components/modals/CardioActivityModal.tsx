'use client';

import React, { useState } from 'react';
import { Activity, Flame, X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface CardioActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CardioActivityModal({ isOpen, onClose }: CardioActivityModalProps) {
    const { userProfile } = useAuth();
    
    const [activityType, setActivityType] = useState('Stationary Bike');
    const [durationMinutes, setDurationMinutes] = useState('');
    const [intensity, setIntensity] = useState('Moderate');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    // MET (Metabolic Equivalent of Task) estimates
    const getMET = (activity: string, level: string) => {
        const mets: any = {
            'Stationary Bike': { 'Light': 3.0, 'Moderate': 5.5, 'Vigorous': 7.0 },
            'Running': { 'Light': 6.0, 'Moderate': 8.3, 'Vigorous': 11.0 },
            'Walking': { 'Light': 2.8, 'Moderate': 3.5, 'Vigorous': 5.0 },
            'Swimming': { 'Light': 5.0, 'Moderate': 7.0, 'Vigorous': 9.8 },
            'Rowing': { 'Light': 3.5, 'Moderate': 7.0, 'Vigorous': 8.5 },
            'Elliptical': { 'Light': 4.5, 'Moderate': 5.0, 'Vigorous': 7.0 },
            'Other': { 'Light': 3.0, 'Moderate': 5.0, 'Vigorous': 7.0 },
        };
        return mets[activity]?.[level] || 5.0;
    };

    const weightKg = userProfile?.currentWeight || 75;
    const durationHrs = (parseFloat(durationMinutes) || 0) / 60;
    const met = getMET(activityType, intensity);
    const estimatedCals = Math.round(met * weightKg * durationHrs);

    const handleSave = async () => {
        if (!durationMinutes || isNaN(parseFloat(durationMinutes))) return;
        setIsSaving(true);
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const dateKey = new Date().toISOString().split('T')[0];
                
                // Add to workout logs
                await supabase.from('workout_logs').insert({
                    user_id: user.id,
                    date: dateKey,
                    session_type: activityType,
                    exercises: [
                        { type: 'metadata', duration: `${durationMinutes} min`, volume: `${estimatedCals} kcal burned`, intensity }
                    ],
                    completed: true,
                    is_outdoor: activityType === 'Running' || activityType === 'Walking'
                });

                // Update daily_logs activity_burned
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
                        activity_burned: currentBurned + estimatedCals
                    }, { onConflict: 'user_id,date' });

                window.dispatchEvent(new Event('workout_os_recent_workouts_updated'));
                window.dispatchEvent(new Event('workout_os_activity_updated'));
            }
            onClose();
        } catch (e) {
            console.error('Error saving activity:', e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-surface-container-low border border-surface-variant rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-surface-variant">
                    <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                        <Activity size={20} className="text-tertiary" /> Log Activity
                    </h2>
                    <button onClick={onClose} className="p-2 bg-surface-container rounded-full text-on-surface-variant hover:text-on-surface transition-colors">
                        <X size={16} />
                    </button>
                </div>
                
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Activity Type</label>
                        <select 
                            value={activityType}
                            onChange={(e) => setActivityType(e.target.value)}
                            className="w-full bg-surface-container border border-surface-variant rounded-xl px-4 py-3 text-sm font-bold text-on-surface focus:outline-none focus:border-tertiary"
                        >
                            <option value="Stationary Bike">Stationary Bike</option>
                            <option value="Running">Running</option>
                            <option value="Walking">Walking</option>
                            <option value="Swimming">Swimming</option>
                            <option value="Rowing">Rowing</option>
                            <option value="Elliptical">Elliptical</option>
                            <option value="Other">Other Cardio</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Duration (min)</label>
                            <input 
                                type="number" 
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(e.target.value)}
                                placeholder="e.g. 30"
                                className="w-full bg-surface-container border border-surface-variant rounded-xl px-4 py-3 text-sm font-bold text-on-surface focus:outline-none focus:border-tertiary placeholder:text-on-surface-variant"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Intensity</label>
                            <select 
                                value={intensity}
                                onChange={(e) => setIntensity(e.target.value)}
                                className="w-full bg-surface-container border border-surface-variant rounded-xl px-4 py-3 text-sm font-bold text-on-surface focus:outline-none focus:border-tertiary"
                            >
                                <option value="Light">Light</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Vigorous">Vigorous</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-tertiary-container/30 border border-tertiary-container rounded-2xl p-4 flex items-center justify-between mt-2">
                        <div>
                            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">Est. Burned</span>
                            <span className="text-xl font-black text-tertiary flex items-center gap-1">
                                {estimatedCals > 0 ? estimatedCals : '--'} <Flame size={16} />
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">MET</span>
                            <span className="text-sm font-black text-on-surface">{met.toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-5 pt-0">
                    <button 
                        onClick={handleSave}
                        disabled={!durationMinutes || isSaving}
                        className="w-full bg-tertiary hover:bg-tertiary-fixed disabled:opacity-50 text-on-tertiary font-bold py-3.5 rounded-xl transition-colors text-sm shadow-sm flex items-center justify-center gap-2"
                    >
                        {isSaving ? 'Saving...' : <><Check size={16} /> Save Activity</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
