'use client';

import React, { useState } from 'react';
import { Plus, ChevronDown, Download } from 'lucide-react';
import TransactionModal from './TransactionModal';
import { addTransaction, IncomeItem, ExpenseItem } from '../services/budgetStorage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBudget } from '../contexts/BudgetContext';

export default function BudgetHeader() {
    const { t } = useLanguage();
    const { selectedMonth, setSelectedMonth } = useBudget();
    const [modalType, setModalType] = useState<'income' | 'expense' | null>(null);

    const [year, month] = selectedMonth.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, 1);
    const currentMonthStr = selectedDateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
    
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;

    const monthOptions = [];
    for(let i=0; i<12; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        monthOptions.push({ value: val, label });
    }

    const handleAddIncome = async (item: Omit<IncomeItem, 'id'>) => {
        await addTransaction(item, 'income');
    };

    const handleAddExpense = async (item: Omit<ExpenseItem, 'id'>) => {
        await addTransaction(item, 'expense');
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight drop-shadow-sm mb-1">
                    {t('budget.title')}
                </h1>
                <p className="text-sm text-on-surface-variant dark:text-on-surface-variant font-semibold">{currentMonthStr} • {t('budget.elapsedDays').replace('{currentDay}', currentDay.toString()).replace('{daysInMonth}', daysInMonth.toString())}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="appearance-none flex items-center gap-2 bg-card-white dark:bg-surface-container-high/80 hover:bg-surface-container-low dark:hover:bg-surface-container/80 text-on-surface-variant dark:text-on-surface px-4 py-2.5 pr-10 rounded-2xl text-sm font-bold transition-all shadow-sm border border-surface-variant/50 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-secondary/50 cursor-pointer"
                    >
                        {monthOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button className="flex items-center justify-center w-10 h-10 bg-card-white dark:bg-surface-container-high/80 hover:bg-surface-container-low dark:hover:bg-surface-container/80 text-on-surface-variant dark:text-on-surface rounded-2xl transition-all shadow-sm border border-surface-variant/50 dark:border-white/5 active:scale-95">
                    <Download size={18} className="text-on-surface-variant dark:text-on-surface-variant" />
                </button>
                <div className="flex items-center gap-2 ml-1">
                    <button 
                        onClick={() => setModalType('income')}
                        className="flex items-center justify-center gap-1.5 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] active:scale-95 border border-white/20/20 whitespace-nowrap"
                    >
                        <Plus size={16} strokeWidth={3} className="shrink-0" /> {t('budget.addIncome')}
                    </button>
                    <button 
                        onClick={() => setModalType('expense')}
                        className="flex items-center justify-center gap-1.5 bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-[0_4px_12px_rgba(225,29,72,0.3)] active:scale-95 border border-white/20/20 whitespace-nowrap"
                    >
                        <Plus size={16} strokeWidth={3} className="shrink-0" /> {t('budget.addExpense')}
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
