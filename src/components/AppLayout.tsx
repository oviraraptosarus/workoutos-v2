'use client';

import React from 'react';
import nextDynamic from 'next/dynamic';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePathname } from 'next/navigation';
import DevDebugPanel from '@/components/DevDebugPanel';


// Dynamic imports with ssr:false to prevent prerender crashes
const BottomNav = nextDynamic(() => import('@/components/BottomNav'), { ssr: false });
const TopNav = nextDynamic(() => import('@/components/TopNav').then(m => m.TopNav), { ssr: false });
const OnboardingTourModal = nextDynamic(() => import('@/app/components/OnboardingTourModal'), { ssr: false });
const CommandPaletteModal = nextDynamic(() => import('@/app/components/CommandPaletteModal'), { ssr: false });
const GlobalAICopilot = nextDynamic(() => import('@/components/GlobalAICopilot'), { ssr: false });
const EndOfDayBanner = nextDynamic(() => import('@/components/EndOfDayBanner'), { ssr: false });
const OnboardingModal = nextDynamic(() => import('@/app/components/modals/OnboardingModal'), { ssr: false });

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {

    const { userProfile, session, isLoading } = useAuth();
    const pathname = usePathname();
    const isDashboard = pathname === '/dashboard';
    const { language } = useLanguage();
    
    // Sync context state to debug store for runtime verification
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            import('@/store/useDebugStore').then(({ useDebugStore }) => {
                useDebugStore.getState().updateContextState({
                    userId: session?.user?.id || null,
                    userEmail: session?.user?.email || null,
                    onboardingCompleted: userProfile?.onboarding_completed || false,
                    selectedLanguage: language,
                    theme: userProfile?.theme || 'system',
                    notificationPermission: 'unknown',
                    activeAiProvider: 'google (gemini)'
                });
            });
        }
    }, [session, userProfile, language]);
    
    // Determine if onboarding should show based on the completed flag
    const showOnboarding = Boolean(!isLoading && session && userProfile?.onboarding_completed === false);

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
            <EndOfDayBanner />
            {session && <OnboardingModal isOpen={showOnboarding} onComplete={() => {}} />}
            <DevDebugPanel />
        </div>
    );
}
