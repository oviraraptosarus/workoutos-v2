'use client';

import React, { useState } from 'react';
import { Plus, ChevronDown, Download } from 'lucide-react';
import TransactionModal from './TransactionModal';
import { getIncome, saveIncome, getExpenses, saveExpenses } from '../services/budgetStorage';

export default function BudgetHeader() {
    const [modalType, setModalType] = useState<'income' | 'expense' | null>(null);

    const handleAddIncome = (item: any) => {
        const income = getIncome();
        const newItem = { ...item, id: Date.now().toString() };
        saveIncome([...income, newItem]);
    };

    const handleAddExpense = (item: any) => {
        const expenses = getExpenses();
        const newItem = { ...item, id: Date.now().toString() };
        saveExpenses([...expenses, newItem]);
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Budget Tracker
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">July 2026 - 26 of 31 days elapsed</p>
            </div>
            <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 bg-[#f0ede6] dark:bg-slate-800 hover:bg-[#e6e2da] dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                    July 2026 <ChevronDown size={16} />
                </button>
                <button className="flex items-center justify-center w-10 h-10 bg-[#f0ede6] dark:bg-slate-800 hover:bg-[#e6e2da] dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-full transition-colors">
                    <Download size={16} />
                </button>
                <div className="flex items-center gap-1.5 ml-1">
                    <button 
                        onClick={() => setModalType('income')}
                        className="flex items-center justify-center gap-1.5 bg-[#166534] hover:bg-[#14532d] text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus size={16} strokeWidth={2.5} /> Add income
                    </button>
                    <button 
                        onClick={() => setModalType('expense')}
                        className="flex items-center justify-center gap-1.5 bg-[#e11d48] hover:bg-[#be123c] text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus size={16} strokeWidth={2.5} /> Add expense
                    </button>
                </div>
            </div>

            <TransactionModal 
                isOpen={modalType !== null} 
                onClose={() => setModalType(null)} 
                type={modalType || 'income'}
                onSaveIncome={handleAddIncome}
                onSaveExpense={handleAddExpense}
            />
        </div>
    );
}
