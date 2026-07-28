'use client';

import React, { useState, useEffect } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { getExpenses } from '../services/budgetStorage';

export default function SpendPaceChart() {
    const { userProfile } = useAuth();
    const [expenses, setExpenses] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getExpenses();
                setExpenses(data);
            } catch(e) {}
        };
        load();
        window.addEventListener('workout_os_budget_updated', load);
        return () => window.removeEventListener('workout_os_budget_updated', load);
    }, []);

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Generate the current week (Monday to Sunday)
    const last7Days: Date[] = [];
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;

    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - diffToMonday + i);
        d.setHours(12, 0, 0, 0);
        last7Days.push(d);
    }

    // Weekly Budget Pace (e.g. Monthly target / 4)
    const savedTarget = typeof window !== 'undefined' ? localStorage.getItem('workout_os_budget_target') : null;
    const monthlyTarget = savedTarget ? parseFloat(savedTarget) : 5000;
    const weeklyTarget = monthlyTarget / 4;

    // Calculate daily cumulative spend over these 7 days
    let weeklyTotal = 0;
    let runningTotal = 0;
    
    const chartData = last7Days.map((dateObj, index) => {
        const dateStr = `${dateObj.toLocaleString('en-US', { month: 'short' })} ${dateObj.getDate()}`;
        const dayExpenses = expenses.filter(e => e.date === dateStr);
        const daySpend = dayExpenses.reduce((sum, item) => sum + item.amount, 0);
        weeklyTotal += daySpend;
        runningTotal += daySpend;
        
        const budgetPace = (weeklyTarget / 6) * index;
        
        return { 
            date: dateStr, 
            spend: runningTotal,
            budgetPace: budgetPace
        };
    });

    const maxY = Math.max(weeklyTarget * 1.2, weeklyTotal * 1.2, 100);

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 h-full flex flex-col justify-between rounded-3xl shadow-sm transition-colors">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight mb-1">Weekly spend pace</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Cumulative spend vs. budget pace</p>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-[#8b5cf6] dark:bg-purple-400" />
                        <span>Actual</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0 border-t border-dashed border-gray-400 dark:border-gray-500" />
                        <span>Budget pace</span>
                    </div>
                </div>
            </div>

            <div className="w-full h-[200px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
                        <defs>
                            <linearGradient id="purpleGradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} 
                            dy={10}
                        />
                        <YAxis 
                            domain={[0, maxY]} 
                            axisLine={false} 
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                            tickFormatter={(value) => `₹${Math.round(value)}`}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                            itemStyle={{ color: '#8b5cf6' }}
                            formatter={(value: number, name: string) => {
                                if (name === 'spend') return [`₹${Math.round(value)}`, 'Cumulative Spend'];
                                if (name === 'budgetPace') return [`₹${Math.round(value)}`, 'Budget Pace'];
                                return [value, name];
                            }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="spend" 
                            stroke="#8b5cf6" 
                            fillOpacity={1} 
                            fill="url(#purpleGradient)" 
                            strokeWidth={2}
                            activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="budgetPace" 
                            stroke="#9ca3af" 
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                            dot={false}
                            activeDot={false}
                            name="budgetPace"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
