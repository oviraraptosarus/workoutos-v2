'use client';

import React, { useState } from 'react';
import { Scale, CheckCircle2, Camera, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeightLogCard() {
    const { userProfile } = useAuth();
    const [weight, setWeight] = useState<number | string>(userProfile?.targetWeight || 75);
    const [isLogged, setIsLogged] = useState(false);
    
    const [chartData, setChartData] = useState([
        { date: 'Jul 21', weight: 76.5 },
        { date: 'Jul 22', weight: 76.2 },
        { date: 'Jul 23', weight: 75.8 },
        { date: 'Jul 24', weight: 75.9 },
        { date: 'Jul 25', weight: 75.5 },
        { date: 'Jul 26', weight: 75.1 },
    ]);

    const handleLog = (e: React.FormEvent) => {
        e.preventDefault();
        
        const newWeight = Number(weight);
        if (!isNaN(newWeight)) {
            setChartData([...chartData, { date: 'Today', weight: newWeight }]);
        }

        setIsLogged(true);
        setTimeout(() => setIsLogged(false), 3000);
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
            </form>
        </div>
    );
}
