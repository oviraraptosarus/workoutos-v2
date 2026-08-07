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
            {/* Card 1: Total Income */}
            <div className="bg-card-white backdrop-blur-xl border border-surface-variant p-4 sm:p-5 flex flex-col justify-between rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-on-surface-variant dark:text-on-surface-variant">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-800/20 flex items-center justify-center text-white dark:text-white shadow-inner">
                            <TrendingDown size={16} className="rotate-180" />
                        </div>
                        <span className="text-xs font-bold tracking-wider uppercase text-on-surface-variant dark:text-on-surface-variant">{t('budget.cards.totalIncome')}</span>
                    </div>
                </div>
                
                <div>
                    <div className="text-4xl font-black text-on-surface dark:text-white tracking-tight leading-none mb-2">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-on-surface-variant dark:text-on-surface-variant font-semibold">{t('budget.cards.incomeStreams').replace('{count}', income.length.toString())}</div>
                </div>
            </div>

            {/* Card 2: Total Expenses */}
            <div className="bg-card-white backdrop-blur-xl border border-surface-variant p-4 sm:p-5 flex flex-col justify-between rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2 text-on-surface-variant dark:text-on-surface-variant">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/40 dark:to-rose-800/20 flex items-center justify-center text-white dark:text-white shadow-inner">
                            <TrendingDown size={16} />
                        </div>
                        <span className="text-xs font-bold tracking-wider uppercase text-on-surface-variant dark:text-on-surface-variant">{t('budget.cards.totalExpenses')}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${
                        onTrack
                            ? 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-white border-white/10/50 dark:border-emerald-800/50'
                            : 'bg-rose-100/50 dark:bg-rose-900/30 text-rose-700 dark:text-white border-white/10/50 dark:border-rose-800/50'
                    }`}>
                        {onTrack ? t('budget.cards.onTrack') : t('budget.cards.overPace')}
                    </span>
                </div>
                
                <div className="relative z-10">
                    <div className="text-4xl font-black text-on-surface dark:text-white tracking-tight leading-none mb-4">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    
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

            {/* Card 3: Net Savings */}
            <div className="bg-card-white backdrop-blur-xl border border-surface-variant p-4 sm:p-5 flex flex-col justify-between rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div>
                    <div className="flex items-center gap-2 text-on-surface-variant dark:text-on-surface-variant mb-4">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 flex items-center justify-center text-white dark:text-white shadow-inner">
                            <Calculator size={16} />
                        </div>
                        <span className="text-xs font-bold tracking-wider uppercase text-on-surface-variant dark:text-on-surface-variant">{t('budget.cards.netSavings')}</span>
                    </div>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-emerald-400 dark:from-emerald-400 dark:to-emerald-200 tracking-tight leading-none mb-2">₹{netSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-on-surface-variant dark:text-on-surface-variant font-semibold">{savingsRate}{t('budget.cards.savingsRate')}</div>
                </div>
            </div>
        </div>
    );
}
