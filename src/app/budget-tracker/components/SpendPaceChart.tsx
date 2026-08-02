'use client';

import React, { useState, useEffect } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { getExpenses } from '../services/budgetStorage';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SpendPaceChart() {
    const { t } = useLanguage();
    const { userProfile } = useAuth();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getExpenses();
                setExpenses(data);
            } catch(e) {}
        };
        load();
        // Listen to both the specific budget event AND the generic storage event
        // (Ava AI and other components dispatch 'storage' when they log expenses)
        window.addEventListener('workout_os_budget_updated', load);
        window.addEventListener('storage', load);
        return () => {
            window.removeEventListener('workout_os_budget_updated', load);
            window.removeEventListener('storage', load);
        };
    }, []);

    // Track theme so the recharts tooltip (inline-styled) matches dark mode.
    useEffect(() => {
        const check = () => setIsDark(document.documentElement.classList.contains('dark'));
        check();
        const obs = new MutationObserver(check);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
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

    // Use userProfile.monthlyBudget as the source of truth (falls back to localStorage, then 5000)
    const monthlyTarget = userProfile?.monthlyBudget
        || (typeof window !== 'undefined' ? parseFloat(localStorage.getItem('workout_os_budget_target') || '0') || 5000 : 5000);
    const weeklyTarget = monthlyTarget / 4.33; // average weeks per month

    // Calculate daily cumulative spend over these 7 days
    let weeklyTotal = 0;
    let runningTotal = 0;
    
    const chartData = last7Days.map((dateObj, index) => {
        // getExpenses() returns dates as ISO (YYYY-MM-DD). Build the same key to
        // match — the old code compared against "Aug 1"-style labels, so the
        // filter never matched and the chart was always empty.
        const isoKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        const label = `${dateObj.toLocaleString('en-US', { month: 'short' })} ${dateObj.getDate()}`;
        const dayExpenses = expenses.filter(e => e.date === isoKey);
        const daySpend = dayExpenses.reduce((sum, item) => sum + item.amount, 0);
        weeklyTotal += daySpend;
        runningTotal += daySpend;

        const budgetPace = (weeklyTarget / 6) * index;

        return {
            date: label,
            spend: runningTotal,
            budgetPace: budgetPace
        };
    });

    const maxY = Math.max(weeklyTarget * 1.2, weeklyTotal * 1.2, 100);

    return (
        <div className="bg-card-white  border border-surface-variant  p-6 h-full flex flex-col justify-between rounded-3xl shadow-sm transition-colors">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-bold text-on-surface dark:text-white tracking-tight mb-1">{t('budget.chart.title')}</h3>
                    <p className="text-[11px] text-on-surface-variant dark:text-on-surface-variant font-medium">{t('budget.chart.subtitle')}</p>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-semibold text-on-surface-variant dark:text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-[#8b5cf6] dark:bg-purple-400" />
                        <span>{t('budget.chart.actual')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0 border-t border-dashed border-gray-400 dark:border-gray-500" />
                        <span>{t('budget.chart.budgetPace')}</span>
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
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 'bold', backgroundColor: isDark ? '#1c1c1e' : '#ffffff', color: isDark ? '#ffffff' : '#1a1c1f' }}
                            itemStyle={{ color: '#8b5cf6' }}
                            labelStyle={{ color: isDark ? '#98989d' : '#45464c' }}
                            formatter={(value: number, name: string) => {
                                if (name === 'spend') return [`₹${Math.round(value)}`, t('budget.chart.tooltipCumulative')];
                                if (name === 'budgetPace') return [`₹${Math.round(value)}`, t('budget.chart.tooltipPace')];
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
