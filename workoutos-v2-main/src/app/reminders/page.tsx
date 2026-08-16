'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Search, Check, Clock, X, Archive, Filter, Droplets, Trash2, Edit3, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReminderCenter() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'inbox' | 'configs'>('inbox');
    
    // Configs state
    const [configs, setConfigs] = useState<any[]>([]);
    
    // Inbox state
    const [items, setItems] = useState<any[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!user) return;
        fetchConfigs();
        fetchItems();
    }, [user]);

    const fetchConfigs = async () => {
        const { data } = await supabase.from('smart_reminders_config').select('*').eq('user_id', user!.id);
        if (data) setConfigs(data);
    };

    const fetchItems = async () => {
        let query = supabase.from('command_center_items').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
        if (filterStatus !== 'all') {
            query = query.eq('status', filterStatus);
        }
        const { data } = await query;
        if (data) setItems(data);
    };

    useEffect(() => {
        if (user) fetchItems();
    }, [filterStatus]);

    const handleBulkAction = async (action: 'completed' | 'dismissed' | 'deleted') => {
        if (selectedIds.size === 0) return;
        const ids = Array.from(selectedIds);
        
        if (action === 'deleted') {
            await supabase.from('command_center_items').delete().in('id', ids);
            setItems(prev => prev.filter(i => !ids.includes(i.id)));
        } else {
            await supabase.from('command_center_items').update({ status: action }).in('id', ids);
            setItems(prev => prev.map(i => ids.includes(i.id) ? { ...i, status: action } : i));
        }
        setSelectedIds(new Set());
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleConfig = async (config: any) => {
        const newVal = !config.is_enabled;
        setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, is_enabled: newVal } : c));
        await supabase.from('smart_reminders_config').update({ is_enabled: newVal }).eq('id', config.id);
    };

    const filteredItems = items.filter(item => 
        (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
         item.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="flex flex-col h-full animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display-lg text-3xl font-bold text-on-surface">Reminder Center</h1>
                    <p className="text-on-surface-variant font-medium">Manage your alerts, schedules, and history.</p>
                </div>
                <div className="flex bg-surface-container-low rounded-2xl p-1 shadow-sm border border-surface-variant/30">
                    <button 
                        onClick={() => setActiveTab('inbox')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'inbox' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface hover:bg-surface-container'}`}
                    >
                        Inbox & History
                    </button>
                    <button 
                        onClick={() => setActiveTab('configs')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'configs' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface hover:bg-surface-container'}`}
                    >
                        Schedules
                    </button>
                </div>
            </div>

            {activeTab === 'configs' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-3xl border border-surface-variant/50">
                        <p className="text-sm font-medium text-on-surface-variant">Configure recurring smart reminders for missing logs.</p>
                        <button className="bg-primary hover:bg-primary/90 text-on-primary px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                            <Plus size={16} /> New Rule
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {configs.map(config => (
                            <div key={config.id} className="bg-card-white dark:bg-surface-container-lowest border border-surface-variant/50 p-5 rounded-3xl shadow-sm flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-lg text-on-surface mb-1 flex items-center gap-2">
                                        {config.reminder_type === 'Water' ? <Droplets size={18} className="text-blue-500" /> : <Bell size={18} className="text-primary" />}
                                        {config.reminder_type} Reminder
                                    </h3>
                                    {config.reminder_type === 'Water' ? (
                                        <p className="text-sm text-on-surface-variant mb-2">Every {config.interval_minutes}m from {config.start_time} to {config.end_time}</p>
                                    ) : (
                                        <p className="text-sm text-on-surface-variant mb-2">At {config.time} on selected days</p>
                                    )}
                                    <div className="flex gap-1 mt-3">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                            <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${config.recurring_days?.includes(i) ? 'bg-primary/20 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                                                {d}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                    <button onClick={() => toggleConfig(config)} className={`relative w-12 h-7 rounded-full transition-colors ${config.is_enabled ? 'bg-activity-green' : 'bg-surface-container-high'}`}>
                                        <span className={`absolute top-1 w-5 h-5 bg-card-white rounded-full transition-transform shadow ${config.is_enabled ? 'right-1' : 'left-1'}`} />
                                    </button>
                                    <button className="text-primary text-sm font-bold mt-2">Edit</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'inbox' && (
                <div className="bg-card-white dark:bg-surface-container-lowest border border-surface-variant/50 rounded-3xl p-5 shadow-sm flex-1 flex flex-col h-[60vh]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                            <input 
                                type="text"
                                placeholder="Search reminders..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-surface-container-low border border-surface-variant rounded-2xl pl-10 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <select 
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="bg-surface-container-low border border-surface-variant rounded-xl px-4 py-2.5 text-sm font-bold text-on-surface focus:outline-none"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Upcoming & Active</option>
                                <option value="snoozed">Snoozed</option>
                                <option value="completed">Completed</option>
                                <option value="dismissed">Missed/Dismissed</option>
                            </select>
                        </div>
                    </div>

                    {selectedIds.size > 0 && (
                        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3 flex items-center justify-between mb-4">
                            <span className="font-bold text-sm text-primary">{selectedIds.size} selected</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleBulkAction('completed')} className="bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                                    <Check size={14} /> Mark Complete
                                </button>
                                <button onClick={() => handleBulkAction('dismissed')} className="bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                                    <X size={14} /> Dismiss
                                </button>
                                <button onClick={() => handleBulkAction('deleted')} className="bg-error/10 hover:bg-error/20 text-error text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {filteredItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant">
                                <Archive size={40} className="mb-4 text-surface-variant" />
                                <p className="font-bold">No items found</p>
                                <p className="text-sm">Try adjusting your filters or search.</p>
                            </div>
                        ) : (
                            filteredItems.map(item => (
                                <div key={item.id} className="group flex items-center justify-between p-4 bg-surface-container-low hover:bg-surface-container rounded-2xl border border-surface-variant/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(item.id)}
                                            onChange={() => toggleSelect(item.id)}
                                            className="w-5 h-5 rounded border-surface-variant text-primary focus:ring-primary"
                                        />
                                        <div>
                                            <h4 className={`font-bold text-sm ${item.status === 'completed' || item.status === 'dismissed' ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                                                {item.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${
                                                    item.status === 'active' ? 'bg-primary/10 text-primary' : 
                                                    item.status === 'snoozed' ? 'bg-amber-500/10 text-amber-500' :
                                                    item.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                    'bg-surface-variant text-on-surface-variant'
                                                }`}>
                                                    {item.status}
                                                </span>
                                                <span className="text-xs text-on-surface-variant font-medium">
                                                    {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.status === 'active' && (
                                            <>
                                                <button onClick={() => { setSelectedIds(new Set([item.id])); handleBulkAction('completed') }} className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20" title="Complete"><Check size={16} /></button>
                                                <button onClick={() => { setSelectedIds(new Set([item.id])); handleBulkAction('dismissed') }} className="p-2 rounded-xl bg-surface-container-high text-on-surface-variant hover:text-error" title="Dismiss"><X size={16} /></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
