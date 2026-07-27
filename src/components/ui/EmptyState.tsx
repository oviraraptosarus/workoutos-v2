'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
}

export default function EmptyState({
    title = 'No data available',
    description = 'There are no items to display at this time.',
    action,
    icon = <Inbox size={40} className="text-zinc-500" />
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="p-4 rounded-full bg-zinc-800/50 mb-4">{icon}</div>
            <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-sm">{description}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
