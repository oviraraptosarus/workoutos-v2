'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Moon, ArrowLeft, History, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SleepPage() {
    const { userProfile } = useAuth();
    const { selectedDate, isToday } = useDate();
    const [currentSleep, setCurrentSleep] = useState(0);
    const [customSleep, setCustomSleep] = useState('8');
    const [chartData, setChartData] = useState<any[]>([]);
    const [isClient, setIsClient] = useState(false);
    
    // Quick Logs History
    const [logs, setLogs] = useState([
        { id: 1, amount: 7.5, time: '06:30 AM', type: 'Night Sleep' },
        { id: 2, amount: 0.5, time: '02:15 PM', type: 'Power Nap' },
    ]);

    const targetSleep = 7.5; // Could be from userProfile

    // Sync with backend (placeholder)
    useEffect(() => {
        setIsClient(true);
        
        // Generate last 7 days chart data
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            
            data.push({
                name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                hours: 0, // Placeholder for backend fetch logic
            });
        }
        setChartData(data);
    }, [selectedDate]);

    const handleAdd = (amount: number, type: string) => {
        if (!selectedDate) return;
        setCurrentSleep(prev => prev + amount);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLogs([{ id: Date.now(), amount, time: timeStr, type }, ...logs]);
    };

    const handleDelete = (id: number, amount: number) => {
        if (!selectedDate) return;
        setLogs(logs.filter(log => log.id !== id));
        setCurrentSleep(prev => Math.max(0, prev - amount));
    };

    const avgSleep = chartData.reduce((acc, curr) => acc + curr.hours, 0) / (chartData.length || 1);
    const isTrendingUp = (chartData[chartData.length - 1]?.hours || 0) >= (chartData[chartData.length - 2]?.hours || 0);

    if (!isClient) return null;

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors btn-press">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                <Moon className="text-indigo-500" /> Sleep Tracking
                            </h1>
                            <p className="text-sm text-gray-500 font-medium mt-0.5">
                                {isToday ? "Today's Recovery" : `History for ${selectedDate}`}
                            </p>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Daily Target</span>
                        <span className="text-xl font-black text-indigo-900">{targetSleep} <span className="text-sm text-indigo-500">hrs</span></span>
                    </div>
                </div>

                {/* Top Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase">Logged {isToday ? 'Today' : selectedDate}</span>
                        <div className="text-3xl font-black text-gray-900 mt-1">{currentSleep} <span className="text-sm text-gray-500">hrs</span></div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase">7-Day Avg</span>
                        <div className="text-3xl font-black text-indigo-600 mt-1">{avgSleep.toFixed(1)} <span className="text-sm text-indigo-400">hrs</span></div>
                    </div>
                    <div className="col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 text-white flex items-center justify-between shadow-md">
                        <div>
                            <span className="text-xs font-bold text-indigo-100 uppercase block mb-1">Status</span>
                            <div className="text-xl font-black flex items-center gap-2">
                                {currentSleep >= targetSleep ? "Optimal Recovery" : "Need more rest"}
                                {isTrendingUp ? <TrendingUp size={20} className="text-emerald-300" /> : <TrendingDown size={20} className="text-rose-300" />}
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                            <Moon size={24} className="text-white" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Graph Section */}
                    <div className="md:col-span-2 bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-6 flex items-center gap-2">
                            <History size={18} className="text-indigo-500" /> 7-Day Sleep Trends
                        </h2>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ stroke: '#e5e7eb', strokeWidth: 2, strokeDasharray: '5 5' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="hours" 
                                        stroke="#6366f1" 
                                        strokeWidth={4}
                                        fillOpacity={1} 
                                        fill="url(#colorHours)" 
                                        activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 3 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Add & History */}
                    <div className="space-y-6">
                        
                        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-4 flex items-center gap-2">
                                <Plus size={18} className="text-indigo-500" /> Log Sleep
                            </h2>
                            <div className="space-y-3">
                                <button 
                                    onClick={() => handleAdd(8, 'Night Sleep')}
                                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-2xl p-3 flex items-center justify-between transition-colors font-bold btn-press"
                                >
                                    <span className="flex items-center gap-2"><Moon size={16} /> Night Sleep (8h)</span>
                                    <span>+ 8h</span>
                                </button>
                                <button 
                                    onClick={() => handleAdd(0.5, 'Power Nap')}
                                    className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 rounded-2xl p-3 flex items-center justify-between transition-colors font-bold btn-press"
                                >
                                    <span className="flex items-center gap-2"><Moon size={16} /> Power Nap (30m)</span>
                                    <span>+ 0.5h</span>
                                </button>
                                
                                <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                                    <div className="flex-1 relative">
                                        <input 
                                            type="number" 
                                            value={customSleep} 
                                            onChange={(e) => setCustomSleep(e.target.value)}
                                            step="0.5"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-gray-900 focus:outline-none focus:border-indigo-400"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">hrs</span>
                                    </div>
                                    <button 
                                        onClick={() => handleAdd(parseFloat(customSleep) || 0, 'Custom Sleep')}
                                        className="bg-gray-900 hover:bg-black text-white font-bold p-3 rounded-xl flex items-center justify-center transition-colors btn-press shrink-0"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-4 flex items-center gap-2">
                                <History size={18} className="text-gray-400" /> Recent Logs
                            </h2>
                            
                            <div className="space-y-3 overflow-y-auto max-h-40 custom-scrollbar pr-2">
                                {logs.length === 0 ? (
                                    <div className="text-center text-gray-400 text-sm font-medium py-4">No sleep logged.</div>
                                ) : (
                                    logs.map((log) => (
                                        <div key={log.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-3 flex items-center justify-between shadow-sm group">
                                            <div>
                                                <p className="font-black text-gray-900 text-sm">{log.amount} hrs</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{log.type} • {log.time}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleDelete(log.id, log.amount)}
                                                className="w-8 h-8 rounded-full hover:bg-rose-100 text-gray-300 hover:text-rose-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
