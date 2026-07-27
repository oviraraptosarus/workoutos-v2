'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { IncomeItem, ExpenseItem } from '../services/budgetStorage';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'income' | 'expense';
    onSaveIncome?: (item: Omit<IncomeItem, 'id'>) => void;
    onSaveExpense?: (item: Omit<ExpenseItem, 'id'>) => void;
}

export default function TransactionModal({
    isOpen,
    onClose,
    type,
    onSaveIncome,
    onSaveExpense
}: TransactionModalProps) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [categorySource, setCategorySource] = useState('');
    
    if (!isOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description || !categorySource) return;

        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        if (type === 'income' && onSaveIncome) {
            onSaveIncome({
                date,
                description,
                source: categorySource,
                amount: parseFloat(amount),
                type: 'one-off'
            });
        } else if (type === 'expense' && onSaveExpense) {
            onSaveExpense({
                date,
                description,
                category: categorySource,
                amount: parseFloat(amount),
                protein: null,
                costPerG: null,
                type: 'planned'
            });
        }
        
        // Reset and close
        setAmount('');
        setDescription('');
        setCategorySource('');
        onClose();
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                        Add {type}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g. 500"
                            className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={type === 'income' ? 'e.g. Freelance project' : 'e.g. Protein powder'}
                            className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                            {type === 'income' ? 'Source' : 'Category'}
                        </label>
                        <input
                            type="text"
                            value={categorySource}
                            onChange={(e) => setCategorySource(e.target.value)}
                            placeholder={type === 'income' ? 'e.g. Salary, Side Hustle' : 'e.g. Groceries, Gym'}
                            className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={`w-full font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 text-white transition-colors mt-6 ${
                            type === 'income' ? 'bg-[#166534] hover:bg-[#14532d]' : 'bg-[#e11d48] hover:bg-[#be123c]'
                        }`}
                    >
                        <Check size={16} strokeWidth={3} /> Save {type}
                    </button>
                </form>
            </div>
        </div>
    );

    if (typeof window !== 'undefined') {
        return createPortal(modalContent, document.body);
    }
    return null;
}
