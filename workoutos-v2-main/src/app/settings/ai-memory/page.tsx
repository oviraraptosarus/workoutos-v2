'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAIMemories, deleteAIMemory, updateAIMemory, AIMemory } from '@/services/aiMemoryService';
import { ArrowLeft, Brain, Trash2, Edit2, Check, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AIMemoryPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [memories, setMemories] = useState<AIMemory[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        if (!user) return;
        const loadMemories = async () => {
            setLoading(true);
            const data = await getAIMemories();
            setMemories(data);
            setLoading(false);
        };
        loadMemories();
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to forget this memory?')) return;
        const success = await deleteAIMemory(id);
        if (success) {
            setMemories(prev => prev.filter(m => m.id !== id));
        }
    };

    const handleEditStart = (memory: AIMemory) => {
        setEditingId(memory.id);
        setEditValue(memory.memory_text);
    };

    const handleEditSave = async (id: string) => {
        if (!editValue.trim()) return;
        const success = await updateAIMemory(id, editValue);
        if (success) {
            setMemories(prev => prev.map(m => m.id === id ? { ...m, memory_text: editValue } : m));
            setEditingId(null);
        }
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditValue('');
    };

    // Group by category
    const groupedMemories = memories.reduce((acc, curr) => {
        if (!acc[curr.category]) acc[curr.category] = [];
        acc[curr.category].push(curr);
        return acc;
    }, {} as Record<string, AIMemory[]>);

    return (
        <div className="min-h-screen bg-background pb-20 pt-safe-top animate-in fade-in duration-300">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-surface-variant/30 px-4 py-4 flex items-center justify-between">
                <button 
                    onClick={() => router.push('/profile')} 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-on-surface">AI Memory</h1>
                <div className="w-10 h-10 flex items-center justify-center text-indigo-500">
                    <Brain size={24} />
                </div>
            </div>

            <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-8 mt-4">
                
                <div className="bg-surface-container-low rounded-3xl p-5 border border-primary/20 flex gap-4 items-start shadow-sm">
                    <ShieldAlert size={24} className="text-primary shrink-0 mt-0.5" />
                    <div>
                        <h2 className="text-sm font-bold text-on-surface mb-1">True Long-Term Memory</h2>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                            Ava remembers your fitness goals, dietary preferences, injuries, and habits across all conversations. You have full control—edit or delete memories at any time.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : memories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
                        <Brain size={48} className="mb-4 opacity-50 text-surface-variant" />
                        <h3 className="text-lg font-bold text-on-surface mb-2">No Memories Yet</h3>
                        <p className="text-sm text-center max-w-[250px]">As you chat with Ava, important details about you will be saved here automatically.</p>
                    </div>
                ) : (
                    Object.entries(groupedMemories).map(([category, items]) => (
                        <div key={category} className="space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary px-2">{category}</h3>
                            <div className="bg-card-white border border-surface-variant/40 rounded-3xl overflow-hidden shadow-sm">
                                {items.map((memory, index) => (
                                    <div key={memory.id} className={`p-4 ${index !== items.length - 1 ? 'border-b border-surface-variant/30' : ''}`}>
                                        {editingId === memory.id ? (
                                            <div className="flex flex-col gap-3">
                                                <textarea 
                                                    value={editValue}
                                                    onChange={e => setEditValue(e.target.value)}
                                                    className="w-full bg-surface-container rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                                    rows={3}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={handleEditCancel} className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container">
                                                        <X size={18} />
                                                    </button>
                                                    <button onClick={() => handleEditSave(memory.id)} className="p-2 rounded-xl bg-primary text-on-primary">
                                                        <Check size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between gap-4 group">
                                                <p className="text-sm text-on-surface leading-relaxed">{memory.memory_text}</p>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditStart(memory)} className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(memory.id)} className="p-2 text-on-surface-variant hover:text-error transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
