'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { getIncome, deleteTransaction, IncomeItem } from '../services/budgetStorage';

export default function IncomeTable() {
    const [income, setIncome] = useState<IncomeItem[]>([]);
    const [highlight, setHighlight] = useState(false);
    const [query, setQuery] = useState('');
    const [source, setSource] = useState('all');
    const [pendingId, setPendingId] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => setIncome(await getIncome());
        load();

        window.addEventListener('workout_os_budget_updated', load);

        const handleHighlight = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.target === 'budget_income') {
                setHighlight(true);
                setTimeout(() => setHighlight(false), 2000);
            }
        };
        window.addEventListener('workout_os_highlight', handleHighlight);

        return () => {
            window.removeEventListener('workout_os_budget_updated', load);
            window.removeEventListener('workout_os_highlight', handleHighlight);
        };
    }, []);

    // Sources are derived from the data so the filter never offers an empty option.
    const sources = useMemo(
        () => [...new Set(income.map((i) => i.source).filter(Boolean))].sort(),
        [income]
    );

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return income.filter((item) => {
            if (source !== 'all' && item.source !== source) return false;
            if (!q) return true;
            return (
                item.description?.toLowerCase().includes(q) ||
                item.source?.toLowerCase().includes(q)
            );
        });
    }, [income, query, source]);

    const totalIncome = visible.reduce((acc, curr) => acc + curr.amount, 0);
    const isFiltered = query.trim() !== '' || source !== 'all';

    const handleDelete = async (id: string) => {
        const previous = income;
        setIncome((list) => list.filter((i) => i.id !== id));
        setPendingId(null);
        try {
            await deleteTransaction(id);
        } catch {
            setIncome(previous);
        }
    };

    return (
        <div
            className={`bg-card-white border ${
                highlight
                    ? 'border-activity-green shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                    : 'border-surface-variant'
            } p-5 sm:p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all duration-500`}
        >
            <div className="mb-5">
                <h3 className="font-headline-md text-headline-md text-on-surface tracking-tight mb-1">
                    Income log
                </h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {visible.length} {visible.length === 1 ? 'entry' : 'entries'}
                    {isFiltered ? ` of ${income.length}` : ''} • Total:{' '}
                    <span className="font-bold text-activity-green tabular-nums">
                        ₹{totalIncome.toFixed(2)}
                    </span>
                </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                <div className="relative flex-1">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                        size={14}
                    />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search income..."
                        aria-label="Search income"
                        className="w-full bg-surface-container border-none rounded-full pl-9 pr-4 py-2.5 font-body-md text-on-surface focus:ring-2 focus:ring-secondary focus:outline-none transition-shadow placeholder:text-on-surface-variant/50"
                    />
                </div>
                <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    aria-label="Filter by source"
                    className="bg-surface-container border-none rounded-full px-4 py-2.5 font-label-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer"
                >
                    <option value="all">All sources</option>
                    {sources.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
            </div>

            {visible.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="font-body-md text-on-surface-variant">
                        {income.length === 0
                            ? 'No income logged yet.'
                            : 'No income matches this filter.'}
                    </p>
                    {isFiltered && (
                        <button
                            onClick={() => {
                                setQuery('');
                                setSource('all');
                            }}
                            className="mt-3 font-label-md text-label-md text-secondary hover:underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <ul className="divide-y divide-surface-variant">
                    {visible.map((item) => (
                        <li key={item.id} className="py-3.5 flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-3">
                                    <p className="font-body-md font-semibold text-on-surface truncate">
                                        {item.description}
                                    </p>
                                    <p className="font-body-md font-bold text-activity-green tabular-nums shrink-0">
                                        +₹{item.amount.toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                                        {item.date}
                                    </span>
                                    <span className="text-on-surface-variant/30">·</span>
                                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                                        {item.source}
                                    </span>
                                </div>
                            </div>

                            {pendingId === item.id ? (
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="px-3 py-1.5 rounded-full bg-error text-on-error font-label-sm text-label-sm active:scale-95 transition-transform"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => setPendingId(null)}
                                        className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm active:scale-95 transition-transform"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setPendingId(item.id)}
                                    aria-label={`Delete ${item.description}`}
                                    className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-error-container hover:text-on-error-container active:scale-90 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
