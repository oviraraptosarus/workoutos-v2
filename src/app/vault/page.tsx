'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Bookmark, Play, CheckCircle2, Trash2, Loader2, Link2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner'; // Assuming sonner is used for toasts, if not I'll just use native alert or no toast. Wait, let's use a simple inline message or standard alert just in case.

export default function VaultPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newUrl, setNewUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState<'unread' | 'consumed'>('unread');

    const fetchItems = async () => {
        if (!user) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('content_vault')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            setItems(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchItems();
    }, [user]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUrl || !user) return;
        setIsAdding(true);

        try {
            const metaRes = await fetch(`/api/metadata?url=${encodeURIComponent(newUrl)}`);
            const meta = await metaRes.json();
            
            const { data, error } = await supabase.from('content_vault').insert({
                user_id: user.id,
                url: newUrl,
                title: meta.title || newUrl,
                description: meta.description || '',
                thumbnail_url: meta.image || null,
                content_type: meta.url?.includes('youtube.com') || meta.url?.includes('youtu.be') ? 'video' 
                           : meta.url?.includes('reddit.com') ? 'post' 
                           : 'article',
                status: 'unread'
            }).select().single();

            if (!error && data) {
                setNewUrl('');
                fetchItems();
            } else {
                alert("Failed to save: " + (error?.message || ''));
            }
        } catch (err) {
            console.error(err);
            alert("Failed to fetch metadata.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleMarkStatus = async (id: string, newStatus: 'unread' | 'consumed') => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
        await supabase.from('content_vault').update({ status: newStatus }).eq('id', id);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this from your vault?')) return;
        setItems(prev => prev.filter(item => item.id !== id));
        await supabase.from('content_vault').delete().eq('id', id);
    };

    const displayItems = items.filter(item => item.status === activeTab);

    if (!user) return <AppLayout><div className="p-8 text-center">Loading Vault...</div></AppLayout>;

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">
                
                {/* Header */}
                <div className="flex flex-col gap-2 px-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Bookmark className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight font-display">Content Vault</h1>
                            <p className="text-on-surface-variant text-sm mt-1">Your personal library of execution fuel.</p>
                        </div>
                    </div>
                </div>

                {/* Add Input */}
                <div className="glass-card-premium p-2 pr-2 rounded-2xl flex items-center gap-2 sticky top-[88px] z-30 mx-2">
                    <div className="pl-4 text-on-surface-variant">
                        <Link2 className="w-5 h-5" />
                    </div>
                    <form onSubmit={handleAdd} className="flex-1 flex gap-2">
                        <input
                            type="url"
                            placeholder="Paste a YouTube video, article, or URL..."
                            className="flex-1 bg-transparent border-none px-2 py-3 text-sm focus:outline-none focus:ring-0 min-w-0 placeholder:text-on-surface-variant"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            required
                        />
                        <button 
                            type="submit" 
                            disabled={isAdding}
                            className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center shrink-0"
                        >
                            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                        </button>
                    </form>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 px-2">
                    <button 
                        onClick={() => setActiveTab('unread')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'unread' ? 'bg-white text-black shadow-md' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                    >
                        Unread ({items.filter(i => i.status === 'unread').length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('consumed')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'consumed' ? 'bg-white text-black shadow-md' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                    >
                        Consumed ({items.filter(i => i.status === 'consumed').length})
                    </button>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-on-surface-variant">
                        <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                    </div>
                ) : displayItems.length === 0 ? (
                    <div className="glass-card-premium p-12 flex flex-col items-center justify-center text-center gap-4 mx-2 border border-dashed border-white/20">
                        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
                            <Bookmark className="w-8 h-8 text-on-surface-variant opacity-50" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">No {activeTab} items</h3>
                            <p className="text-on-surface-variant text-sm mt-1 max-w-[250px] mx-auto">
                                {activeTab === 'unread' 
                                    ? "Paste a URL above to save it for later." 
                                    : "You haven't marked anything as consumed yet."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2">
                        {displayItems.map(item => (
                            <div key={item.id} className="glass-card-premium rounded-[24px] overflow-hidden group flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10 border border-white/5">
                                {item.thumbnail_url && (
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="relative w-full aspect-video bg-black/20 overflow-hidden shrink-0 block">
                                        <img src={item.thumbnail_url} alt={item.title || 'Thumbnail'} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-transform duration-700 ease-out" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60"></div>
                                        
                                        {item.content_type === 'video' && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-blue-500/80 transition-colors duration-300">
                                                    <Play className="w-5 h-5 text-white fill-white ml-1" />
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="absolute bottom-3 left-3 flex gap-2">
                                            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] uppercase tracking-wider font-bold text-white border border-white/10">
                                                {item.content_type}
                                            </span>
                                        </div>
                                    </a>
                                )}
                                <div className="p-5 flex flex-col flex-1">
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-bold text-base line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors mb-2">
                                        {item.title || item.url}
                                    </a>
                                    {item.description && (
                                        <p className="text-xs text-on-surface-variant line-clamp-2 mb-4 opacity-80 leading-relaxed">
                                            {item.description}
                                        </p>
                                    )}
                                    
                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Open
                                        </a>
                                        
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-red-400 hover:bg-red-400/10 transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            
                                            {activeTab === 'unread' ? (
                                                <button 
                                                    onClick={() => handleMarkStatus(item.id, 'consumed')}
                                                    className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-green-400 hover:bg-green-400/10 transition-all"
                                                    title="Mark Consumed"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleMarkStatus(item.id, 'unread')}
                                                    className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                                                    title="Mark Unread"
                                                >
                                                    <Bookmark className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
