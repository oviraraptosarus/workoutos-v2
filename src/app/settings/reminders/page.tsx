'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Settings2, Droplets, Moon, Dumbbell, Utensils, Zap, Plus, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getReminderPreferences, updateReminderPreference, ReminderPreference, ReminderConfig } from '@/services/reminderEngine';
import { supabase } from '@/lib/supabase/client';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const DEFAULT_REMINDERS = [
    { type: 'water', label: 'Smart Water System', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { type: 'breakfast', label: 'Breakfast', icon: Utensils, color: 'text-green-400', bg: 'bg-green-400/10' },
    { type: 'lunch', label: 'Lunch', icon: Utensils, color: 'text-green-500', bg: 'bg-green-500/10' },
    { type: 'dinner', label: 'Dinner', icon: Utensils, color: 'text-green-600', bg: 'bg-green-600/10' },
    { type: 'snack', label: 'Snacks', icon: Utensils, color: 'text-green-300', bg: 'bg-green-300/10' },
    { type: 'workout', label: 'Workout', icon: Dumbbell, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { type: 'sleep', label: 'Sleep & Wind Down', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { type: 'progress_photo', label: 'Progress Photo', icon: Zap, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { type: 'reflection', label: 'Evening Reflection', icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { type: 'budget', label: 'Budget Log', icon: Settings2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { type: 'mood', label: 'Mood Check-in', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { type: 'meditation', label: 'Meditation', icon: Moon, color: 'text-teal-500', bg: 'bg-teal-500/10' },
    { type: 'walk', label: 'Daily Walk', icon: Zap, color: 'text-lime-500', bg: 'bg-lime-500/10' },
    { type: 'stretch', label: 'Stretch / Mobility', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { type: 'weight', label: 'Weigh-in', icon: Settings2, color: 'text-slate-500', bg: 'bg-slate-500/10' },
    { type: 'journal', label: 'Journal', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { type: 'medication', label: 'Medication', icon: Zap, color: 'text-red-400', bg: 'bg-red-400/10' },
    { type: 'custom', label: 'Custom Reminder', icon: Settings2, color: 'text-gray-500', bg: 'bg-gray-500/10' }
];

export default function RemindersSettingsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<ReminderPreference[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const { isSupported, permission, subscribeToPush, unsubscribeFromPush, isLoading: pushLoading } = usePushNotifications();

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const data = await getReminderPreferences();
            setPreferences(data);
            setLoading(false);
        };
        load();
    }, [user]);

    const handleToggle = async (type: string, currentEnabled: boolean) => {
        const pref = preferences.find(p => p.type === type);
        const config = pref ? pref.config : { smart_detection: true, notification_style: 'banner' as const };
        
        // Optimistic update
        const newValue = !currentEnabled;
        if (pref) {
            setPreferences(prev => prev.map(p => p.type === type ? { ...p, is_enabled: newValue } : p));
        } else {
            setPreferences(prev => [...prev, { id: 'temp', user_id: user!.id, type, is_enabled: newValue, config }]);
        }

        await updateReminderPreference(type, newValue, config);
    };

    const renderConfigDrawer = () => {
        if (!selectedType) return null;
        const pref = preferences.find(p => p.type === selectedType) || { config: { smart_detection: true, silent_mode: false, snooze_duration: 15 } };
        const config = pref.config as ReminderConfig;

        return (
            <div className="fixed inset-0 z-50 flex flex-col justify-end">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedType(null)} />
                <div className="relative bg-background rounded-t-3xl border-t border-surface-variant/30 shadow-2xl p-6 pb-safe-bottom max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                    <div className="w-12 h-1.5 bg-surface-variant rounded-full mx-auto mb-6 opacity-50" />
                    <h3 className="text-xl font-bold text-on-surface mb-6 capitalize">{selectedType} Reminder Settings</h3>
                    
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="font-bold text-sm text-on-surface">Smart Detection</label>
                                <p className="text-xs text-on-surface-variant">Don't fire if I already logged it today</p>
                            </div>
                            <button
                                onClick={() => updateConfig(selectedType, { ...config, smart_detection: !config.smart_detection })}
                                className={`relative w-12 h-7 rounded-full transition-colors ${config.smart_detection ? 'bg-[#0a84ff]' : 'bg-surface-container-high'}`}
                            >
                                <span className={`absolute top-1 w-5 h-5 bg-card-white rounded-full transition-transform shadow ${config.smart_detection ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="font-bold text-sm text-on-surface">Silent Mode</label>
                                <p className="text-xs text-on-surface-variant">Deliver quietly to Command Center only</p>
                            </div>
                            <button
                                onClick={() => updateConfig(selectedType, { ...config, silent_mode: !config.silent_mode })}
                                className={`relative w-12 h-7 rounded-full transition-colors ${config.silent_mode ? 'bg-[#0a84ff]' : 'bg-surface-container-high'}`}
                            >
                                <span className={`absolute top-1 w-5 h-5 bg-card-white rounded-full transition-transform shadow ${config.silent_mode ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="font-bold text-sm text-on-surface">Sound Alert</label>
                                <p className="text-xs text-on-surface-variant">Play notification sound</p>
                            </div>
                            <button
                                onClick={() => updateConfig(selectedType, { ...config, sound: !config.sound })}
                                className={`relative w-12 h-7 rounded-full transition-colors ${config.sound ? 'bg-[#0a84ff]' : 'bg-surface-container-high'}`}
                            >
                                <span className={`absolute top-1 w-5 h-5 bg-card-white rounded-full transition-transform shadow ${config.sound ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="font-bold text-sm text-on-surface">Time</label>
                                <input 
                                    type="time" 
                                    value={config.time || '09:00'} 
                                    onChange={(e) => updateConfig(selectedType, { ...config, time: e.target.value })}
                                    className="w-full bg-surface-container-low border border-surface-variant/30 rounded-xl p-3 text-sm text-on-surface"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="font-bold text-sm text-on-surface">Priority</label>
                                <select 
                                    value={config.priority || 'normal'}
                                    onChange={(e) => updateConfig(selectedType, { ...config, priority: e.target.value as any })}
                                    className="w-full bg-surface-container-low border border-surface-variant/30 rounded-xl p-3 text-sm text-on-surface"
                                >
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                                <label className="font-bold text-sm text-on-surface">Repeat</label>
                                <button
                                    onClick={() => updateConfig(selectedType, { ...config, repeat: !config.repeat })}
                                    className={`relative w-12 h-7 rounded-full transition-colors ${config.repeat ? 'bg-[#0a84ff]' : 'bg-surface-container-high'}`}
                                >
                                    <span className={`absolute top-1 w-5 h-5 bg-card-white rounded-full transition-transform shadow ${config.repeat ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                            {config.repeat && (
                                <div className="flex justify-between gap-1 mt-2">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                                        const isSelected = (config.days || []).includes(idx);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    const days = config.days || [];
                                                    const newDays = isSelected ? days.filter(d => d !== idx) : [...days, idx];
                                                    updateConfig(selectedType, { ...config, days: newDays });
                                                }}
                                                className={`w-10 h-10 rounded-full font-bold text-xs transition-colors ${isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="font-bold text-sm text-on-surface">Snooze Duration (minutes)</label>
                            <select 
                                value={config.snooze_duration || 15}
                                onChange={(e) => updateConfig(selectedType, { ...config, snooze_duration: parseInt(e.target.value) })}
                                className="w-full bg-surface-container-low border border-surface-variant/30 rounded-xl p-3 text-sm text-on-surface"
                            >
                                <option value={5}>5 minutes</option>
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={60}>1 hour</option>
                            </select>
                        </div>
                        
                        {selectedType === 'water' && (
                            <div className="space-y-4 pt-4 border-t border-surface-variant/30">
                                <h4 className="font-bold text-sm text-on-surface">Smart Water Schedule</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-on-surface-variant font-bold mb-1 block">Wake Time</label>
                                        <input type="time" value={(config as any).wake_time || '07:00'} onChange={(e) => updateConfig(selectedType, { ...config, wake_time: e.target.value } as any)} className="w-full bg-surface-container-low border border-surface-variant/30 rounded-xl p-2.5 text-sm text-on-surface" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-on-surface-variant font-bold mb-1 block">Sleep Time</label>
                                        <input type="time" value={(config as any).sleep_time || '22:00'} onChange={(e) => updateConfig(selectedType, { ...config, sleep_time: e.target.value } as any)} className="w-full bg-surface-container-low border border-surface-variant/30 rounded-xl p-2.5 text-sm text-on-surface" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-on-surface-variant font-bold mb-1 block">Daily Goal (ml)</label>
                                    <input type="number" step="100" value={(config as any).daily_goal || 3000} onChange={(e) => updateConfig(selectedType, { ...config, daily_goal: parseInt(e.target.value) } as any)} className="w-full bg-surface-container-low border border-surface-variant/30 rounded-xl p-2.5 text-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="text-xs text-on-surface-variant font-bold mb-1 block">Reminder Frequency</label>
                                    <select value={(config as any).frequency_mins || 60} onChange={(e) => updateConfig(selectedType, { ...config, frequency_mins: parseInt(e.target.value) } as any)} className="w-full bg-surface-container-low border border-surface-variant/30 rounded-xl p-2.5 text-sm text-on-surface">
                                        <option value={30}>Every 30 mins</option>
                                        <option value={60}>Every 1 hour</option>
                                        <option value={90}>Every 1.5 hours</option>
                                        <option value={120}>Every 2 hours</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <button onClick={() => setSelectedType(null)} className="w-full bg-primary text-on-primary font-bold rounded-xl py-3.5 mt-4 hover:bg-primary/90 transition-colors">
                            Done
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const updateConfig = async (type: string, newConfig: ReminderConfig) => {
        setPreferences(prev => prev.map(p => p.type === type ? { ...p, config: newConfig } : p));
        await updateReminderPreference(type, true, newConfig);
    };

    return (
        <div className="min-h-screen bg-background pb-20 pt-safe-top animate-in fade-in duration-300">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-surface-variant/30 px-4 py-4 flex items-center justify-between">
                <button 
                    onClick={() => router.push('/profile')} 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-on-surface">Reminders Engine</h1>
                <div className="w-10 h-10 flex items-center justify-center text-primary">
                    <Bell size={24} />
                </div>
            </div>

            <div className="p-4 sm:p-6 max-w-md mx-auto space-y-6 mt-4">
                
                {isSupported && permission !== 'granted' && (
                    <div className="bg-surface-container-low rounded-3xl p-5 border border-primary/20 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <Bell size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-on-surface">Enable Push Notifications</h2>
                                <p className="text-xs text-on-surface-variant">Get notified even when the app is closed.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                            <button
                                onClick={subscribeToPush}
                                disabled={pushLoading}
                                className="w-full bg-primary text-on-primary font-bold rounded-xl py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {pushLoading ? 'Enabling...' : 'Allow Notifications'}
                            </button>
                        </div>
                        {permission === 'denied' && (
                            <p className="text-[10px] text-error text-center mt-1">
                                You have denied permission. Please enable it in your browser settings.
                            </p>
                        )}
                    </div>
                )}

                {isSupported && permission === 'granted' && (
                    <div className="bg-surface-container-low rounded-3xl p-5 border border-primary/20 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <Bell size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-on-surface">Push Notifications Active</h2>
                                <p className="text-xs text-on-surface-variant">You are receiving notifications.</p>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                try {
                                    const { data: { session } } = await supabase.auth.getSession();
                                    if (!session) return;
                                    const res = await fetch('/api/notifications/test', {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${session.access_token}` }
                                    });
                                    if (!res.ok) alert('Failed to send test push');
                                } catch(e) {
                                    alert('Error sending test push');
                                }
                            }}
                            className="w-full bg-surface-variant text-on-surface-variant font-bold rounded-xl py-3 text-sm hover:bg-surface-variant/80 transition-colors"
                        >
                            Send Test Notification
                        </button>
                    </div>
                )}

                <div className="bg-surface-container-low rounded-3xl p-5 border border-primary/20 flex gap-4 items-start shadow-sm">
                    <Settings2 size={24} className="text-primary shrink-0 mt-0.5" />
                    <div>
                        <h2 className="text-sm font-bold text-on-surface mb-1">Smart Engine Active</h2>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                            These reminders use Smart Detection to adapt to your logs. If you already drank water or logged a workout, Ava won't bother you.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="bg-card-white border border-surface-variant/40 rounded-3xl overflow-hidden shadow-sm">
                        {DEFAULT_REMINDERS.map((item, index) => {
                            const pref = preferences.find(p => p.type === item.type);
                            const isEnabled = pref ? pref.is_enabled : false;

                            return (
                                <div key={item.type} className={`p-4 flex items-center justify-between ${index !== DEFAULT_REMINDERS.length - 1 ? 'border-b border-surface-variant/30' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                                            <item.icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-on-surface">{item.label}</h3>
                                            <button onClick={() => setSelectedType(item.type)} className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 mt-0.5">
                                                Advanced Settings <ChevronRight size={10} />
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggle(item.type, isEnabled)}
                                        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${isEnabled ? 'bg-[#0a84ff]' : 'bg-surface-container-high'}`}
                                    >
                                        <span className={`absolute top-1 w-5 h-5 bg-card-white rounded-full transition-transform shadow ${isEnabled ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {renderConfigDrawer()}
        </div>
    );
}
