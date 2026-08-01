'use client';

import React from 'react';
import nextDynamic from 'next/dynamic';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';


// Dynamic imports with ssr:false to prevent prerender crashes
const BottomNav = nextDynamic(() => import('@/components/BottomNav'), { ssr: false });
const TopNav = nextDynamic(() => import('@/components/TopNav').then(m => m.TopNav), { ssr: false });
const OnboardingTourModal = nextDynamic(() => import('@/app/components/OnboardingTourModal'), { ssr: false });
const CommandPaletteModal = nextDynamic(() => import('@/app/components/CommandPaletteModal'), { ssr: false });
const GlobalAICopilot = nextDynamic(() => import('@/components/GlobalAICopilot'), { ssr: false });
const OnboardingModal = nextDynamic(() => import('@/app/components/modals/OnboardingModal'), { ssr: false });

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {

    const { userProfile, session } = useAuth();
    const pathname = usePathname();
    const isDashboard = pathname === '/dashboard';
    
    // Determine if onboarding should show. dob is a required field in onboarding,
    // making it a reliable indicator of profile completion.
    const showOnboarding = Boolean(
        session && userProfile && !userProfile.dob
    );

    return (
        <div className="min-h-screen pb-44 sm:pb-28 bg-transparent relative z-10">
            {!isDashboard && <TopNav />}
            {/* TopNav is fixed at h-16 (64px); pad the scroll container so page
                headings are never hidden underneath it. */}
            <main className={`max-w-5xl mx-auto p-4 sm:px-8 ${isDashboard ? 'pt-4' : 'pt-20 sm:pt-24'}`}>
                {children}
            </main>
            <BottomNav />
            <OnboardingTourModal />
            <CommandPaletteModal />
            <GlobalAICopilot />
            {session && <OnboardingModal isOpen={showOnboarding} onComplete={() => {}} />}
        </div>
    );
}
