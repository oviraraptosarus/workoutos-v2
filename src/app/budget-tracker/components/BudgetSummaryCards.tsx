'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, TrendingDown, Calculator } from 'lucide-react';
import { getIncome, getExpenses, IncomeItem, ExpenseItem } from '../services/budgetStorage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBudget } from '../contexts/BudgetContext';

export default function BudgetSummaryCards() {
    const { t } = useLanguage();
    const { selectedMonth } = useBudget();
    const [income, setIncome] = useState<IncomeItem[]>([]);
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

    useEffect(() => {
        const load = async () => {
            setIncome(await getIncome(selectedMonth));
            setExpenses(await getExpenses(selectedMonth));
        };
        load();
        
        window.addEventListener('workout_os_budget_updated', load);
        return () => window.removeEventListener('workout_os_budget_updated', load);
    }, [selectedMonth]);

    const totalIncome = income.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(0) : 0;

    const expenseRatio = totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(0) : 0;
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;

    const daysInMonth = new Date(year, month, 0).getDate();
    const dayOfMonth = isCurrentMonth ? today.getDate() : daysInMonth;
    const monthPct = Math.round((dayOfMonth / daysInMonth) * 100);

    // We'll also calculate a projected ratio for the progress bar
    const projectedRatio = totalIncome > 0 
        ? (( (totalExpenses / (dayOfMonth || 1)) * daysInMonth ) / totalIncome * 100).toFixed(0) 
        : 0;

    // Spending is "on track" when the share of income spent has not outrun the
    // share of the month that has passed.
    const onTrack = Number(expenseRatio) <= monthPct;

    // Straight-line projection from actual spend-per-day so far. Suppressed for
    // the first few days of a month, where one purchase extrapolates to a wild
    // and misleading month-end figure.
    const projectionReliable = dayOfMonth >= 5;
    const projectedTotal = dayOfMonth > 0
        ? Math.round((totalExpenses / dayOfMonth) * daysInMonth)
        : totalExpenses;


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-1 mb-2">
                    <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                        <TrendingDown size={16} className="rotate-180 text-emerald-500" /> {t('budget.cards.totalIncome')}
                    </h2>
                </div>
            <div className="glass-card-premium p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] h-full">
                
                <div>
                    <div className="text-4xl font-black text-on-surface tracking-tight leading-none mb-2">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-on-surface-variant dark:text-on-surface-variant font-semibold">{t('budget.cards.incomeStreams').replace('{count}', income.length.toString())}</div>
                </div>
            </div>
            </div>

            {/* Card 2: Total Expenses */}
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-1 mb-2">
                    <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                        <TrendingDown size={16} className="text-rose-500" /> {t('budget.cards.totalExpenses')}
                    </h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-sm ${
                        onTrack
                            ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-100/50 text-rose-700 border-rose-200'
                    }`}>
                        {onTrack ? t('budget.cards.onTrack') : t('budget.cards.overPace')}
                    </span>
                </div>
            <div className="glass-card-premium p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] relative overflow-hidden h-full">
                
                <div className="relative z-10">
                    <div className="text-4xl font-black text-on-surface tracking-tight leading-none mb-4">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    
                    <div className="flex justify-between text-[11px] text-on-surface-variant dark:text-on-surface-variant font-bold mb-2">
                        <span>{expenseRatio}{t('budget.cards.ofIncome')}</span>
                        <span>{monthPct}{t('budget.cards.ofMonth')}</span>
                    </div>
                    <div className="w-full bg-surface-container dark:bg-surface-container-high/50 h-2 rounded-full overflow-hidden mb-3 shadow-inner relative">
                        {/* Projected spend ghost bar */}
                        {projectionReliable && (
                            <div className="bg-rose-200 dark:bg-rose-900/60 h-full rounded-full transition-all duration-1000 ease-out absolute left-0 top-0 z-0" style={{ width: `${Math.min(Number(projectedRatio), 100)}%` }} />
                        )}
                        {/* Actual spend solid bar */}
                        <div className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full transition-all duration-1000 ease-out absolute left-0 top-0 z-10" style={{ width: `${Math.min(Number(expenseRatio), 100)}%` }} />
                    </div>
                    <div className="text-[11px] text-on-surface-variant dark:text-on-surface-variant font-medium">
                        {projectionReliable ? (
                            <>{t('budget.cards.projected')} <span className="text-on-surface dark:text-gray-200 font-bold">₹{projectedTotal.toLocaleString('en-IN')}</span></>
                        ) : (
                            <>{t('budget.cards.projectionMsg').replace('{day}', dayOfMonth.toString()).replace('{total}', daysInMonth.toString())}</>
                        )}
                    </div>
                </div>
            </div>
            </div>


            {/* Card 3: Net Savings */}
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-1 mb-2">
                    <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                        <Calculator size={16} className="text-[#0a84ff]" /> {t('budget.cards.netSavings')}
                    </h2>
                </div>
            <div className="glass-card-premium p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] h-full">
                <div>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-emerald-400 dark:from-emerald-400 dark:to-emerald-200 tracking-tight leading-none mb-2">₹{netSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-on-surface-variant dark:text-on-surface-variant font-semibold">{savingsRate}{t('budget.cards.savingsRate')}</div>
                </div>
            </div>
            </div>
        </div>
    );
}
