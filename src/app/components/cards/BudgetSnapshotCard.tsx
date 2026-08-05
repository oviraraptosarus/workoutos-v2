'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function BudgetSnapshotCard() {
    const { userProfile } = useAuth();
    const { t } = useLanguage();
    const [spent, setSpent] = useState(0);
    const [income, setIncome] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Reads the same Supabase rows as /budget-tracker. This card previously
        // read localStorage, so it showed "no expenses" while the budget page
        // showed real totals.
        const load = async () => {
            const { getExpenses, getIncome } = await import('@/app/budget-tracker/services/budgetStorage');
            const [expenses, incomes] = await Promise.all([getExpenses(), getIncome()]);

            const now = new Date();
            const y = now.getFullYear();
            const m = now.getMonth();
            const inThisMonth = (d: string) => {
                const dt = new Date(d);
                return dt.getFullYear() === y && dt.getMonth() === m;
            };

            setSpent(expenses.filter(e => inThisMonth(e.date)).reduce((a, c) => a + c.amount, 0));

            const loggedIncome = incomes.filter(i => inThisMonth(i.date)).reduce((a, c) => a + c.amount, 0);
            setIncome(loggedIncome || userProfile?.monthlyIncome || 0);
            setLoading(false);
        };

        load();
        window.addEventListener('storage', load);
        window.addEventListener('workout_os_budget_updated', load);
        return () => {
            window.removeEventListener('storage', load);
            window.removeEventListener('workout_os_budget_updated', load);
        };
    }, [userProfile]);

    const pct = income > 0 ? Math.min((spent / income) * 100, 100) : 0;
    const left = Math.max(income - spent, 0);

    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const expectedPacePct = (today.getDate() / daysInMonth) * 100;
    const onTrack = pct <= expectedPacePct;

    return (
        <Link
            href="/budget-tracker"
            className="bg-card-white dark:bg-surface-container-lowest rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/5 flex flex-col relative overflow-hidden active:scale-[0.98] transition-transform block"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">{t('dash.budget')}</span>
                </div>
                <ChevronRight size={18} className="text-on-surface-variant/50" />
            </div>

            {loading ? (
                <div className="h-12 flex items-center">
                    <div className="h-6 w-28 rounded-full bg-surface-container animate-pulse" />
                </div>
            ) : spent === 0 && income === 0 ? (
                <div className="flex items-center justify-between gap-3">
                    <p className="font-body-md text-on-surface-variant">Nothing logged</p>
                    <span className="font-label-md text-label-md text-on-primary bg-primary px-3.5 py-2 rounded-full shrink-0">
                        {t('dash.add')}
                    </span>
                </div>
            ) : (
                <>
                    <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-baseline gap-1.5 min-w-0">
                            <span className="font-headline-lg text-headline-lg text-on-surface tracking-tight tabular-nums">
                                ₹{spent.toLocaleString()}
                            </span>
                            {income > 0 && (
                                <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                                    of ₹{income.toLocaleString()}
                                </span>
                            )}
                        </div>
                        {income > 0 && (
                            <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full shrink-0 ${onTrack ? 'bg-activity-green/10 text-activity-green' : 'bg-error-container text-on-error-container'}`}>
                                {onTrack ? 'On track' : 'Over pace'}
                            </span>
                        )}
                    </div>

                    {income > 0 && (
                        <>
                            <div className="relative w-full bg-surface-container h-2 rounded-full mt-3 overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${onTrack ? 'bg-activity-green' : 'bg-activity-red'}`}
                                    style={{ width: `${pct}%`, transition: 'width 600ms cubic-bezier(0.32,0.72,0,1)' }}
                                />
                                {/* Pace marker: where spending should be by today. */}
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-on-surface/30"
                                    style={{ left: `${Math.min(expectedPacePct, 100)}%` }}
                                    aria-hidden="true"
                                />
                            </div>
                            <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                                ₹{left.toLocaleString()} remaining · day {today.getDate()} of {daysInMonth}
                            </p>
                        </>
                    )}
                </>
            )}
        </Link>
    );
}
