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
import IOSDatePicker from '@/app/components/IOSDatePicker';
import DashboardCountdowns from '@/app/components/DashboardCountdowns';

export default function Dashboard() {

  const { user, userProfile, updateUserProfile, isProfileLoaded, isLoading } = useAuth();
  const router = useRouter();

  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingMode, setBriefingMode] = useState<'morning'|'evening'>('morning');
  const [showDOBModal, setShowDOBModal] = useState(false);
  const [dob, setDob] = useState(new Date(2000, 0, 1));
  const [savingDob, setSavingDob] = useState(false);

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

    if (user && isProfileLoaded && !userProfile?.dob) {
        setShowDOBModal(true);
    } else {
        setShowDOBModal(false);
    }
  }, [user, userProfile, isProfileLoaded, isLoading, router]);

  const handleSaveDOB = async () => {
      setSavingDob(true);
      try {
          await updateUserProfile({ dob: dob.toISOString().split('T')[0] });
          setShowDOBModal(false);
      } catch (err) {
          alert('Failed to save Date of Birth');
      } finally {
          setSavingDob(false);
      }
  };

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
          <div className="flex flex-col h-full gap-4 sm:gap-6">
             <DashboardTasks />
             <DashboardCountdowns />
          </div>
        </div>
      </div>

      <DailyBriefingModal 
        isOpen={showBriefing && !showDOBModal} 
        onClose={() => setShowBriefing(false)} 
        mode={briefingMode} 
      />

      {showDOBModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-card-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-surface-variant/30 flex flex-col items-center">
                <h2 className="font-display-sm text-2xl font-bold text-on-surface mb-2 text-center">When were you born?</h2>
                <p className="font-body-sm text-on-surface-variant mb-6 text-center text-sm">
                    We need your date of birth to personalize your calorie targets, milestones, and provide age-appropriate features.
                </p>
                <div className="w-full mb-6">
                    <IOSDatePicker 
                        value={dob} 
                        onChange={(d) => setDob(d)} 
                        minYear={1920} 
                        maxYear={new Date().getFullYear()} 
                    />
                </div>
                <button
                    onClick={handleSaveDOB}
                    disabled={savingDob}
                    className="w-full bg-primary text-on-primary font-label-md text-label-md h-12 rounded-xl flex items-center justify-center transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                    {savingDob ? 'Saving...' : 'Continue'}
                </button>
            </div>
        </div>
      )}
    </AppLayout>
  );
}
