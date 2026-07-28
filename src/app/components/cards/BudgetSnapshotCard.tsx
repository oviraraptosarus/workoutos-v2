'use client';

import React, { useState, useEffect } from 'react';
import { IndianRupee, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const BUDGET_KEY = 'workout_os_budget_spent';

export default function BudgetSnapshotCard() {
    const { userProfile } = useAuth();
    const [spent, setSpent] = useState(0);
    const [incomeTarget, setIncomeTarget] = useState(1200);

    useEffect(() => {
        const load = () => {
            const saved = localStorage.getItem(BUDGET_KEY);
            setSpent(saved ? parseFloat(saved) : 0);
        };
        load();
        
        const loadTarget = () => {
            const savedTarget = localStorage.getItem('workout_os_budget_target');
            if (savedTarget) {
                setIncomeTarget(parseFloat(savedTarget));
            } else {
                // If no manual override, calculate from total logged incomes
                try {
                    const incomes = JSON.parse(localStorage.getItem('workout_os_budget_income') || '[]');
                    const totalIncome = incomes.reduce((sum: number, item: any) => sum + item.amount, 0);
                    setIncomeTarget(totalIncome);
                } catch(e) {
                    setIncomeTarget(0);
                }
            }
        };
        loadTarget();

        window.addEventListener('storage', load);
        window.addEventListener('workout_os_budget_updated', load);
        window.addEventListener('workout_os_budget_updated', loadTarget);
        return () => {
            window.removeEventListener('storage', load);
            window.removeEventListener('workout_os_budget_updated', load);
            window.removeEventListener('workout_os_budget_updated', loadTarget);
        };
    }, [userProfile]);

    const handleEditBudget = () => {
        const newBudget = window.prompt("Enter your Monthly Income:", incomeTarget.toString());
        if (newBudget !== null && !isNaN(parseFloat(newBudget)) && parseFloat(newBudget) > 0) {
            const val = parseFloat(newBudget);
            setIncomeTarget(val);
            localStorage.setItem('workout_os_budget_target', val.toString());
            window.dispatchEvent(new Event('workout_os_budget_updated'));
        }
    };

    const budget = incomeTarget;
    const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const left = Math.max(budget - spent, 0);

    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const expectedPacePct = (today.getDate() / daysInMonth) * 100;
    const onTrack = percentage <= expectedPacePct;
    const hasData = spent > 0;

    return (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#5e5ce6]">
                    <div className="p-1.5 rounded-full bg-[#5e5ce6]/10 border border-gray-100">
                        <IndianRupee size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">INCOME TRACKER</span>
                </div>
                <Link
                    href="/budget-tracker"
                    className="text-xs font-semibold text-[#5e5ce6] hover:underline flex items-center gap-0.5"
                >
                    Details <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
            </div>

            {hasData ? (
                <>
                    <div className="my-3">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-gray-900 tracking-tight">₹{spent.toLocaleString()}</span>
                            <span 
                                onClick={handleEditBudget}
                                className="text-xs text-gray-500 font-medium cursor-pointer hover:text-[#5e5ce6] transition-colors hover:underline"
                                title="Click to edit monthly income"
                            >
                                / ₹{budget.toLocaleString()}
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full mt-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${onTrack ? 'bg-gradient-to-r from-[#5e5ce6] to-[#bf5af2]' : 'bg-gradient-to-r from-[#ff3b30] to-[#ff453a]'}`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                    <div className="pt-3 border-t border-gray-100 text-xs flex justify-between font-medium">
                        <span className="text-gray-500">Savings Potential:</span>
                        <span className="font-bold text-[#5e5ce6]">₹{left.toLocaleString()} remaining</span>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-2">
                    <p className="text-xs text-gray-400 font-medium">No expenses logged</p>
                    <Link href="/budget-tracker" className="text-xs font-bold text-[#5e5ce6] bg-[#5e5ce6]/10 px-3 py-1.5 rounded-full hover:bg-[#5e5ce6]/20 transition-colors">
                        + Log Expense
                    </Link>
                </div>
            )}
        </div>
    );
}
