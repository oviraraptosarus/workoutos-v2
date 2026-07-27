'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Droplet, ArrowLeft, Plus, History, Trash2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function WaterPage() {
    const { userProfile } = useAuth();
    const goalMl = userProfile?.waterGoalMl || 3000;
    const [currentMl, setCurrentMl] = useState(0);
    const [customAmount, setCustomAmount] = useState('300');

    const [logs, setLogs] = useState([
        { id: 1, amount: 250, time: '08:30 AM', type: 'Glass' },
        { id: 2, amount: 500, time: '11:15 AM', type: 'Bottle' },
        { id: 3, amount: 450, time: '02:00 PM', type: 'Workout' },
    ]);

    const percentage = Math.min((currentMl / goalMl) * 100, 100);
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const handleAdd = (amount: number, type: string) => {
        setCurrentMl(prev => prev + amount);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLogs([{ id: Date.now(), amount, time: timeStr, type }, ...logs]);
    };

    const handleDelete = (id: number, amount: number) => {
        setLogs(logs.filter(log => log.id !== id));
        setCurrentMl(prev => Math.max(0, prev - amount));
    };

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors btn-press">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                <Droplet className="text-blue-500" /> Hydration
                            </h1>
                            <p className="text-sm text-gray-500 font-medium mt-0.5">Track your daily water intake</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Daily Goal</span>
                        <span className="text-xl font-black text-blue-900">{goalMl} <span className="text-sm text-blue-500">ml</span></span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Progress Visual */}
                    <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm border-t border-gray-200 flex flex-col items-center justify-center">
                        
                        <div className="relative w-[280px] h-[280px] flex items-center justify-center">
                            {/* SVG Ring */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                {/* Background Ring */}
                                <circle 
                                    cx="140" cy="140" r={radius} 
                                    fill="transparent" 
                                    stroke="#eff6ff" // blue-50
                                    strokeWidth="24" 
                                />
                                {/* Progress Ring */}
                                <circle 
                                    cx="140" cy="140" r={radius} 
                                    fill="transparent" 
                                    stroke="url(#blueGradient)"
                                    strokeWidth="24" 
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    className="transition-all duration-1000 ease-out"
                                />
                                <defs>
                                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#60a5fa" /> {/* blue-400 */}
                                        <stop offset="100%" stopColor="#2563eb" /> {/* blue-600 */}
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Inner Content */}
                            <div className="text-center z-10 flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-2 shadow-inner">
                                    <Droplet size={24} fill="currentColor" className="opacity-80" />
                                </div>
                                <span className="text-5xl font-black text-gray-900 tracking-tighter">{currentMl}</span>
                                <span className="text-sm font-bold text-blue-600 tracking-wider">/ {goalMl} ml</span>
                            </div>
                        </div>

                        {percentage >= 100 && (
                            <div className="mt-6 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border border-emerald-100 animate-bounce">
                                <CheckCircle2 size={18} /> Daily Goal Met!
                            </div>
                        )}
                    </div>

                    {/* Quick Add & History */}
                    <div className="space-y-6">
                        
                        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm border-t border-gray-200">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-4 flex items-center gap-2">
                                <Plus size={18} className="text-blue-500" /> Quick Add
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    id="tour-water-page-add"
                                    onClick={() => handleAdd(250, 'Glass')}
                                    className="bg-white hover:bg-blue-50 border-2 border-gray-100 hover:border-blue-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all btn-press group relative z-[110]"
                                >
                                    <Droplet size={24} className="text-gray-400 group-hover:text-blue-500" />
                                    <span className="font-black text-gray-700 group-hover:text-blue-700">+ 250ml</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Glass</span>
                                </button>
                                <button 
                                    onClick={() => handleAdd(500, 'Bottle')}
                                    className="bg-white hover:bg-blue-50 border-2 border-gray-100 hover:border-blue-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all btn-press group"
                                >
                                    <Droplet size={28} className="text-gray-400 group-hover:text-blue-500" />
                                    <span className="font-black text-gray-700 group-hover:text-blue-700">+ 500ml</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Bottle</span>
                                </button>
                                <div className="col-span-2 bg-white border-2 border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Custom Amount (ml)</label>
                                        <input 
                                            type="number" 
                                            value={customAmount} 
                                            onChange={(e) => setCustomAmount(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900 focus:outline-none focus:border-blue-400"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => handleAdd(parseInt(customAmount) || 0, 'Custom')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl flex items-center justify-center transition-colors btn-press mt-4"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm border-t border-gray-200 flex-1 flex flex-col">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-4 flex items-center gap-2">
                                <History size={18} className="text-gray-400" /> Today's Log
                            </h2>
                            
                            <div className="space-y-3 overflow-y-auto max-h-48 custom-scrollbar pr-2">
                                {logs.length === 0 ? (
                                    <div className="text-center text-gray-400 text-sm font-medium py-4">No water logged yet today.</div>
                                ) : (
                                    logs.map((log) => (
                                        <div key={log.id} className="bg-gray-100 border border-gray-100 rounded-2xl p-3 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                                    <Droplet size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 text-sm">{log.amount} ml</p>
                                                    <p className="text-[11px] font-bold text-gray-400 uppercase">{log.type} • {log.time}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDelete(log.id, log.amount)}
                                                className="w-8 h-8 rounded-full hover:bg-rose-50 text-gray-300 hover:text-rose-500 flex items-center justify-center transition-colors btn-press"
                                            >
                                                <Trash2 size={16} />
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
