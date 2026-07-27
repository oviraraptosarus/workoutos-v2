'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function CategoryBreakdown() {
    const categories = [
        { name: 'Groceries', actual: 672, limit: 900, color: 'bg-[#2e8555]' },
        { name: 'Supplements', actual: 186, limit: 400, color: 'bg-[#8b5cf6]' },
        { name: 'Gym & Equipment', actual: 150, limit: 150, color: 'bg-[#6366f1]' },
        { name: 'Eating out', actual: 348, limit: 300, color: 'bg-[#f59e0b]' },
        { name: 'Transport', actual: 198, limit: 250, color: 'bg-[#fb923c]' },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 h-full flex flex-col justify-between rounded-3xl shadow-sm transition-colors">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight mb-1">By category</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Budget vs. actual</p>
                </div>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">8 categories</span>
            </div>

            <div className="space-y-5 flex-1">
                {categories.map((cat) => {
                    const percentage = Math.min((cat.actual / cat.limit) * 100, 100);
                    return (
                        <div key={cat.name} className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-[11px] font-semibold">
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                                    <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                                </div>
                                <div className="font-mono">
                                    <span className="text-gray-900 dark:text-white">₹{cat.actual}</span>
                                    <span className="text-gray-400 dark:text-gray-500"> / ₹{cat.limit}</span>
                                </div>
                            </div>
                            <div className="w-full bg-[#f1f1f1] dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className={`${cat.color} h-full rounded-full`} style={{ width: `${percentage}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 text-center">
                <button className="flex items-center justify-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mx-auto transition-colors">
                    <ChevronDown size={14} /> Show 3 more categories
                </button>
            </div>
            
            <div className="mt-5 text-[9px] text-gray-400 dark:text-gray-500 font-medium pt-4 border-t border-gray-100 dark:border-slate-800">
                <span className="font-bold text-gray-600 dark:text-gray-300">Where it went this month:</span> Groceries (31%) • Eating out (16%) • Gym (7%) • Supplements (9%) • Other (37%)
            </div>
        </div>
    );
}
