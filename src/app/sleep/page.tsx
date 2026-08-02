'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Moon, ArrowLeft, History, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import EnhancedSleepLogger from './components/EnhancedSleepLogger';
import EndOfDayReflection from './components/EndOfDayReflection';

export default function SleepPage() {
    const { userProfile } = useAuth();
    const { selectedDate, isToday } = useDate();
    const [currentSleep, setCurrentSleep] = useState(0);
    const [customSleep, setCustomSleep] = useState('8');
    const [chartData, setChartData] = useState<any[]>([]);
    const [isClient, setIsClient] = useState(false);
    
    const [logs, setLogs] = useState<any[]>([]);

    const targetSleep = 7.5; // Could be from userProfile

    // Load and sync with Supabase
    useEffect(() => {
        setIsClient(true);
        if (!selectedDate) return;

        const loadSleepData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch last 7 days of sleep from Supabase
            const dEnd = new Date();
            const dStart = new Date();
            dStart.setDate(dStart.getDate() - 6);
            
            const startStr = dStart.getFullYear() + '-' + String(dStart.getMonth() + 1).padStart(2, '0') + '-' + String(dStart.getDate()).padStart(2, '0');
            const endStr = dEnd.getFullYear() + '-' + String(dEnd.getMonth() + 1).padStart(2, '0') + '-' + String(dEnd.getDate()).padStart(2, '0');

            const { data: dbLogs } = await supabase
                .from('daily_logs')
                .select('date, sleep_hours, sleep_logs')
                .eq('user_id', user.id)
                .gte('date', startStr)
                .lte('date', endStr);

            const dbMap = new Map();
            if (dbLogs) {
                dbLogs.forEach(l => {
                    dbMap.set(l.date, l.sleep_hours);
                    if (l.date === selectedDate && l.sleep_logs) {
                        setLogs(l.sleep_logs as any[]);
                    } else if (l.date === selectedDate) {
                        setLogs([]);
                    }
                });
            }

            const data = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                
                data.push({
                    name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    hours: dbMap.get(dateStr) || 0,
                    rawDate: dateStr
                });
            }

            setChartData(data);
            
            // Set today's current sleep
            setCurrentSleep(dbMap.get(selectedDate) || 0);
        };
        
        loadSleepData();

        // Re-fetch when Ava AI logs sleep data
        const handleAvaSync = () => loadSleepData();
        window.addEventListener('workout_os_sleep_updated', handleAvaSync);
        return () => window.removeEventListener('workout_os_sleep_updated', handleAvaSync);
    }, [selectedDate]);

    const saveToSupabase = async (newTotal: number, newLogs: any[], bedtime?: string, waketime?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !selectedDate) return;

        const row: any = {
            user_id: user.id,
            date: selectedDate,
            sleep_hours: newTotal,
            sleep_logs: newLogs,
        };
        // Persist bed/wake so the dashboard SleepCard can show them.
        if (bedtime) row.sleep_bedtime = bedtime;
        if (waketime) row.sleep_waketime = waketime;

        await supabase.from('daily_logs').upsert(row, { onConflict: 'user_id,date' });
    };

    const handleAdd = async (amount: number, type: string, details?: any) => {
        if (!selectedDate) return;
        // A night's sleep is a single value — replace the day's total rather than
        // accumulate, so re-logging corrects instead of doubling.
        const isNightSleep = type === 'Night Sleep';
        const newTotal = isNightSleep ? amount : currentSleep + amount;
        setCurrentSleep(newTotal);

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newLogs = isNightSleep
            ? [{ id: Date.now(), amount, time: timeStr, type, details }]
            : [{ id: Date.now(), amount, time: timeStr, type, details }, ...logs];
        setLogs(newLogs);

        await saveToSupabase(newTotal, newLogs, details?.bedtime, details?.waketime);
        window.dispatchEvent(new Event('storage')); // Sync to dashboard
        
        // Update chart data for today
        setChartData(prev => {
            const next = [...prev];
            const idx = next.findIndex(d => d.rawDate === selectedDate);
            if (idx !== -1) {
                next[idx].hours = newTotal;
            }
            return next;
        });
    };

    const handleDelete = async (id: number, amount: number) => {
        if (!selectedDate) return;
        const newLogs = logs.filter(log => log.id !== id);
        setLogs(newLogs);
        
        const newTotal = Math.max(0, currentSleep - amount);
        setCurrentSleep(newTotal);
        
        await saveToSupabase(newTotal, newLogs);
        window.dispatchEvent(new Event('storage'));
        
        setChartData(prev => {
            const next = [...prev];
            const idx = next.findIndex(d => d.rawDate === selectedDate);
            if (idx !== -1) {
                next[idx].hours = newTotal;
            }
            return next;
        });
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
                        <Link href="/dashboard" className="w-10 h-10 rounded-full bg-card-white shadow-sm flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors btn-press">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-on-surface tracking-tight flex items-center gap-2">
                                <Moon className="text-secondary" /> Sleep Tracking
                            </h1>
                            <p className="text-sm text-on-surface-variant font-medium mt-0.5">
                                {isToday ? "Today's Recovery" : `History for ${selectedDate}`}
                            </p>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block">Daily Target</span>
                        <span className="text-xl font-black text-on-surface">{targetSleep} <span className="text-sm text-secondary">hrs</span></span>
                    </div>
                </div>

                {/* Top Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-surface-container-low border border-surface-variant rounded-[2rem] p-5 shadow-sm transition-colors">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Logged {isToday ? 'Today' : selectedDate}</span>
                        <div className="text-3xl font-black text-on-surface mt-1">{currentSleep} <span className="text-sm text-on-surface-variant">hrs</span></div>
                    </div>
                    <div className="bg-surface-container-low border border-surface-variant rounded-[2rem] p-5 shadow-sm transition-colors">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">7-Day Avg</span>
                        <div className="text-3xl font-black text-secondary mt-1">{avgSleep.toFixed(1)} <span className="text-sm opacity-70">hrs</span></div>
                    </div>
                    <div className="col-span-2 bg-secondary rounded-[2rem] p-5 text-on-secondary flex items-center justify-between shadow-md transition-colors">
                        <div>
                            <span className="text-xs font-bold opacity-80 uppercase tracking-wider block mb-1">Status</span>
                            <div className="text-xl font-black flex items-center gap-2">
                                {currentSleep >= targetSleep ? "Optimal Recovery" : "Need more rest"}
                                {isTrendingUp ? <TrendingUp size={20} className="text-white" /> : <TrendingDown size={20} className="text-white/60" />}
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-card-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                            <Moon size={24} className="text-white" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Graph Section */}
                    <div className="md:col-span-2 bg-surface-container-low border border-surface-variant p-6 rounded-[2rem] shadow-sm transition-colors">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2 mb-6">
                            <History size={18} className="text-secondary" /> 7-Day Sleep Trends
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
                        
                        <EnhancedSleepLogger onLogSaved={(data) => handleAdd(data.amount, data.type, data.details)} />


                        <div className="bg-surface-container-low border border-surface-variant p-6 rounded-[2rem] shadow-sm transition-colors">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-2">
                                <History size={18} className="text-on-surface-variant" /> Recent Logs
                            </h2>
                            
                            <div className="space-y-3 overflow-y-auto max-h-40 custom-scrollbar pr-2">
                                {logs.length === 0 ? (
                                    <div className="text-center text-on-surface-variant text-sm font-medium py-4">No sleep logged.</div>
                                ) : (
                                    logs.map((log) => (
                                        <div key={log.id} className="bg-surface-container-lowest border border-surface-variant rounded-2xl p-4 flex items-center justify-between shadow-sm group">
                                            <div>
                                                <p className="font-black text-on-surface text-sm">{log.amount} hrs</p>
                                                <p className="text-[10px] font-bold text-on-surface-variant uppercase">{log.type} • {log.time}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleDelete(log.id, log.amount)}
                                                className="w-8 h-8 rounded-full hover:bg-error-container text-on-surface-variant hover:text-error flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
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

                <EndOfDayReflection />

            </div>
        </AppLayout>
    );
}
