'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Bookmark, Loader2, Play, CheckCircle2 } from 'lucide-react';

export default function VaultWidget() {
    const { user } = useAuth();
    const [vaultItems, setVaultItems] = useState<any[]>([]);
    const [newVaultUrl, setNewVaultUrl] = useState('');
    const [isAddingVault, setIsAddingVault] = useState(false);

    useEffect(() => {
        if (!user) return;
        const fetchVault = async () => {
            const { data, error } = await supabase
                .from('content_vault')
                .select('*')
                .eq('user_id', user.id)
                .eq('consumed', false)
                .order('created_at', { ascending: false })
                .limit(4); // Only show latest 4 on dashboard
            if (!error && data) setVaultItems(data);
        };
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
                description: meta.description || '',
                thumbnail_url: meta.image || null,
                content_type: meta.url?.includes('youtube.com') || meta.url?.includes('youtu.be') ? 'video' 
                           : meta.url?.includes('reddit.com') ? 'post' 
                           : 'article',
                consumed: false
            }).select().single();

            if (!error && data) {
                setVaultItems([data, ...vaultItems].slice(0, 4));
                setNewVaultUrl('');
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
        <div className="bg-surface-container-lowest border border-surface-variant p-6 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col gap-4 relative overflow-hidden group w-full">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50"></div>
            
            <div className="flex items-center gap-3 border-b border-surface-variant pb-4">
                <div className="w-8 h-8 rounded-[10px] bg-blue-500 flex items-center justify-center shrink-0 shadow-sm">
                    <Bookmark className="w-4 h-4 text-white fill-white/20" />
                </div>
                <div>
                    <h2 className="text-xl font-black tracking-tight font-display">Content Vault</h2>
                    <p className="text-on-surface-variant text-xs mt-0.5">Quick save videos & articles.</p>
                </div>
            </div>

            <form onSubmit={handleAddVaultItem} className="flex gap-2 w-full">
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
                    disabled={isAddingVault}
                    className="bg-white text-black px-4 py-3 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center shrink-0 min-w-[70px]"
                >
                    {isAddingVault ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
            </form>

            {vaultItems.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2 w-full">
                    {vaultItems.map(item => (
                        <div key={item.id} className="bg-surface-container border border-surface-variant rounded-xl overflow-hidden hover:border-white/20 transition-all group flex items-center h-16 sm:h-20 w-full">
                            {item.thumbnail_url && (
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="relative h-full aspect-square bg-black/20 overflow-hidden shrink-0 block">
                                    <img src={item.thumbnail_url} alt={item.title || 'Thumbnail'} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
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
                    ))}
                </div>
            )}
        </div>
    );
}
