'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

export default function ActivityTrendsChart() {
    const { user } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [metric, setMetric] = useState<'calories' | 'steps'>('calories');

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const today = new Date();
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(today.getDate() - (6 - i));
                return {
                    date: d.toLocaleDateString('en-CA'),
                    display: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    calories: 0,
                    steps: 0
                };
            });

            const startDate = last7Days[0].date;
            
            const { data: logs } = await supabase
                .from('daily_logs')
                .select('date, activity_burned, steps')
                .eq('user_id', user.id)
                .gte('date', startDate);
                
            if (logs) {
                logs.forEach(log => {
                    const day = last7Days.find(d => d.date === log.date);
                    if (day) {
                        day.calories = log.activity_burned || 0;
                        day.steps = log.steps || 0;
                    }
                });
            }
            
            setData(last7Days);
        };
        
        load();
        
        const handleUpdate = () => load();
        window.addEventListener('workout_os_activity_updated', handleUpdate);
        window.addEventListener('workout_os_refresh', handleUpdate);
        return () => {
            window.removeEventListener('workout_os_activity_updated', handleUpdate);
            window.removeEventListener('workout_os_refresh', handleUpdate);
        };
    }, [user]);

    const maxValue = Math.max(...data.map(d => metric === 'calories' ? d.calories : d.steps), 10);

    return (
        <div className="glass-card-premium p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={16} className="text-tertiary" /> 
                    Activity Trends
                </h3>
                <div className="flex bg-surface-container rounded-lg p-1">
                    <button 
                        onClick={() => setMetric('calories')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${metric === 'calories' ? 'bg-tertiary text-on-tertiary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                        Calories
                    </button>
                    <button 
                        onClick={() => setMetric('steps')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${metric === 'steps' ? 'bg-tertiary text-on-tertiary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                        Steps
                    </button>
                </div>
            </div>
            
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                        <XAxis 
                            dataKey="display" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#888888', fontSize: 11, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#888888', fontSize: 11 }}
                            domain={[0, maxValue * 1.1]}
                        />
                        <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#1E1E28', border: '1px solid #333340', borderRadius: '12px', color: '#fff', fontWeight: 600 }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => [`${value} ${metric === 'calories' ? 'kcal' : 'steps'}`, metric === 'calories' ? 'Burned' : 'Steps']}
                        />
                        <Bar dataKey={metric} radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={metric === 'calories' ? '#ff6b6b' : '#32d74b'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

