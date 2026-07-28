'use client';

import React, { useState } from 'react';
import { Plus, ChevronDown, Download } from 'lucide-react';
import TransactionModal from './TransactionModal';
import { getIncome, saveIncome, getExpenses, saveExpenses } from '../services/budgetStorage';

export default function BudgetHeader() {
    const [modalType, setModalType] = useState<'income' | 'expense' | null>(null);

    const today = new Date();
    const currentMonthStr = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    const handleAddIncome = async (item: any) => {
        const income = await getIncome();
        const newItem = { ...item, id: Date.now().toString() };
        await saveIncome([...income, newItem]);
    };

    const handleAddExpense = async (item: any) => {
        const expenses = await getExpenses();
        const newItem = { ...item, id: Date.now().toString() };
        await saveExpenses([...expenses, newItem]);
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight drop-shadow-sm mb-1">
                    Budget Tracker
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">{currentMonthStr} • {currentDay} of {daysInMonth} days elapsed</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <button className="flex items-center gap-2 bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-700/80 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm border border-gray-200/50 dark:border-white/5 active:scale-95">
                    {currentMonthStr} <ChevronDown size={16} className="text-gray-400" />
                </button>
                <button className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-700/80 text-gray-700 dark:text-gray-200 rounded-2xl transition-all shadow-sm border border-gray-200/50 dark:border-white/5 active:scale-95">
                    <Download size={18} className="text-gray-500 dark:text-gray-400" />
                </button>
                <div className="flex items-center gap-2 ml-1">
                    <button 
                        onClick={() => setModalType('income')}
                        className="flex items-center justify-center gap-1.5 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] active:scale-95 border border-emerald-400/20 whitespace-nowrap"
                    >
                        <Plus size={16} strokeWidth={3} className="shrink-0" /> Add income
                    </button>
                    <button 
                        onClick={() => setModalType('expense')}
                        className="flex items-center justify-center gap-1.5 bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-[0_4px_12px_rgba(225,29,72,0.3)] active:scale-95 border border-rose-400/20 whitespace-nowrap"
                    >
                        <Plus size={16} strokeWidth={3} className="shrink-0" /> Add expense
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
