'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { getIncome, saveIncome, IncomeItem } from '../services/budgetStorage';

export default function IncomeTable() {
    const [income, setIncome] = useState<IncomeItem[]>([]);
    const [highlight, setHighlight] = useState(false);
    
    useEffect(() => {
        const load = () => setIncome(getIncome());
        load();
        
        window.addEventListener('workout_os_budget_updated', load);
        
        const handleHighlight = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.target === 'budget_income') {
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

    const totalIncome = income.reduce((acc, curr) => acc + curr.amount, 0);

    const handleDelete = (id: string) => {
        const newIncome = income.filter(i => i.id !== id);
        setIncome(newIncome);
        saveIncome(newIncome);
    };

    return (
        <div className={`bg-white dark:bg-slate-900 border ${highlight ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'border-gray-100 dark:border-slate-800'} p-6 rounded-3xl shadow-sm transition-all duration-500`}>
            <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight mb-1">Income log</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{income.length} entries • Total: <span className="font-bold text-[#166534] dark:text-emerald-400">₹{totalIncome.toFixed(2)}</span></p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-[320px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search income streams..." 
                        className="w-full bg-[#f4f3f0] dark:bg-slate-800 border-none rounded-full pl-9 pr-4 py-2 text-[11px] font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[#e6e2da] dark:focus:ring-slate-600 focus:outline-none transition-shadow placeholder:text-gray-500"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                        <Filter size={14} />
                    </button>
                    <select className="bg-[#f4f3f0] dark:bg-slate-800 border-none rounded-full px-4 py-2 text-[11px] font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e6e2da] dark:focus:ring-slate-600 appearance-none cursor-pointer">
                        <option>All sources</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                    <thead>
                        <tr className="bg-[#f8f7f5] dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 font-semibold tracking-wide uppercase border-b border-gray-100 dark:border-slate-800">
                            <th className="py-3 px-4 rounded-tl-xl whitespace-nowrap">Date</th>
                            <th className="py-3 px-4 whitespace-nowrap">Description</th>
                            <th className="py-3 px-4 whitespace-nowrap">Source</th>
                            <th className="py-3 px-4 whitespace-nowrap text-right">Amount</th>
                            <th className="py-3 px-4 rounded-tr-xl whitespace-nowrap text-right">Type</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-gray-700 dark:text-gray-300 font-medium">
                        {income.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="py-4 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{item.date}</td>
                                <td className="py-4 px-4 whitespace-nowrap font-semibold text-gray-900 dark:text-white">{item.description}</td>
                                <td className="py-4 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{item.source}</td>
                                <td className="py-4 px-4 whitespace-nowrap text-right font-mono font-bold text-[#166534] dark:text-emerald-400">
                                    +₹{item.amount.toFixed(2)}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap text-right">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border ${
                                        item.type === 'recurring' 
                                        ? 'bg-[#eff6ff] dark:bg-blue-900/30 text-[#1d4ed8] dark:text-blue-400 border-blue-100 dark:border-blue-800/50' 
                                        : item.type === 'passive'
                                        ? 'bg-[#f0fdf4] dark:bg-emerald-900/30 text-[#15803d] dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50'
                                        : 'bg-[#f3f4f6] dark:bg-slate-800 text-[#4b5563] dark:text-gray-300 border-gray-200 dark:border-slate-700'
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
                        <option>10 per page</option>
                    </select>
                    <span>of {income.length} entries</span>
                </div>
                <div className="flex items-center gap-1">
                    <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors">
                        <ChevronLeft size={14} />
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center rounded-full bg-[#166534] text-white font-bold shadow-sm">
                        1
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors">
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
