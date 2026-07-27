'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, TrendingDown, Calculator } from 'lucide-react';
import { getIncome, getExpenses, IncomeItem, ExpenseItem } from '../services/budgetStorage';

export default function BudgetSummaryCards() {
    const [income, setIncome] = useState<IncomeItem[]>([]);
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

    useEffect(() => {
        const load = () => {
            setIncome(getIncome());
            setExpenses(getExpenses());
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
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 flex flex-col justify-between rounded-3xl shadow-sm transition-colors">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                            <TrendingDown size={14} className="rotate-180" />
                        </div>
                        <span className="text-xs font-semibold tracking-wide uppercase">Total Income</span>
                    </div>
                </div>
                
                <div>
                    <div className="text-[32px] font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-2">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">From {income.length} income streams</div>
                </div>
            </div>

            {/* Card 2: Total Expenses */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 flex flex-col justify-between rounded-3xl shadow-sm transition-colors">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50">
                            <TrendingDown size={14} />
                        </div>
                        <span className="text-xs font-semibold tracking-wide uppercase">Total Expenses</span>
                    </div>
                    <span className="bg-[#f0fdf4] dark:bg-emerald-900/30 text-[#166534] dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#bbf7d0] dark:border-emerald-800/50">
                        On track
                    </span>
                </div>
                
                <div>
                    <div className="text-[32px] font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-4">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    
                    <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1.5">
                        <span>{expenseRatio}% of income</span>
                        <span>84% of month</span>
                    </div>
                    <div className="w-full bg-[#f1f1f1] dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                        <div className="bg-[#e11d48] dark:bg-rose-500 h-full rounded-full" style={{ width: `${expenseRatio}%` }} />
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Projected total: <span className="text-gray-900 dark:text-gray-200 font-semibold">₹{(totalExpenses * 1.15).toLocaleString('en-IN')}</span></div>
                </div>
            </div>

            {/* Card 3: Net Savings */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 flex flex-col justify-between rounded-3xl shadow-sm transition-colors">
                <div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
                        <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                            <Calculator size={14} />
                        </div>
                        <span className="text-xs font-semibold tracking-wide uppercase">Net Savings</span>
                    </div>
                    <div className="text-[32px] font-bold text-[#166534] dark:text-emerald-400 tracking-tight leading-none mb-1">₹{netSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{savingsRate}% savings rate</div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold tracking-wide uppercase mb-1">Cost Per Gram Protein</div>
                    <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-xl font-bold text-[#8b5cf6] dark:text-purple-400">₹{avgCostPerG.toFixed(3)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">/g</span>
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{totalG}g purchased • ₹{totalProteinSpend.toFixed(0)} spent on protein foods</div>
                </div>
            </div>
        </div>
    );
}
