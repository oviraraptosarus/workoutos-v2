'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import nextDynamic from 'next/dynamic';
import AppLayout from '@/components/AppLayout';
import DashboardHeader from '@/app/components/DashboardHeader';
import BentoGrid from '@/app/components/BentoGrid';
import TouchGrassNudge from '@/app/components/TouchGrassNudge';
import WeightLogCard from '@/app/components/cards/WeightLogCard';
import DashboardTasks from '@/app/components/DashboardTasks';
import QuickNotes from '@/app/components/QuickNotes';
import TimeProgressWidget from '@/app/components/TimeProgressWidget';
import DailyBriefingModal from '@/app/components/modals/DailyBriefingModal';

export default function Dashboard() {

  const { user, userProfile, isProfileLoaded, isLoading } = useAuth();
  const router = useRouter();

  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingMode, setBriefingMode] = useState<'morning'|'evening'>('morning');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/sign-up-login-screen');
      return;
    }



    if (user && isProfileLoaded) {
      // Trigger briefing on first load of the session based on time
      const todayDate = new Date().toISOString().split('T')[0];
      const hasShownBriefing = localStorage.getItem(`briefing_shown_${todayDate}`);
      
      if (!hasShownBriefing) {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            setBriefingMode('morning');
            setShowBriefing(true);
            localStorage.setItem(`briefing_shown_${todayDate}`, 'true');
        } else if (hour >= 20) {
            setBriefingMode('evening');
            setShowBriefing(true);
            localStorage.setItem(`briefing_shown_${todayDate}`, 'true');
        }
      }
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

      <DailyBriefingModal 
        isOpen={showBriefing} 
        onClose={() => setShowBriefing(false)} 
        mode={briefingMode} 
      />
    </AppLayout>
  );
}
