'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Hourglass, ChevronRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import MissionCompleteModal from '@/app/countdowns/components/MissionCompleteModal';

interface Countdown {
    id: string;
    title: string;
    target_date: string;
}

export default function DashboardCountdowns() {
    const { session } = useAuth();
    const [countdowns, setCountdowns] = useState<Countdown[]>([]);
    const [activeMission, setActiveMission] = useState<Countdown | null>(null);

    useEffect(() => {
        if (session?.user) {
            loadCountdowns();
        }
        
        const handleUpdate = () => loadCountdowns();
        window.addEventListener('workout_os_countdowns_updated', handleUpdate);
        return () => window.removeEventListener('workout_os_countdowns_updated', handleUpdate);
    }, [session]);

    const loadCountdowns = async () => {
        const { data, error } = await supabase
            .from('countdowns')
            .select('*')
            .order('target_date', { ascending: true })
            .limit(3);
            
        if (!error && data) {
            setCountdowns(data);
        }
    };

    const getDaysRemaining = (targetDate: string) => {
        const [year, month, day] = targetDate.split('-').map(Number);
        const target = new Date(year, month - 1, day, 0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - today.getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24));
    };

    if (countdowns.length === 0) return null;

    return (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 h-full flex flex-col mt-2 sm:mt-0">
            <MissionCompleteModal 
                countdown={activeMission} 
                isOpen={!!activeMission} 
                onClose={() => setActiveMission(null)} 
                onMissionArchived={(id) => setCountdowns(prev => prev.filter(c => c.id !== id))}
            />
            
            <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                    <Hourglass size={20} className="text-white" /> Mission Countdowns
                </h2>
                <Link href="/countdowns" className="font-label-sm text-[11px] text-[#0a84ff] hover:text-[#0a84ff]/80 uppercase tracking-wider flex items-center transition-colors btn-press">
                    View All <ChevronRight size={14} />
                </Link>
            </div>
            
    <div className="relative glass-card-premium border border-black/5 dark:border-white/10 p-5 flex-1 transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] overflow-hidden">
                
                <div className="space-y-3 relative z-10">
                {countdowns.map(countdown => {
                    const daysLeft = getDaysRemaining(countdown.target_date);
                    return (
                        <div key={countdown.id} className="flex items-center justify-between bg-surface-container/30 p-3 rounded-xl">
                            <span className="font-medium text-sm text-on-surface truncate pr-4">{countdown.title}</span>
                            <div className="flex items-center gap-1 shrink-0">
                                {daysLeft < 0 ? (
                                    <button 
                                        onClick={() => setActiveMission(countdown)}
                                        className="bg-[#0a84ff]/20 text-[#0a84ff] hover:bg-[#0a84ff] hover:text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1 shadow-sm border border-[#0a84ff]/30 btn-press"
                                    >
                                        <CheckCircle2 size={12} /> Claim
                                    </button>
                                ) : (
                                    <>
                                        <span className={`font-black text-lg ${daysLeft <= 3 ? 'text-error' : 'text-secondary'}`}>
                                            {daysLeft > 0 ? daysLeft : 'TODAY'}
                                        </span>
                                        {daysLeft > 0 && <span className="text-xs text-on-surface-variant font-bold uppercase">d</span>}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            </div>
        </section>
    );
}
