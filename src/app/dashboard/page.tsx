'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import nextDynamic from 'next/dynamic';
import DashboardHeader from '@/app/components/DashboardHeader';
import GeminiFoodAssistant from '@/app/components/GeminiFoodAssistant';
import BentoGrid from '@/app/components/BentoGrid';
import TouchGrassNudge from '@/app/components/TouchGrassNudge';
import RecentActivity from '@/app/components/RecentActivity';
import WeightLogCard from '@/app/components/cards/WeightLogCard';
import DashboardTasks from '@/app/components/DashboardTasks';
import QuickNotes from '@/app/components/QuickNotes';

// Dynamic ssr:false imports to prevent server prerender crashes
const BottomNav = nextDynamic(() => import('@/components/BottomNav'), { ssr: false });
const FloatingActionMenu = nextDynamic(() => import('@/app/components/FloatingActionMenu'), { ssr: false });
const OnboardingTourModal = nextDynamic(() => import('@/app/components/OnboardingTourModal'), { ssr: false });

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/sign-up-login-screen');
    }
  }, [user, isLoading, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f7f6f0] text-stone-900 pb-32 font-sans selection:bg-emerald-100">
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <DashboardHeader />

        {/* Nova AI Copilot */}
        <GeminiFoodAssistant />

        <BentoGrid />

        <div className="pt-2">
          <TouchGrassNudge />
        </div>

        <WeightLogCard />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardTasks />
          <QuickNotes />
        </div>

        <RecentActivity />
      </main>

      <FloatingActionMenu />
      <BottomNav />
      <OnboardingTourModal />
    </div>
  );
}
