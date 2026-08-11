'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Moon, ArrowLeft, History, Plus, Trash2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDate } from '@/contexts/DateContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase/client';
import EnhancedSleepLogger from './components/EnhancedSleepLogger';

export default function SleepPage() {
    const { t } = useLanguage();
    const { userProfile } = useAuth();
    const { selectedDate, isToday } = useDate();
    const [currentSleep, setCurrentSleep] = useState(0);
    const [customSleep, setCustomSleep] = useState('8');
    const [chartData, setChartData] = useState<any[]>([]);
    const [isClient, setIsClient] = useState(false);
    
    const [logs, setLogs] = useState<any[]>([]);

    const [chartWeekOffset, setChartWeekOffset] = useState(0);

    const targetSleep = 7.5; // Could be from userProfile

    // Load and sync with Supabase
    useEffect(() => {
        setIsClient(true);
        if (!selectedDate) return;

        const loadSleepData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch last 7 days of sleep from Supabase, offset by chartWeekOffset
            // chartWeekOffset = 0 means the 7 days ending on selectedDate
            const dEnd = new Date(selectedDate);
            dEnd.setDate(dEnd.getDate() + (chartWeekOffset * 7));
            const dStart = new Date(selectedDate);
            dStart.setDate(dStart.getDate() + (chartWeekOffset * 7) - 6);
            
            const startStr = dStart.getFullYear() + '-' + String(dStart.getMonth() + 1).padStart(2, '0') + '-' + String(dStart.getDate()).padStart(2, '0');
            const endStr = dEnd.getFullYear() + '-' + String(dEnd.getMonth() + 1).padStart(2, '0') + '-' + String(dEnd.getDate()).padStart(2, '0');

            // Fetch chart range AND the currently selected date to ensure header stats don't disappear
            const { data: dbLogs } = await supabase
                .from('daily_logs')
                .select('date, sleep_hours, sleep_logs')
                .eq('user_id', user.id)
                .or(`date.eq.${selectedDate},and(date.gte.${startStr},date.lte.${endStr})`);

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
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + (chartWeekOffset * 7) - i);
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
    }, [selectedDate, chartWeekOffset]);

    const saveToSupabase = async (newTotal: number, newLogs: any[], bedtime?: string, waketime?: string) => {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
            alert("Auth Error: Could not verify session. " + authError.message);
            return;
        }
        if (!user || !selectedDate) {
            alert("Missing user or date!");
            return;
        }

        const row: any = {
            user_id: user.id,
            date: selectedDate,
            sleep_hours: newTotal,
            sleep_logs: newLogs,
        };
        // Persist bed/wake so the dashboard SleepCard can show them.
        if (bedtime) row.sleep_bedtime = bedtime.length === 5 ? `${bedtime}:00` : bedtime;
        if (waketime) row.sleep_waketime = waketime.length === 5 ? `${waketime}:00` : waketime;

        const { error, data } = await supabase.from('daily_logs').upsert(row, { onConflict: 'user_id,date' }).select();
        if (error) {
            console.error("Error saving sleep to Supabase:", error);
            alert("Database Error: " + error.message + (error.details ? "\n" + error.details : ""));
        } else {
            // Optional: alert("Saved successfully!");
        }
    };

    const handleAdd = async (amount: number, type: string, details?: any) => {
        if (!selectedDate) return;
        
        const newTotal = currentSleep + amount;
        setCurrentSleep(newTotal);

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newLogs = [{ id: Date.now(), amount, time: timeStr, type, details }, ...logs];
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
    
    const weekEndDate = new Date(selectedDate);
    if (selectedDate) {
        weekEndDate.setDate(weekEndDate.getDate() + (chartWeekOffset * 7));
    }
    const monthYearStr = weekEndDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();

    if (!isClient) return null;

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
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
                                {isToday ? t('sleep.page.todayRecovery') : t('sleep.page.historyFor').replace('{date}', selectedDate)}
                            </p>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block">{t('sleep.page.dailyTarget')}</span>
                        <span className="text-xl font-black text-on-surface">{targetSleep} <span className="text-sm text-secondary">{t('sleep.page.hrs')}</span></span>
                    </div>
                </div>

                {/* Top Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-card-premium p-5 transition-colors">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('sleep.page.loggedToday').replace('{date}', isToday ? t('sleep.today') : selectedDate)}</span>
                        <div className="text-3xl font-black text-on-surface mt-1">{currentSleep} <span className="text-sm text-on-surface-variant">{t('sleep.page.hrs')}</span></div>
                    </div>
                    <div className="glass-card-premium p-5 transition-colors">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('sleep.page.7dayAvg')}</span>
                        <div className="text-3xl font-black text-secondary mt-1">{avgSleep.toFixed(1)} <span className="text-sm opacity-70">{t('sleep.page.hrs')}</span></div>
                    </div>
                    <div className="col-span-2 bg-secondary rounded-[2rem] p-5 text-on-secondary flex items-center justify-between shadow-md transition-colors">
                        <div>
                            <span className="text-xs font-bold opacity-80 uppercase tracking-wider block mb-1">{t('sleep.page.status')}</span>
                            <div className="text-xl font-black flex items-center gap-2">
                                {currentSleep >= targetSleep ? t('sleep.page.optimalRecovery') : t('sleep.page.needRest')}
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
                    <div className="md:col-span-2 glass-card-premium p-4 sm:p-5 transition-colors">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                                <History size={18} className="text-secondary" /> 7-Day Sleep Trends
                            </h2>
                            <div className="flex items-center gap-1 bg-surface-container-low rounded-full border border-surface-variant/50 p-1 shadow-sm">
                                <button 
                                    onClick={() => setChartWeekOffset(prev => prev - 1)}
                                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                                    {monthYearStr}
                                </span>
                                <button 
                                    onClick={() => setChartWeekOffset(prev => Math.min(0, prev + 1))}
                                    disabled={chartWeekOffset >= 0}
                                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
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
                                        cursor={{ stroke: '#e5e7eb', strokeWidth: 2, strokeDasharray: '5 5' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const rawDate = payload[0].payload.rawDate;
                                                const d = new Date(rawDate);
                                                const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                                                
                                                return (
                                                    <div className="bg-surface-container-high border border-surface-variant p-3 rounded-2xl shadow-xl flex flex-col gap-1 min-w-[100px]">
                                                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{formattedDate}</span>
                                                        <span className="text-sm font-black text-on-surface">{payload[0].value} <span className="text-xs text-on-surface-variant font-medium">hrs</span></span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
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
                    <div className="space-y-4">
                        
                        <EnhancedSleepLogger onLogSaved={(data) => handleAdd(data.amount, data.type, data.details)} />


                        <div className="glass-card-premium p-4 sm:p-5 transition-colors">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-2">
                                <History size={18} className="text-on-surface-variant" /> Recent Logs
                            </h2>
                            
                            <div className="space-y-3 overflow-y-auto max-h-40 custom-scrollbar pr-2">
                                {logs.length === 0 ? (
                                    <div className="text-center text-on-surface-variant text-sm font-medium py-4">{t('sleep.page.noSleep')}</div>
                                ) : (
                                    logs.map((log) => (
                                        <div key={log.id} className="bg-surface-container-lowest border border-surface-variant rounded-2xl p-4 flex items-center justify-between shadow-sm group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                                                    log.type === 'Nap' ? 'bg-amber-500/10' :
                                                    log.type === 'Rest' ? 'bg-purple-500/10' :
                                                    'bg-secondary/10'
                                                }`}>
                                                    {log.type === 'Nap' ? '😴' : log.type === 'Rest' ? '🛋️' : '🌙'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-on-surface text-sm">{log.amount} hrs</p>
                                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase">
                                                        {log.type} • {log.details?.bedtime && log.details?.waketime ? `${log.details.bedtime} → ${log.details.waketime}` : log.time}
                                                    </p>
                                                </div>
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
            </div>
        </AppLayout>
    );
}
