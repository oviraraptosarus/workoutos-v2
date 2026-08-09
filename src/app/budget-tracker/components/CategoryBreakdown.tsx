'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getExpenses, ExpenseItem } from '../services/budgetStorage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBudget } from '../contexts/BudgetContext';

export default function CategoryBreakdown() {
    const { t } = useLanguage();
    const { selectedMonth } = useBudget();
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const loadExpenses = async () => {
            setExpenses(await getExpenses(selectedMonth));
        };
        loadExpenses();
        window.addEventListener('workout_os_budget_updated', loadExpenses);
        return () => window.removeEventListener('workout_os_budget_updated', loadExpenses);
    }, [selectedMonth]);

    // Calculate aggregated data
    const categoryLimits: Record<string, number> = {
        [t('budget.groceries')]: 900,
        [t('budget.supplements')]: 400,
        [t('budget.gym')]: 150,
        [t('budget.eatingOut')]: 300,
        [t('budget.transport')]: 250
    };

    const categoryColors = [
        'bg-[#2e8555]', 'bg-[#8b5cf6]', 'bg-[#6366f1]', 'bg-[#f59e0b]', 'bg-[#fb923c]', 
        'bg-[#ec4899]', 'bg-[#14b8a6]', 'bg-[#06b6d4]'
    ];

    const aggregated = expenses.reduce((acc, curr) => {
        if (!acc[curr.category]) {
            acc[curr.category] = 0;
        }
        acc[curr.category] += curr.amount;
        return acc;
    }, {} as Record<string, number>);

    const categories = Object.keys(aggregated).map((name, index) => ({
        name,
        actual: aggregated[name],
        limit: categoryLimits[name] || Math.max(aggregated[name] * 1.5, 500),
        color: categoryColors[index % categoryColors.length]
    })).sort((a, b) => b.actual - a.actual); // Sort by highest spend

    const totalSpend = categories.reduce((sum, c) => sum + c.actual, 0);
    const top3 = categories.slice(0, 3);
    let summaryString = '';
    
    if (totalSpend > 0) {
        summaryString = top3.map(c => `${c.name} (${Math.round((c.actual / totalSpend) * 100)}%)`).join(' • ');
        if (categories.length > 3) {
            const otherActual = categories.slice(3).reduce((sum, c) => sum + c.actual, 0);
            summaryString += ` • ${t('budget.category.other')} (${Math.round((otherActual / totalSpend) * 100)}%)`;
        }
    }

    const displayedCategories = showAll ? categories : categories.slice(0, 5);

    return (
        <div className="glass-card-premium p-4 sm:p-5 h-full flex flex-col justify-between transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-black text-on-surface dark:text-on-surface tracking-tight mb-0.5 drop-shadow-sm">{t('budget.category.title')}</h3>
                    <p className="text-xs text-on-surface-variant dark:text-on-surface-variant font-semibold">{t('budget.category.subtitle')}</p>
                </div>
                <span className="text-[11px] font-bold text-on-surface-variant dark:text-on-surface-variant bg-surface-container dark:bg-surface-container-high px-2 py-1 rounded-full">
                    {t('budget.category.count').replace('{count}', categories.length.toString())}
                </span>
            </div>

            <div className="space-y-4 flex-1">
                {displayedCategories.length > 0 ? displayedCategories.map((cat) => {
                    const percentage = Math.min((cat.actual / cat.limit) * 100, 100);
                    return (
                        <div key={cat.name} className="flex flex-col gap-2 group animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${cat.color} shadow-sm group-hover:scale-125 transition-transform`} />
                                    <span className="text-on-surface-variant dark:text-on-surface-variant">{cat.name}</span>
                                </div>
                                <div className="tracking-tight">
                                    <span className="text-on-surface dark:text-on-surface">₹{cat.actual.toFixed(2).replace(/\.00$/, '')}</span>
                                    <span className="text-on-surface-variant dark:text-on-surface-variant"> / ₹{cat.limit}</span>
                                </div>
                            </div>
                            <div className="w-full bg-surface-container dark:bg-surface-container-high/50 h-2 rounded-full overflow-hidden shadow-inner">
                                <div className={`${cat.color} h-full rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }} />
                            </div>
                        </div>
                    );
                }) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-on-surface-variant dark:text-on-surface-variant gap-2">
                        <span className="text-sm font-bold">{t('budget.category.noExpenses')}</span>
                        <span className="text-xs font-medium text-center max-w-[200px]">{t('budget.category.noExpensesDesc')}</span>
                    </div>
                )}
            </div>

            {categories.length > 5 && (
                <div className="mt-8 text-center">
                    <button 
                        onClick={() => setShowAll(!showAll)}
                        className="flex items-center justify-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface-variant dark:text-on-surface-variant dark:hover:text-on-surface-variant mx-auto transition-colors bg-surface-container-low dark:bg-surface-container-high/50 hover:bg-surface-container dark:hover:bg-surface-container-high px-4 py-2 rounded-full"
                    >
                        <ChevronDown size={14} strokeWidth={2.5} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} /> 
                        {showAll ? t('budget.category.showLess') : t('budget.category.showMore').replace('{count}', (categories.length - 5).toString())}
                    </button>
                </div>
            )}
            
            {summaryString && (
                <div className="mt-6 text-[10px] text-on-surface-variant dark:text-on-surface-variant font-medium pt-5 border-t border-surface-variant/50 leading-relaxed">
                    <span className="font-bold text-on-surface-variant dark:text-on-surface-variant tracking-wide uppercase mr-1">{t('budget.category.summary')}</span> {summaryString}
                </div>
            )}
        </div>
    );
}
