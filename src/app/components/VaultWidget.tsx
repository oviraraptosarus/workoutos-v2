'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bookmark, Loader2, Play, CheckCircle2 } from 'lucide-react';
import { getFallbackThumbnail } from '@/utils/thumbnailHelper';
import Link from 'next/link';

export default function VaultWidget() {
    const { user } = useAuth();
    const [vaultItems, setVaultItems] = useState<any[]>([]);
    const [newVaultUrl, setNewVaultUrl] = useState('');
    const [isAddingVault, setIsAddingVault] = useState(false);

    const [isSuccess, setIsSuccess] = useState(false);

    const fetchVault = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('content_vault')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'unread')
            .order('created_at', { ascending: false })
            .limit(10); // Fetch a bit more to calculate "+X more"
        if (!error && data) setVaultItems(data);
    };

    useEffect(() => {
        fetchVault();
    }, [user]);

    const handleAddVaultItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVaultUrl || !user) return;
        setIsAddingVault(true);

        try {
            const metaRes = await fetch(`/api/metadata?url=${encodeURIComponent(newVaultUrl)}`);
            const meta = await metaRes.json();
            
            const { data, error } = await supabase.from('content_vault').insert({
                user_id: user.id,
                url: newVaultUrl,
                title: meta.title || newVaultUrl,
                thumbnail_url: meta.image || null,
                content_type: meta.url?.includes('youtube.com') || meta.url?.includes('youtu.be') ? 'video' 
                           : meta.url?.includes('reddit.com') ? 'post' 
                           : 'article',
                status: 'unread'
            }).select().single();

            if (!error && data) {
                setNewVaultUrl('');
                setIsSuccess(true);
                fetchVault();
                setTimeout(() => setIsSuccess(false), 2500);
            } else {
                console.error("Error saving to vault:", error);
                alert("Failed to save to Vault. " + (error?.message || ''));
            }
        } catch (err) {
            console.error('Failed to add vault item:', err);
        } finally {
            setIsAddingVault(false);
        }
    };

    const handleMarkVaultConsumed = async (id: string) => {
        const { error } = await supabase.from('content_vault').update({ consumed: true }).eq('id', id);
        if (!error) {
            setVaultItems(vaultItems.filter(item => item.id !== id));
        }
    };

    if (!user) return null;

    return (
        <div className="glass-card-premium p-4 sm:p-5 transition-all relative overflow-hidden flex flex-col gap-4 group w-full">
            <Link href="/vault" className="flex items-center justify-between pb-2 relative z-10 group/link w-full">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[10px] bg-blue-500 flex items-center justify-center shrink-0 shadow-sm group-hover/link:scale-105 transition-transform">
                        <Bookmark className="w-4 h-4 text-white fill-white/20" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight font-display group-hover/link:text-blue-400 transition-colors">Content Vault</h2>
                        <p className="text-on-surface-variant text-xs mt-0.5">Quick save videos & articles.</p>
                    </div>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant group-hover/link:text-white transition-colors flex items-center gap-1">
                    VIEW ALL <span className="text-[10px]">&gt;</span>
                </div>
            </Link>

            <form onSubmit={handleAddVaultItem} className="flex gap-2 w-full relative z-10">
                <input
                    type="url"
                    placeholder="Paste YouTube or URL here..."
                    className="flex-1 bg-surface-container border border-surface-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 min-w-0"
                    value={newVaultUrl}
                    onChange={(e) => setNewVaultUrl(e.target.value)}
                    required
                />
                <button 
                    type="submit" 
                    disabled={isAddingVault || isSuccess}
                    className={`${isSuccess ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'} px-4 py-3 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center shrink-0 min-w-[90px]`}
                >
                    {isAddingVault ? <Loader2 className="w-4 h-4 animate-spin" /> : isSuccess ? <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Saved!</> : 'Save'}
                </button>
            </form>

            {vaultItems.length > 0 && (
                <div className="flex flex-col gap-2 mt-2 w-full relative z-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                        {vaultItems.slice(0, 3).map(item => {
                            const thumb = getFallbackThumbnail(item.url, item.thumbnail_url);
                            return (
                            <div key={item.id} className="bg-surface-container border border-surface-variant rounded-xl overflow-hidden hover:border-white/20 transition-all group flex items-stretch min-h-[72px] sm:min-h-[80px] w-full">
                                {thumb && (
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="relative w-20 sm:w-24 bg-black/20 overflow-hidden shrink-0 block">
                                        <img src={thumb} alt={item.title || 'Thumbnail'} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                        {item.content_type === 'video' && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20">
                                                    <Play className="w-2.5 h-2.5 text-white fill-white ml-0.5" />
                                                </div>
                                            </div>
                                        )}
                                    </a>
                                )}
                                <div className="p-3 flex flex-col justify-center flex-1 min-w-0 h-full">
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-bold text-xs line-clamp-2 leading-tight hover:text-blue-400 transition-colors">
                                        {item.title || item.url}
                                    </a>
                                    <div className="mt-auto flex items-center justify-between pt-1 w-full">
                                        <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">
                                            {item.content_type}
                                        </span>
                                        <button 
                                            onClick={(e) => { e.preventDefault(); handleMarkVaultConsumed(item.id); }}
                                            className="text-on-surface-variant hover:text-green-400 transition-colors shrink-0 ml-2"
                                            title="Mark Consumed"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                    {vaultItems.length > 3 && (
                        <Link href="/vault" className="text-xs font-bold text-blue-400 hover:text-blue-300 w-fit pt-1">
                            +{vaultItems.length - 3} more saved in your Vault &rarr;
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
