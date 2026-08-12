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
import TimeProgressWidget from '@/app/components/TimeProgressWidget';
import DailyBriefingModal from '@/app/components/modals/DailyBriefingModal';
import IOSDatePicker from '@/app/components/IOSDatePicker';
import DashboardCountdowns from '@/app/components/DashboardCountdowns';
import VaultWidget from '@/app/components/VaultWidget';
import DashboardEditModal, { DashboardWidgetConfig } from '@/app/components/modals/DashboardEditModal';
import { Settings2 } from 'lucide-react';

const WIDGET_COMPONENTS: Record<string, React.FC<any>> = {
    'BentoGrid': BentoGrid,
    'TouchGrassNudge': TouchGrassNudge,
    'WeightLogCard': WeightLogCard,
    'TimeProgressWidget': TimeProgressWidget,
    'DashboardTasks': DashboardTasks,
    'DashboardCountdowns': DashboardCountdowns,
    'VaultWidget': VaultWidget
};

const DEFAULT_LAYOUT: DashboardWidgetConfig[] = [
    { id: 'BentoGrid', visible: true },
    { id: 'TouchGrassNudge', visible: true },
    { id: 'WeightLogCard', visible: true },
    { id: 'TimeProgressWidget', visible: true },
    { id: 'DashboardTasks', visible: true },
    { id: 'DashboardCountdowns', visible: true },
    { id: 'VaultWidget', visible: true }
];

export default function Dashboard() {

  const { user, userProfile, updateUserProfile, isProfileLoaded, isLoading } = useAuth();
  const router = useRouter();

  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingMode, setBriefingMode] = useState<'morning'|'evening'>('morning');
  const [showDOBModal, setShowDOBModal] = useState(false);
  const [dob, setDob] = useState(new Date(2000, 0, 1));
  const [savingDob, setSavingDob] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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

  const layoutConfig = (userProfile?.dashboard_config as DashboardWidgetConfig[]) || DEFAULT_LAYOUT;
  
  // Sort layout into 2 columns for smaller widgets, full width for big ones
  const activeWidgets = layoutConfig.filter(w => w.visible);
  
  const handleSaveLayout = async (newLayout: DashboardWidgetConfig[]) => {
      await updateUserProfile({ dashboard_config: newLayout });
  };

  if (!user) return null;

  return (
    <AppLayout>
      <div className="flex flex-col w-full gap-4 sm:gap-6 pb-12 animate-fade-in relative">
        <DashboardHeader />

        {/* Dynamic Layout Rendering */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-0">
            {activeWidgets.map(w => {
                const Component = WIDGET_COMPONENTS[w.id];
                if (!Component) return null;
                
                const isFullWidth = ['BentoGrid', 'TouchGrassNudge', 'WeightLogCard', 'VaultWidget'].includes(w.id);
                
                return (
                    <div key={w.id} className={`${isFullWidth ? 'md:col-span-2' : ''} ${w.id === 'TouchGrassNudge' ? 'pt-2' : ''}`}>
                        <Component />
                    </div>
                );
            })}
        </div>

        {/* Customize Dashboard Button */}
        <div className="mt-4 flex justify-center">
            <button 
                onClick={() => setShowEditModal(true)}
                className="px-6 py-3 rounded-full bg-surface-container-low hover:bg-surface-container border border-surface-variant text-on-surface-variant hover:text-on-surface transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
                title="Customize Dashboard"
            >
                <Settings2 size={16} />
                Customize Dashboard
            </button>
        </div>
      </div>

      <DashboardEditModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveLayout}
      />

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
