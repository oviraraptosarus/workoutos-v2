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
    const [isOtherCategory, setIsOtherCategory] = useState(false);
    
    if (!isOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description || !categorySource) return;

        const now = new Date();
        const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
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
            
            // Remind the user to save!
            window.alert("Expense logged! 💡 Friendly reminder: Don't forget to put some money aside for your savings goals!");
        }
        
        // Reset and close
        setAmount('');
        setDescription('');
        setCategorySource('');
        setIsOtherCategory(false);
        onClose();
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card-white  rounded-3xl w-full max-w-md shadow-xl border border-surface-variant  overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between border-b border-surface-variant ">
                    <h2 className="text-lg font-bold text-on-surface dark:text-white capitalize">
                        Add {type}
                    </h2>
                    <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface-variant dark:hover:text-gray-200">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-on-surface-variant dark:text-on-surface-variant mb-1">Amount (₹)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g. 500"
                            className="w-full bg-surface-container-low dark:bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-on-surface-variant dark:text-on-surface-variant mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={type === 'income' ? 'e.g. Freelance project' : 'e.g. Protein powder'}
                            className="w-full bg-surface-container-low dark:bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-on-surface-variant dark:text-on-surface-variant mb-1">
                            {type === 'income' ? 'Source' : 'Category'}
                        </label>
                        {type === 'income' ? (
                            <input
                                type="text"
                                value={categorySource}
                                onChange={(e) => setCategorySource(e.target.value)}
                                placeholder="e.g. Salary, Side Hustle"
                                className="w-full bg-surface-container-low dark:bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                required
                            />
                        ) : (
                            <>
                                <select
                                    value={isOtherCategory ? 'Other' : categorySource}
                                    onChange={(e) => {
                                        if (e.target.value === 'Other') {
                                            setIsOtherCategory(true);
                                            setCategorySource('');
                                        } else {
                                            setIsOtherCategory(false);
                                            setCategorySource(e.target.value);
                                        }
                                    }}
                                    className="w-full bg-surface-container-low dark:bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    required={!isOtherCategory}
                                >
                                    <option value="" disabled>Select a category</option>
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
                                {isOtherCategory && (
                                    <input
                                        type="text"
                                        value={categorySource}
                                        onChange={(e) => setCategorySource(e.target.value)}
                                        placeholder="Please specify..."
                                        className="w-full mt-2 bg-surface-container-low dark:bg-surface-container-high border border-surface-variant  rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        required
                                    />
                                )}
                            </>
                        )}
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
