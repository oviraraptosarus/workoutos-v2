'use client';

import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
    className?: string;
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
    const variantStyles = {
        default: 'bg-white/10 text-white border-white/20/20',
        success: 'bg-white/10 text-white border-white/20/20',
        warning: 'bg-white/10 text-white border-white/20/20',
        danger: 'bg-white/10 text-white border-white/20/20',
        outline: 'bg-zinc-800/50 text-zinc-300 border-zinc-700'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}>
            {children}
        </span>
    );
}
