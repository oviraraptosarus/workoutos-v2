'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { getExpenses, saveExpenses, ExpenseItem } from '../services/budgetStorage';

export default function ExpenseTable() {
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
    const [highlight, setHighlight] = useState(false);
    
    useEffect(() => {
        const load = async () => setExpenses(await getExpenses());
        load();
        
        window.addEventListener('workout_os_budget_updated', load);
        
        const handleHighlight = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.target === 'budget_expense') {
                setHighlight(true);
                setTimeout(() => setHighlight(false), 2000);
            }
        };
        window.addEventListener('workout_os_highlight', handleHighlight);

        return () => {
            window.removeEventListener('workout_os_budget_updated', load);
            window.removeEventListener('workout_os_highlight', handleHighlight);
        };
    }, []);

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const handleDelete = (id: string) => {
        const newExpenses = expenses.filter(i => i.id !== id);
        setExpenses(newExpenses);
        saveExpenses(newExpenses);
    };

    return (
        <div className={`bg-white dark:bg-slate-900 border ${highlight ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'border-gray-100 dark:border-slate-800'} p-6 rounded-3xl shadow-sm transition-all duration-500`}>
            <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight mb-1">Expense log</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{expenses.length} entries • Total: <span className="font-bold text-gray-900 dark:text-gray-200">₹{totalExpenses.toFixed(2)}</span></p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-[320px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search expenses..." 
                        className="w-full bg-[#f4f3f0] dark:bg-slate-800 border-none rounded-full pl-9 pr-4 py-2 text-[11px] font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[#e6e2da] dark:focus:ring-slate-600 focus:outline-none transition-shadow placeholder:text-gray-500"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                        <Filter size={14} />
                    </button>
                    <select className="bg-[#f4f3f0] dark:bg-slate-800 border-none rounded-full px-4 py-2 text-[11px] font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e6e2da] dark:focus:ring-slate-600 appearance-none cursor-pointer">
                        <option>All categories</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                    <thead>
                        <tr className="bg-[#f8f7f5] dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 font-semibold tracking-wide uppercase border-b border-gray-100 dark:border-slate-800">
                            <th className="py-3 px-4 rounded-tl-xl whitespace-nowrap">Date</th>
                            <th className="py-3 px-4 whitespace-nowrap">Description</th>
                            <th className="py-3 px-4 whitespace-nowrap">Category</th>
                            <th className="py-3 px-4 whitespace-nowrap text-right">Amount</th>
                            <th className="py-3 px-4 whitespace-nowrap text-right">Protein (g)</th>
                            <th className="py-3 px-4 whitespace-nowrap text-right">₹/g Protein</th>
                            <th className="py-3 px-4 rounded-tr-xl whitespace-nowrap">Type</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-gray-700 dark:text-gray-300 font-medium">
                        {expenses.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="py-4 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{item.date}</td>
                                <td className="py-4 px-4 whitespace-nowrap font-semibold text-gray-900 dark:text-white">{item.description}</td>
                                <td className="py-4 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{item.category}</td>
                                <td className="py-4 px-4 whitespace-nowrap text-right font-mono font-bold text-gray-900 dark:text-white">
                                    ₹{item.amount.toFixed(2)}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap text-right text-gray-500 dark:text-gray-400">
                                    {item.protein ? `${item.protein}g` : '—'}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap text-right font-mono text-[#8b5cf6] dark:text-purple-400 font-semibold">
                                    {item.costPerG ? `₹${item.costPerG.toFixed(3)}` : '—'}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                                        item.type === 'splurge' 
                                        ? 'bg-[#ffe4e6] dark:bg-rose-900/30 text-[#e11d48] dark:text-rose-400 border border-rose-100 dark:border-rose-800/50' 
                                        : 'bg-[#d1fae5] dark:bg-emerald-900/30 text-[#059669] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50'
                                    }`}>
                                        {item.type}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-slate-800 pt-4">
                <div className="flex items-center gap-2">
                    <span>Show</span>
                    <select className="bg-[#f4f3f0] dark:bg-slate-800 border-none rounded-full px-3 py-1.5 focus:outline-none dark:text-gray-300">
                        <option>All</option>
                    </select>
                    <span>of {expenses.length} entries</span>
                </div>
                <div className="flex items-center gap-1">
                    <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors">
                        <ChevronLeft size={14} />
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center rounded-full bg-[#2e8555] text-white font-bold shadow-sm">
                        1
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors dark:text-gray-300">
                        2
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors">
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
