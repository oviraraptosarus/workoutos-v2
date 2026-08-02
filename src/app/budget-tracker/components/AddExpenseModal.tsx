'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';

export interface ExpenseData {
    description: string;
    amount: number;
    category: string;
    date: string;
}

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd?: (expense: ExpenseData) => void;
}

export default function AddExpenseModal({ isOpen, onClose, onAdd }: AddExpenseModalProps) {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Groceries');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onAdd) {
            onAdd({ description, amount: parseFloat(amount), category, date: new Date().toISOString().split('T')[0] });
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Expense">
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                    <label className="block font-bold text-on-surface-variant mb-1">Description</label>
                    <input
                        type="text"
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Protein powder"
                        className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:bg-card-white/80 focus:border-white/20 shadow-inner transition-colors"
                    />
                </div>
                <div>
                    <label className="block font-bold text-on-surface-variant mb-1">Amount (₹)</label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:bg-card-white/80 focus:border-white/20 shadow-inner transition-colors"
                    />
                </div>
                <div>
                    <label className="block font-bold text-on-surface-variant mb-1">Category</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:bg-card-white/80 focus:border-white/20 shadow-inner transition-colors"
                    >
                        <option value="Groceries">Groceries & Meal Prep</option>
                        <option value="Supplements">Supplements & Protein</option>
                        <option value="Gym & Subscriptions">Gym & Subscriptions</option>
                        <option value="Dining Out">Dining Out & Social</option>
                        <option value="Gear">Gear & Equipment</option>
                    </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-card-white/80 text-on-surface-variant font-bold border border-surface-variant transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-white/90 hover:bg-white text-white font-bold transition-colors shadow-sm border border-white/20"
                    >
                        Save Expense
                    </button>
                </div>
            </form>
        </Modal>
    );
}
