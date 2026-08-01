'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Point {
    date: string;
    label: string;
    weight: number;
}

const RANGES = [
    { key: '30', label: '30 days', days: 30 },
    { key: '90', label: '3 months', days: 90 },
    { key: '365', label: 'Year', days: 365 },
] as const;

export default function ProgressPage() {
    const { userProfile } = useAuth();
    const [points, setPoints] = useState<Point[]>([]);
    const [range, setRange] = useState<(typeof RANGES)[number]['key']>('30');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            const days = RANGES.find(r => r.key === range)?.days ?? 30;
            const since = new Date();
            since.setDate(since.getDate() - days);
            const sinceKey = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, '0')}-${String(since.getDate()).padStart(2, '0')}`;

            const { data } = await supabase
                .from('daily_logs')
                .select('date, weight_kg')
                .eq('user_id', user.id)
                .gte('date', sinceKey)
                .not('weight_kg', 'is', null)
                .order('date', { ascending: true });

            setPoints(
                (data ?? []).map((d) => ({
                    date: d.date,
                    label: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                    weight: Number(d.weight_kg),
                }))
            );
            setLoading(false);
        };
        load();
        window.addEventListener('storage', load);
        return () => window.removeEventListener('storage', load);
    }, [range]);

    const first = points[0]?.weight ?? null;
    const latest = points[points.length - 1]?.weight ?? null;
    const change = first !== null && latest !== null ? latest - first : null;
    const target = userProfile?.targetWeight ?? null;
    const toGo = target !== null && latest !== null ? latest - target : null;

    const Trend = change === null || Math.abs(change) < 0.05 ? Minus : change < 0 ? TrendingDown : TrendingUp;
    const trendColor = change === null || Math.abs(change) < 0.05
        ? 'text-on-surface-variant'
        : change < 0 ? 'text-activity-green' : 'text-activity-red';

    return (
        <AppLayout>
            <div className="flex flex-col gap-4 animate-fade-in">
                <div>
                    <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">Progress</h1>
                    <p className="font-body-md text-on-surface-variant mt-0.5">Weight trend from your logs</p>
                </div>

                {/* Range selector */}
                <div className="flex gap-1.5 bg-surface-container rounded-full p-1 self-start">
                    {RANGES.map((r) => (
                        <button
                            key={r.key}
                            onClick={() => setRange(r.key)}
                            aria-pressed={range === r.key}
                            className={`px-4 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
                                range === r.key ? 'bg-card-white text-on-surface shadow-sm' : 'text-on-surface-variant'
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-card-white dark:bg-surface-container-lowest rounded-3xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/5">
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Current</p>
                        <p className="font-headline-md text-headline-md font-bold text-on-surface tabular-nums mt-1">
                            {latest !== null ? latest.toFixed(1) : '—'}
                        </p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">kg</p>
                    </div>
                    <div className="bg-card-white dark:bg-surface-container-lowest rounded-3xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/5">
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Change</p>
                        <p className={`font-headline-md text-headline-md font-bold tabular-nums mt-1 flex items-center gap-1 ${trendColor}`}>
                            <Trend size={16} />
                            {change !== null ? `${change > 0 ? '+' : ''}${change.toFixed(1)}` : '—'}
                        </p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">kg</p>
                    </div>
                    <div className="bg-card-white dark:bg-surface-container-lowest rounded-3xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/5">
                        <p className="font-label-sm text-label-sm text-on-surface-variant">To goal</p>
                        <p className="font-headline-md text-headline-md font-bold text-on-surface tabular-nums mt-1">
                            {toGo !== null ? Math.abs(toGo).toFixed(1) : '—'}
                        </p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">kg</p>
                    </div>
                </div>

                {/* Chart */}
                <div className="bg-card-white dark:bg-surface-container-lowest rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/5">
                    <h2 className="font-headline-md text-headline-md font-semibold text-on-surface tracking-tight mb-4">Weight</h2>
                    {loading ? (
                        <div className="h-56 flex items-center justify-center">
                            <div className="h-5 w-32 rounded-full bg-surface-container animate-pulse" />
                        </div>
                    ) : points.length === 0 ? (
                        <div className="h-56 flex flex-col items-center justify-center gap-2 text-center">
                            <p className="font-body-md text-on-surface-variant">No weight logged in this range</p>
                            <Link href="/dashboard" className="font-label-md text-label-md text-on-primary bg-primary px-4 py-2 rounded-full">
                                Log weight
                            </Link>
                        </div>
                    ) : (
                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={points} margin={{ top: 8, right: 8, bottom: 4, left: -18 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.15)" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6E6E73' }} minTickGap={24} />
                                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6E6E73' }} width={44} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(v: number | string) => [`${v} kg`, 'Weight']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="#0058be"
                                        strokeWidth={2.5}
                                        dot={{ r: 3, fill: '#0058be', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 5 }}
                                        animationDuration={800}
                                        connectNulls
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Entries */}
                {points.length > 0 && (
                    <div className="bg-card-white dark:bg-surface-container-lowest rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/5">
                        <h2 className="font-headline-md text-headline-md font-semibold text-on-surface tracking-tight mb-3">Entries</h2>
                        <ul className="divide-y divide-surface-variant">
                            {[...points].reverse().slice(0, 10).map((p, i, arr) => {
                                const prev = arr[i + 1];
                                const delta = prev ? p.weight - prev.weight : null;
                                return (
                                    <li key={p.date} className="py-3 flex items-center justify-between gap-3">
                                        <span className="font-body-md text-on-surface">{p.label}</span>
                                        <div className="flex items-center gap-3">
                                            {delta !== null && Math.abs(delta) >= 0.05 && (
                                                <span className={`font-label-sm text-label-sm tabular-nums ${delta < 0 ? 'text-activity-green' : 'text-activity-red'}`}>
                                                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                                                </span>
                                            )}
                                            <span className="font-label-md text-label-md text-on-surface tabular-nums">{p.weight.toFixed(1)} kg</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                <Link
                    href="/dashboard"
                    className="flex items-center justify-between bg-surface-container rounded-3xl px-5 py-4 active:scale-[0.98] transition-transform"
                >
                    <span className="font-label-md text-label-md text-on-surface">Back to dashboard</span>
                    <ChevronRight size={18} className="text-on-surface-variant" />
                </Link>
            </div>
        </AppLayout>
    );
}
