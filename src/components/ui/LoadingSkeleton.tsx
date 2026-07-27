'use client';

import React from 'react';

interface LoadingSkeletonProps {
    className?: string;
}

export default function LoadingSkeleton({ className = 'h-6 w-full' }: LoadingSkeletonProps) {
    return (
        <div className={`animate-pulse bg-zinc-800/60 rounded-xl ${className}`} />
    );
}
