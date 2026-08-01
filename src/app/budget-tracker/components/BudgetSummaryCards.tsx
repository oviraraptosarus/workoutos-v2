'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, TrendingDown, Calculator } from 'lucide-react';
import { getIncome, getExpenses, IncomeItem, ExpenseItem } from '../services/budgetStorage';

export default function BudgetSummaryCards() {
    const [income, setIncome] = useState<IncomeItem[]>([]);
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

    useEffect(() => {
        const load = async () => {
            setIncome(await getIncome());
            setExpenses(await getExpenses());
        };
        load();
        
        window.addEventListener('workout_os_budget_updated', load);
        return () => window.removeEventListener('workout_os_budget_updated', load);
    }, []);

    const totalIncome = income.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(0) : 0;

    const expenseRatio = totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(0) : 0;

    // Real month pace, replacing a hardcoded "84% of month".
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const monthPct = Math.round((dayOfMonth / daysInMonth) * 100);

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

    // Protein metrics logic
    const proteinExpenses = expenses.filter(e => e.protein && e.costPerG);
    let avgCostPerG = 0;
    let totalG = 0;
    let totalProteinSpend = 0;
    if (proteinExpenses.length > 0) {
        totalG = proteinExpenses.reduce((acc, curr) => acc + (curr.protein || 0), 0);
        totalProteinSpend = proteinExpenses.reduce((acc, curr) => acc + curr.amount, 0);
        avgCostPerG = totalProteinSpend / totalG;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Card 1: Total Income */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-white/5 p-6 flex flex-col justify-between rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-800/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
                            <TrendingDown size={16} className="rotate-180" />
                        </div>
                        <span className="text-xs font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">Total Income</span>
                    </div>
                </div>
                
                <div>
                    <div className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">From {income.length} income streams</div>
                </div>
            </div>

            {/* Card 2: Total Expenses */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-white/5 p-6 flex flex-col justify-between rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/40 dark:to-rose-800/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
                            <TrendingDown size={16} />
                        </div>
                        <span className="text-xs font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">Total Expenses</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${
                        onTrack
                            ? 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50'
                            : 'bg-rose-100/50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/50'
                    }`}>
                        {onTrack ? 'On track' : 'Over pace'}
                    </span>
                </div>
                
                <div className="relative z-10">
                    <div className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-4">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    
                    <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 font-bold mb-2">
                        <span>{expenseRatio}% of income</span>
                        <span>{monthPct}% of month</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800/50 h-2 rounded-full overflow-hidden mb-3 shadow-inner">
                        <div className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${expenseRatio}%` }} />
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                        {projectionReliable ? (
                            <>Projected total: <span className="text-gray-900 dark:text-gray-200 font-bold">₹{projectedTotal.toLocaleString('en-IN')}</span></>
                        ) : (
                            <>Day {dayOfMonth} of {daysInMonth} — projection available from day 5</>
                        )}
                    </div>
                </div>
            </div>

            {/* Card 3: Net Savings */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-white/5 p-6 flex flex-col justify-between rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                            <Calculator size={16} />
                        </div>
                        <span className="text-xs font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">Net Savings</span>
                    </div>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-emerald-400 dark:from-emerald-400 dark:to-emerald-200 tracking-tight leading-none mb-2">₹{netSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{savingsRate}% savings rate</div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-widest uppercase mb-1.5">Cost Per Gram Protein</div>
                    <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-purple-400 dark:from-purple-400 dark:to-purple-200 drop-shadow-sm">₹{avgCostPerG.toFixed(3)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">/g</span>
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{totalG}g purchased • ₹{totalProteinSpend.toFixed(0)} spent</div>
                </div>
            </div>
        </div>
    );
}
