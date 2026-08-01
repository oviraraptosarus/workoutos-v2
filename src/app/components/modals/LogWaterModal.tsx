'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useDate } from '@/contexts/DateContext';
import { addWaterLog } from '@/app/diet/services/dietStorage';

interface LogWaterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LogWaterModal({ isOpen, onClose }: LogWaterModalProps) {
    const { selectedDate } = useDate();
    const [amount, setAmount] = useState('250');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = parseInt(amount, 10);
        if (!parsed || parsed <= 0 || !selectedDate) return;

        setLoading(true);
        try {
            await addWaterLog(selectedDate, parsed, 'Modal Log');
            onClose();
        } catch (err) {
            console.error('Failed to log water:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card-white dark:bg-surface-container-lowest rounded-3xl w-full max-w-sm shadow-lg overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-surface-variant">
                    <h2 className="text-lg font-bold text-on-surface dark:text-white">Log Water</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors btn-press"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Form */}
                <form className="p-5 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-[13px] font-semibold text-on-surface mb-1.5">Amount (ml)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="250"
                            required
                            min="1"
                            className="w-full bg-surface-container-low border border-surface-variant rounded-2xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-secondary transition-colors font-medium"
                        />
                    </div>

                    <div className="flex gap-2">
                        {[150, 250, 500, 750].map((val) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setAmount(String(val))}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                                    amount === String(val)
                                        ? 'bg-secondary text-white border-secondary'
                                        : 'bg-surface-container text-on-surface-variant border-surface-variant'
                                }`}
                            >
                                {val}ml
                            </button>
                        ))}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold py-3.5 rounded-2xl transition-colors text-[15px] shadow-sm btn-press disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Log Water'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
