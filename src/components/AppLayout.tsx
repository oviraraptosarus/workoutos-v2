'use client';

import React from 'react';
import BottomNav from '@/components/BottomNav';
import OnboardingTourModal from '@/app/components/OnboardingTourModal';
import CommandPaletteModal from '@/app/components/CommandPaletteModal';

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
