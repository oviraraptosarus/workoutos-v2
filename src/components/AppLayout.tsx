'use client';

import React from 'react';
import nextDynamic from 'next/dynamic';

// Dynamic imports with ssr:false to prevent prerender crashes
const BottomNav = nextDynamic(() => import('@/components/BottomNav'), { ssr: false });
const OnboardingTourModal = nextDynamic(() => import('@/app/components/OnboardingTourModal'), { ssr: false });
const CommandPaletteModal = nextDynamic(() => import('@/app/components/CommandPaletteModal'), { ssr: false });

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="min-h-screen pb-24 bg-transparent relative z-10">
            <main className="max-w-5xl mx-auto p-4 pt-6">
                {children}
            </main>
            <BottomNav />
            <OnboardingTourModal />
            <CommandPaletteModal />
        </div>
    );
}
