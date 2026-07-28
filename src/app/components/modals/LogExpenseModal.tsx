'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { getExpenses, saveExpenses } from '../../budget-tracker/services/budgetStorage';

interface LogExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LogExpenseModal({ isOpen, onClose }: LogExpenseModalProps) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [isOther, setIsOther] = useState(false);

    if (!isOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description || !category) return;

        const expenses = getExpenses();
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        saveExpenses([
            ...expenses, 
            {
                id: Date.now().toString(),
                date,
                description,
                category,
                amount: parseFloat(amount),
                protein: null,
                costPerG: null,
                type: 'planned'
            }
        ]);

        setAmount('');
        setDescription('');
        setCategory('');
        setIsOther(false);
        onClose();
        
        window.alert("Expense logged! 💡 Friendly reminder: Don't forget to put some money aside for your savings goals!");
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Log expense</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors btn-press"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Form */}
                <form className="p-5 space-y-4" onSubmit={handleSave}>
                    <div>
                        <label className="block text-[13px] font-semibold text-gray-800 dark:text-gray-200 mb-1.5">Description</label>
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Protein powder"
                            className="w-full bg-[#f5ebd7]/40 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gray-300 dark:focus:border-slate-500 focus:bg-[#f5ebd7]/60 dark:focus:bg-slate-700 transition-colors placeholder:text-gray-400 font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[13px] font-semibold text-gray-800 dark:text-gray-200 mb-1.5">Amount (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-[#f5ebd7]/40 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gray-300 dark:focus:border-slate-500 focus:bg-[#f5ebd7]/60 dark:focus:bg-slate-700 transition-colors placeholder:text-gray-400 font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] font-semibold text-gray-800 dark:text-gray-200 mb-1.5">Category</label>
                            <select
                                required={!isOther}
                                value={isOther ? 'Other' : category}
                                onChange={(e) => {
                                    if (e.target.value === 'Other') {
                                        setIsOther(true);
                                        setCategory('');
                                    } else {
                                        setIsOther(false);
                                        setCategory(e.target.value);
                                    }
                                }}
                                className="w-full bg-[#f5ebd7]/40 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gray-300 dark:focus:border-slate-500 focus:bg-[#f5ebd7]/60 dark:focus:bg-slate-700 transition-colors font-medium appearance-none"
                            >
                                <option value="" disabled>Select...</option>
                                <option value="Groceries">Groceries</option>
                                <option value="Supplements">Supplements</option>
                                <option value="Gym & Equipment">Gym & Equipment</option>
                                <option value="Eating out">Eating out</option>
                                <option value="Transport">Transport</option>
                                <option value="Rent">Rent</option>
                                <option value="Utilities">Utilities</option>
                                <option value="Subscriptions">Subscriptions</option>
                                <option value="Health & Medical">Health & Medical</option>
                                <option value="Personal Care">Personal Care</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Travel">Travel</option>
                                <option value="Education">Education</option>
                                <option value="Other">Other (Specify)</option>
                            </select>
                        </div>
                    </div>

                    {isOther && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <input
                                type="text"
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="Please specify category..."
                                className="w-full bg-[#f5ebd7]/40 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gray-300 dark:focus:border-slate-500 focus:bg-[#f5ebd7]/60 dark:focus:bg-slate-700 transition-colors placeholder:text-gray-400 font-medium"
                            />
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full bg-[#1f4e38] hover:bg-[#163a2a] text-white font-bold py-3.5 rounded-2xl transition-colors text-[15px] shadow-sm btn-press"
                        >
                            Log expense
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
