'use client';

import React, { useState, useEffect } from 'react';
import { Scale, CheckCircle2, Camera, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeightEntry {
    date: string;
    weight: number;
}

const WEIGHT_KEY = 'workout_os_weight_log';

export default function WeightLogCard() {
    const { userProfile } = useAuth();
    const [weight, setWeight] = useState<number | string>(userProfile?.currentWeight || 75);
    const [isLogged, setIsLogged] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    const [chartData, setChartData] = useState<WeightEntry[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const target = userProfile?.targetWeight || 75;
            const createdAt = userProfile?.createdAt ? new Date(userProfile.createdAt) : null;
            
            // Generate the current week (Monday to Sunday)
            const today = new Date();
            const currentDay = today.getDay();
            const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
            
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - diffToMonday);
            const startStr = startDate.getFullYear() + '-' + String(startDate.getMonth() + 1).padStart(2, '0') + '-' + String(startDate.getDate()).padStart(2, '0');
            
            const endDate = new Date(today);
            endDate.setDate(today.getDate() - diffToMonday + 6);
            const endStr = endDate.getFullYear() + '-' + String(endDate.getMonth() + 1).padStart(2, '0') + '-' + String(endDate.getDate()).padStart(2, '0');

            const { data } = await supabase
                .from('daily_logs')
                .select('date, weight_kg')
                .eq('user_id', user.id)
                .gte('date', startStr)
                .lte('date', endStr)
                .not('weight_kg', 'is', null);

            const logMap = new Map();
            if (data) {
                data.forEach(d => {
                    const localDate = new Date(d.date);
                    const formattedDate = localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                    logMap.set(formattedDate, d.weight_kg);
                });
            }

            const currentWeekLogs: any[] = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() - diffToMonday + i);
                const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                currentWeekLogs.push({
                    date: dateStr,
                    weight: logMap.has(dateStr) ? logMap.get(dateStr) : null
                });
            }
            
            setChartData(currentWeekLogs);
        };
        load();
        window.addEventListener('storage', load);
        return () => window.removeEventListener('storage', load);
    }, [userProfile?.currentWeight, userProfile?.targetWeight]);

    const handleLog = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        
        const newWeight = Number(weight);
        if (!isNaN(newWeight)) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const d = new Date();
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const todayKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            
            try {
                // Upsert daily_logs
                const { data: existing, error: fetchError } = await supabase
                    .from('daily_logs')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('date', todayKey)
                    .single();

                if (existing) {
                    const { error } = await supabase.from('daily_logs').update({ weight_kg: newWeight }).eq('id', existing.id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('daily_logs').insert({ user_id: user.id, date: todayKey, weight_kg: newWeight });
                    if (error) throw error;
                }

                // Update profiles current_weight
                const { error: profileError } = await supabase.from('profiles').upsert({ id: user.id, current_weight: newWeight }, { onConflict: 'id' });
                if (profileError) throw profileError;

                let updated = [...chartData];
                // If they already logged today, update it instead of adding duplicate
                const idx = updated.findIndex(log => log.date === dateStr);
                if (idx !== -1) {
                    updated[idx].weight = newWeight;
                } else {
                    updated.push({ date: dateStr, weight: newWeight });
                    if (updated.length > 7) updated = updated.slice(updated.length - 7);
                }
                setChartData(updated);

                setIsLogged(true);
                setTimeout(() => setIsLogged(false), 3000);
                window.dispatchEvent(new Event('storage'));
            } catch (err: any) {
                console.error('Error logging weight:', err);
                setErrorMsg(err.message || 'Failed to log weight');
            }
        }
    };

    return (
        <div className="bg-white border border-gray-100 border-gray-100 rounded-3xl p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-indigo-600">
                    <div className="p-1.5 rounded-full bg-indigo-50/50 shadow-sm border border-gray-100 dark:border-slate-800">
                        <Scale size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Log Weight</span>
                </div>
                <Link href="/progress" className="text-[10px] font-bold text-gray-400 hover:text-indigo-600 flex items-center gap-1 transition-colors btn-press uppercase tracking-wider">
                    <Camera size={14} /> Photos <ChevronRight size={14} />
                </Link>
            </div>

            <div className="h-40 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.4)" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} 
                            dy={5}
                        />
                        <YAxis 
                            domain={['dataMin - 1', 'dataMax + 1']} 
                            axisLine={false} 
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                            itemStyle={{ color: '#4f46e5' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="weight" 
                            stroke="#4f46e5" 
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} 
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            animationDuration={1000}
                            connectNulls={true}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <form onSubmit={handleLog} className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <input
                            type="number"
                            step="0.1"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-2xl font-black text-gray-900 focus:outline-none focus:border-indigo-300 focus:bg-gray-50 transition-all text-center shadow-inner"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 dark:text-gray-500">kg</span>
                    </div>
                    <button 
                        type="submit"
                        disabled={isLogged}
                        className={`px-5 py-3 rounded-2xl font-bold text-white transition-all shadow-sm ${
                            isLogged ? 'bg-emerald-500' : 'bg-[#1f4e38] hover:bg-[#163a2a] btn-press'
                        }`}
                    >
                        {isLogged ? <CheckCircle2 size={24} /> : 'Save'}
                    </button>
                </div>
                {isLogged && (
                    <p className="text-[11px] font-bold text-emerald-600 text-center animate-in fade-in slide-in-from-top-1">
                        Weight successfully logged!
                    </p>
                )}
                {errorMsg && (
                    <p className="text-[11px] font-bold text-rose-600 text-center animate-in fade-in slide-in-from-top-1">
                        {errorMsg}
                    </p>
                )}
            </form>
        </div>
    );
}
