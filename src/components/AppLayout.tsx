'use client';

import React, { useEffect } from 'react';
import nextDynamic from 'next/dynamic';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePathname } from 'next/navigation';



// Dynamic imports with ssr:false to prevent prerender crashes
const BottomNav = nextDynamic(() => import('@/components/BottomNav'), { ssr: false });
const QuickActionPill = nextDynamic(() => import('@/components/QuickActionPill'), { ssr: false });
const TopNav = nextDynamic(() => import('@/components/TopNav').then(m => m.TopNav), { ssr: false });
const OnboardingTourModal = nextDynamic(() => import('@/app/components/OnboardingTourModal'), { ssr: false });
const CommandPaletteModal = nextDynamic(() => import('@/app/components/CommandPaletteModal'), { ssr: false });
const GlobalAICopilot = nextDynamic(() => import('@/components/GlobalAICopilot'), { ssr: false });
const EndOfDayBanner = nextDynamic(() => import('@/components/EndOfDayBanner'), { ssr: false });
const OnboardingModal = nextDynamic(() => import('@/app/components/modals/OnboardingModal'), { ssr: false });
const DopamineVisualizer = nextDynamic(() => import('@/components/ui/DopamineVisualizer'), { ssr: false });
const QuoteSplashOverlay = nextDynamic(() => import('@/components/ui/QuoteSplashOverlay'), { ssr: false });

interface AppLayoutProps {
    children: React.ReactNode;
    hideBottomNav?: boolean;
}

export default function AppLayout({ children, hideBottomNav = false }: AppLayoutProps) {

    const { userProfile, session, isLoading, isProfileLoaded } = useAuth();
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
    
    // Determine if onboarding should show based on the completed flag or if profile doesn't exist yet (new OAuth users)
    const showOnboarding = Boolean(!isLoading && isProfileLoaded && session && (!userProfile || userProfile.onboarding_completed === false));

    return (
        <div className={`min-h-screen ${hideBottomNav ? 'pb-0' : 'pb-44 sm:pb-28'} bg-transparent relative z-10`}>
            {!hideBottomNav && <TopNav />}
            {/* TopNav is fixed at h-16 (64px); pad the scroll container so page
                headings are never hidden underneath it. */}
            <main className={`${hideBottomNav ? 'h-screen w-screen p-0 m-0 overflow-hidden' : 'max-w-5xl mx-auto p-4 sm:px-8 pt-20 sm:pt-24'}`}>
                {children}
            </main>
            {!hideBottomNav && (
                <>
                    <QuickActionPill />
                    <BottomNav />
                </>
            )}
            <OnboardingTourModal />
            <CommandPaletteModal />
            <GlobalAICopilot />
            <EndOfDayBanner />
            <DopamineVisualizer />
            <QuoteSplashOverlay />
            {session && <OnboardingModal isOpen={showOnboarding} onComplete={() => {}} />}
        </div>
    );
}
