'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { X, Bell, Zap, Calendar, HeartPulse, Dumbbell, Utensils, DollarSign, Brain, Activity, Check, Clock, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CommandCenterOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CommandCenterOverlay({ isOpen, onClose }: CommandCenterOverlayProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchItems = async () => {
        if (!user) return;
        setLoading(true);
        const { data } = await supabase
            .from('command_center_items')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['active', 'snoozed']) // we can filter out snoozed that aren't due yet if we want
            .order('priority', { ascending: false }) // 'high' > 'medium' is not strictly alphabetical, but for now we order by created_at 
            .order('created_at', { ascending: false });
        
        if (data) {
            // Sort manually for strict priority if needed, but for simplicity just set
            const sorted = data.sort((a, b) => {
                const priorityWeight = { high: 3, medium: 2, low: 1 };
                const pwA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
                const pwB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
                return pwB - pwA;
            });
            setItems(sorted);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            fetchItems();
        }
    }, [isOpen, user]);

    const handleAction = async (id: string, action: 'completed' | 'dismissed' | 'snoozed') => {
        // Optimistic UI update
        setItems(prev => prev.filter(item => item.id !== id));
        await supabase.from('command_center_items').update({ status: action }).eq('id', id);
    };

    const getIcon = (iconName: string, category: string) => {
        switch (iconName) {
            case 'moon': return <Moon size={20} className="text-indigo-400" />;
            case 'droplets': return <Droplets size={20} className="text-blue-400" />;
            case 'rocket': return <Zap size={20} className="text-amber-400" />;
        }
        
        switch (category) {
            case 'Immediate Action': return <Zap size={20} className="text-amber-500" />;
            case 'Reminder': return <Bell size={20} className="text-blue-500" />;
            case 'Planner Deadline': return <Calendar size={20} className="text-purple-500" />;
            case 'Health Alert': return <HeartPulse size={20} className="text-red-500" />;
            case 'Workout Alert': return <Dumbbell size={20} className="text-orange-500" />;
            case 'Diet Alert': return <Utensils size={20} className="text-green-500" />;
            case 'Budget Alert': return <DollarSign size={20} className="text-emerald-500" />;
            case 'AI Insight': return <Brain size={20} className="text-indigo-500" />;
            case 'System Event': return <Activity size={20} className="text-slate-500" />;
            default: return <Bell size={20} className="text-primary" />;
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-surface-variant/50 shadow-2xl z-[9999] flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between p-6 border-b border-surface-variant/30 bg-surface-container/50">
                    <div>
                        <h2 className="font-display-lg text-2xl font-bold text-on-surface">Command Center</h2>
                        <p className="text-sm font-medium text-on-surface-variant mt-1">Your actionable insights & alerts</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant">
                            <Check size={40} className="mb-3 text-surface-variant" />
                            <p className="font-bold">You're all caught up!</p>
                            <p className="text-sm">No new insights or actions pending.</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="bg-surface-container-low border border-surface-variant/30 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                                        {getIcon(item.icon, item.category)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{item.category}</span>
                                            {item.priority === 'high' && <span className="text-[10px] font-bold uppercase bg-error/10 text-error px-2 py-0.5 rounded-full">High</span>}
                                        </div>
                                        <h3 className="font-bold text-on-surface text-sm mb-1">{item.title}</h3>
                                        <p className="text-xs text-on-surface-variant leading-relaxed mb-3">{item.description}</p>
                                        
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleAction(item.id, 'completed')}
                                                className="flex-1 bg-primary text-on-primary text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 hover:bg-primary/90 transition-colors"
                                            >
                                                <Check size={14} /> Complete
                                            </button>
                                            <button 
                                                onClick={() => handleAction(item.id, 'snoozed')}
                                                className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
                                                title="Snooze"
                                            >
                                                <Clock size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleAction(item.id, 'dismissed')}
                                                className="w-9 h-9 rounded-xl bg-surface-container hover:bg-error/10 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors"
                                                title="Dismiss"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

// Needed because we reference Moon and Droplets but didn't import them above
import { Moon, Droplets } from 'lucide-react';
