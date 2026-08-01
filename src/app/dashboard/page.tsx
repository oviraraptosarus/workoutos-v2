'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import nextDynamic from 'next/dynamic';
import AppLayout from '@/components/AppLayout';
import DashboardHeader from '@/app/components/DashboardHeader';
import BentoGrid from '@/app/components/BentoGrid';
import TouchGrassNudge from '@/app/components/TouchGrassNudge';
import WeightLogCard from '@/app/components/cards/WeightLogCard';
import DashboardTasks from '@/app/components/DashboardTasks';
import QuickNotes from '@/app/components/QuickNotes';
import TimeProgressWidget from '@/app/components/TimeProgressWidget';


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
    <AppLayout>
      <div className="flex flex-col w-full gap-4 sm:gap-6 pb-8 animate-fade-in">
        <DashboardHeader />

        <BentoGrid />

        <div className="pt-2">
          <TouchGrassNudge />
        </div>

        <WeightLogCard />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex flex-col gap-4 sm:gap-6">
             <TimeProgressWidget />
             <QuickNotes />
          </div>
          <div className="h-full">
             <DashboardTasks />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
