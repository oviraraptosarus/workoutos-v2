'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { X, Bell, Zap, Calendar, HeartPulse, Dumbbell, Utensils, DollarSign, Brain, Activity, Check, Clock, ExternalLink, Target, TrendingUp, Sparkles, Moon, Droplets, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SnoozeSheet from '@/app/components/modals/SnoozeSheet';
import { useDailySnapshot } from '@/hooks/useDailySnapshot';

interface CommandCenterOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CommandCenterOverlay({ isOpen, onClose }: CommandCenterOverlayProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { snapshot, refreshSnapshot } = useDailySnapshot();
    
    // Dynamic Greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    
    const currentStreak = snapshot.streak;
    const completionPct = snapshot.completionPercentage;
    const nextReminder = snapshot.nextReminder || "No reminders scheduled.";

    const fetchItems = async () => {
        if (!user) return;
        setLoading(true);
        const { data } = await supabase
            .from('command_center_items')
            .select('*')
            .eq('user_id', user.id)
            .or('status.eq.active,and(status.eq.snoozed,snoozed_until.lte.now())')
            .order('priority', { ascending: false }) 
            .order('created_at', { ascending: false });
        
        if (data) {
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
            refreshSnapshot();
        }
    }, [isOpen, user]);

    const [snoozeTargetId, setSnoozeTargetId] = useState<string | null>(null);

    const handleAction = async (id: string, action: 'completed' | 'dismissed' | 'skipped') => {
        setItems(prev => prev.filter(item => item.id !== id));
        
        if (action === 'skipped') {
            await supabase.from('command_center_items').update({ status: 'completed', is_skipped: true }).eq('id', id);
        } else {
            await supabase.from('command_center_items').update({ status: action }).eq('id', id);
        }
        refreshSnapshot();
    };

    const handleSnoozeConfirm = async (date: Date) => {
        if (!snoozeTargetId) return;
        setItems(prev => prev.filter(item => item.id !== snoozeTargetId));
        await supabase.from('command_center_items').update({ status: 'snoozed', snoozed_until: date.toISOString() }).eq('id', snoozeTargetId);
        setSnoozeTargetId(null);
    };

    const handleOpenRelated = (actionType: string) => {
        if (!actionType) return;
        if (actionType.includes('WATER')) router.push('/water');
        else if (actionType.includes('SLEEP')) router.push('/sleep');
        else if (actionType.includes('WORKOUT')) router.push('/workout');
        else if (actionType.includes('BREAKFAST') || actionType.includes('LUNCH') || actionType.includes('DINNER') || actionType.includes('SNACK') || actionType.includes('MEAL')) router.push('/diet');
        else if (actionType.includes('PLANNER') || actionType.includes('JOURNAL')) router.push('/planner');
        
        onClose();
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
            <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-all duration-300" onClick={onClose} />
            <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-[9999] flex flex-col animate-in slide-in-from-right duration-300 font-sans">
                
                {/* Premium Glass Header */}
                <div className="px-6 pt-10 pb-6 relative overflow-hidden shrink-0 bg-surface border-b border-white/5">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                    
                    <div className="flex items-start justify-between relative z-10 mb-8">
                        <div>
                            <h2 className="text-3xl font-semibold text-on-surface tracking-tight mb-1">{greeting}</h2>
                            <p className="text-sm font-medium text-on-surface-variant flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                Intelligence Hub
                                <span className="w-1 h-1 rounded-full bg-surface-variant" />
                                <button onClick={() => { onClose(); router.push('/settings/reminders'); }} className="text-on-surface hover:text-white transition-colors flex items-center gap-1">
                                    Settings <ExternalLink size={12} />
                                </button>
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-on-surface transition-all active:scale-95 shadow-sm"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4 relative z-10 mb-6">
                        <div className="bg-surface-container backdrop-blur-xl border border-white/10 p-4 rounded-3xl flex items-center gap-4 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-on-surface flex items-center justify-center shrink-0 shadow-inner">
                                <TrendingUp size={22} />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5 opacity-80">Streak</div>
                                <div className="text-xl font-semibold tracking-tighter text-on-surface leading-none tabular-nums">{currentStreak} <span className="text-sm font-medium text-on-surface-variant tracking-normal">Days</span></div>
                            </div>
                        </div>
                        <div className="bg-surface-container backdrop-blur-xl border border-white/10 p-4 rounded-3xl flex items-center gap-4 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-on-surface flex items-center justify-center shrink-0 shadow-inner">
                                <Target size={22} />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5 opacity-80">Today</div>
                                <div className="text-xl font-semibold tracking-tighter text-on-surface leading-none tabular-nums">{completionPct}<span className="text-sm font-medium text-on-surface-variant tracking-normal">%</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-4 gap-3 relative z-10">
                        <button onClick={() => { onClose(); router.push('/water'); }} className="flex flex-col items-center gap-2 group">
                            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-on-surface flex items-center justify-center group-hover:scale-105 group-hover:bg-white/10 transition-all shadow-sm">
                                <Droplets size={24} strokeWidth={1.5} />
                            </div>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">Water</span>
                        </button>
                        <button onClick={() => { onClose(); router.push('/diet'); }} className="flex flex-col items-center gap-2 group">
                            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-on-surface flex items-center justify-center group-hover:scale-105 group-hover:bg-white/10 transition-all shadow-sm">
                                <Utensils size={24} strokeWidth={1.5} />
                            </div>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">Meal</span>
                        </button>
                        <button onClick={() => { onClose(); router.push('/workout'); }} className="flex flex-col items-center gap-2 group">
                            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-on-surface flex items-center justify-center group-hover:scale-105 group-hover:bg-white/10 transition-all shadow-sm">
                                <Dumbbell size={24} strokeWidth={1.5} />
                            </div>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">Workout</span>
                        </button>
                        <button onClick={() => { onClose(); router.push('/planner'); }} className="flex flex-col items-center gap-2 group">
                            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-on-surface flex items-center justify-center group-hover:scale-105 group-hover:bg-white/10 transition-all shadow-sm">
                                <Plus size={24} strokeWidth={1.5} />
                            </div>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">Log</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 space-y-4">
                    
                    {process.env.NODE_ENV === 'development' && (
                        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-2xl mb-4">
                            <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Zap size={10} /> Debug Diagnostics</h4>
                            <div className="text-xs text-red-200/70 font-mono space-y-1">
                                <p>Source: <span className="text-white">useDailySnapshot (Live)</span></p>
                                <p>Timestamp: <span className="text-white">{new Date(snapshot.timestamp).toISOString()}</span></p>
                                <p>State: <span className="text-white">{snapshot.isEmpty ? 'Empty' : 'Has Data'}</span></p>
                                <p>Points: <span className="text-white">{snapshot.completionPercentage}%</span></p>
                            </div>
                        </div>
                    )}

                    {/* Next Reminder Pill */}
                    {nextReminder !== "No reminders scheduled." ? (
                        <div className="bg-surface-container border border-white/10 text-on-surface px-5 py-4 rounded-3xl flex items-center justify-between shadow-sm group hover:border-white/20 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Clock size={18} className="text-on-surface-variant group-hover:text-on-surface transition-colors" />
                                <span className="font-semibold text-sm">Next: {nextReminder}</span>
                            </div>
                            <ExternalLink size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ) : (
                        <div className="bg-surface-container/50 border border-white/5 text-on-surface-variant px-5 py-4 rounded-3xl flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <Clock size={18} className="opacity-50" />
                                <span className="text-sm">No reminders scheduled</span>
                            </div>
                        </div>
                    )}

                    {/* Real Database AI Items Rendered Below */}

                    {loading ? (
                        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div></div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-on-surface-variant bg-surface-container-low rounded-[2rem] border border-white/5">
                            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 text-on-surface-variant border border-white/5">
                                <Check size={32} strokeWidth={1.5} />
                            </div>
                            <p className="font-semibold text-on-surface text-lg tracking-tight">You're all caught up!</p>
                            <p className="text-sm text-center max-w-[200px] mt-1 text-on-surface-variant">No new database actions pending right now.</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="bg-surface-container border border-white/10 rounded-3xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.1)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.2)] transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                                        {/* Neutralize icon color */}
                                        <div className="text-on-surface opacity-80 group-hover:opacity-100 transition-opacity">
                                            {getIcon(item.icon, item.category)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{item.category}</span>
                                            {item.priority === 'high' && <span className="text-[9px] font-bold uppercase bg-white/10 text-on-surface px-2 py-0.5 rounded-full tracking-wider border border-white/10">High Priority</span>}
                                        </div>
                                        <h3 className="font-semibold tracking-tight text-on-surface text-base mb-1.5 leading-snug">{item.title}</h3>
                                        <p className="text-sm text-on-surface-variant leading-relaxed mb-5">{item.description}</p>
                                        
                                        <div className="flex flex-wrap items-center gap-2">
                                            {item.action_type && (
                                                <button 
                                                    onClick={() => handleOpenRelated(item.action_type)}
                                                    className="bg-white/5 hover:bg-white/10 text-on-surface border border-white/10 text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                                >
                                                    <ExternalLink size={14} /> Open
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleAction(item.id, 'completed')}
                                                className="flex-1 bg-white text-black text-xs font-bold py-2.5 rounded-2xl flex items-center justify-center gap-1.5 hover:bg-zinc-200 transition-all active:scale-95 min-w-[80px] shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                            >
                                                <Check size={14} strokeWidth={3} /> Complete
                                            </button>
                                            <button 
                                                onClick={() => handleAction(item.id, 'skipped')}
                                                className="bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface border border-white/10 text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                                            >
                                                Skip
                                            </button>
                                            <button 
                                                onClick={() => setSnoozeTargetId(item.id)}
                                                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all active:scale-95 shrink-0"
                                                title="Snooze"
                                            >
                                                <Clock size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleAction(item.id, 'dismissed')}
                                                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 flex items-center justify-center text-on-surface-variant hover:text-red-400 transition-all active:scale-95 shrink-0"
                                                title="Dismiss"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            <SnoozeSheet 
                isOpen={!!snoozeTargetId} 
                onClose={() => setSnoozeTargetId(null)} 
                onSnooze={handleSnoozeConfirm} 
            />
        </>
    );
}
