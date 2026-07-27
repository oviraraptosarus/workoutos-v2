'use client';

import React, { useState } from 'react';
import { IndianRupee, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function BudgetSnapshotCard() {
    const { userProfile } = useAuth();
    // Mock locally for now, as backend is ignored in this step
    const [spent] = useState(420); 

    const budget = userProfile?.monthlyBudget || 1200;
    const percentage = Math.min((spent / budget) * 100, 100);
    const left = Math.max(budget - spent, 0);
    
    // Simple spending pace check based on month progress
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const expectedPacePct = (today.getDate() / daysInMonth) * 100;
    const onTrack = percentage <= expectedPacePct;

    return (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#5e5ce6]">
                    <div className="p-1.5 rounded-full bg-[#5e5ce6]/10 shadow-sm border border-gray-100 dark:border-slate-800">
                        <IndianRupee size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">BUDGET PACE</span>
                </div>
                <Link
                    href="/budget-tracker"
                    className="text-xs font-semibold text-[#5e5ce6] hover:underline flex items-center gap-0.5 transition-colors"
                >
                    Details <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
            </div>

            <div className="my-3">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-gray-900 tracking-tight drop-shadow-sm">₹{spent.toLocaleString()}</span>
                    <span className="text-xs text-gray-600 font-medium">/ ₹{budget.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-50 h-2.5 rounded-full mt-2 overflow-hidden shadow-inner border border-gray-100 dark:border-slate-800">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(94,92,230,0.4)] ${onTrack ? 'bg-gradient-to-r from-[#5e5ce6] to-[#bf5af2]' : 'bg-gradient-to-r from-[#ff3b30] to-[#ff453a]'}`} 
                        style={{ width: `${percentage}%` }} 
                    />
                </div>
            </div>

            <div className="pt-3 border-t border-gray-100 text-xs text-gray-700 flex justify-between font-medium">
                <span>{onTrack ? 'On track for month' : 'Pacing a bit fast'}</span>
                <span className={`${onTrack ? 'text-[#5e5ce6]' : 'text-[#ff3b30]'} font-bold`}>₹{left.toLocaleString()} left</span>
            </div>
        </div>
    );
}
