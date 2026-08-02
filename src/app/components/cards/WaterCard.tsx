'use client';

import React from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

const QUICK_ADD_ML = 250;

export default function WaterCard() {
    const { userProfile } = useAuth();
    const { selectedDate, isToday } = useDate();
    const router = useRouter();
    const { t } = useLanguage();
    const [currentMl, setCurrentMl] = React.useState(0);
    const [loaded, setLoaded] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [splash, setSplash] = React.useState(false);

    React.useEffect(() => {
        if (!selectedDate) return;
        const loadWater = async () => {
            const { getWaterForDate } = await import('@/app/diet/services/dietStorage');
            const saved = await getWaterForDate(selectedDate);
            setCurrentMl(saved || 0);
            setLoaded(true);
        };

        loadWater();

        window.addEventListener('workout_os_water_updated', loadWater);
        return () => window.removeEventListener('workout_os_water_updated', loadWater);
    }, [selectedDate, isToday]);

    const goalMl = userProfile?.waterGoalMl || 3000;
    const level = Math.min((currentMl / goalMl) * 100, 100);
    const reached = currentMl >= goalMl;

    // Logs straight from the dashboard — the card used to only navigate away.
    const quickAdd = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (saving || !selectedDate) return;
        setSaving(true);
        const next = currentMl + QUICK_ADD_ML;
        setCurrentMl(next); // optimistic
        setSplash(true);
        setTimeout(() => setSplash(false), 600);
        try {
            const { addWaterLog } = await import('@/app/diet/services/dietStorage');
            await addWaterLog(selectedDate, QUICK_ADD_ML, 'Dashboard');
        } catch {
            setCurrentMl((v) => Math.max(v - QUICK_ADD_ML, 0));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            onClick={() => router.push('/water')}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') router.push('/water'); }}
            aria-label="Hydration details"
            className="bg-card-white dark:bg-surface-container-lowest rounded-3xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/5 flex flex-col h-full relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
        >
            {/* Liquid fill — rises with intake */}
            <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{
                    height: `${level}%`,
                    transition: 'height 700ms cubic-bezier(0.32,0.72,0,1)',
                }}
                aria-hidden="true"
            >
                <svg
                    className="absolute -top-3 left-0 w-[200%] h-4 animate-water-wave"
                    viewBox="0 0 200 20"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M0 10 Q 25 2, 50 10 T 100 10 T 150 10 T 200 10 V20 H0 Z"
                        className="fill-activity-blue/20"
                    />
                </svg>
                <div className="w-full h-full bg-activity-blue/20" />
            </div>

            <div className="relative flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-activity-blue text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant truncate">{t('dash.water')}</span>
                </div>
                <ChevronRight size={16} className="text-on-surface-variant/50 shrink-0" />
            </div>

            <div className="relative mt-auto">
                <div className="flex items-baseline gap-1 flex-wrap h-10">
                    {loaded ? (
                        <>
                            <span className={`font-headline-lg text-headline-lg text-on-surface tabular-nums leading-none transition-transform ${splash ? 'scale-110' : 'scale-100'}`} style={{ transitionDuration: '300ms' }}>
                                {currentMl}
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">ml</span>
                        </>
                    ) : (
                        <div className="h-8 w-16 bg-surface-variant/50 animate-pulse rounded-md my-auto"></div>
                    )}
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                    {reached ? 'Goal reached' : `of ${goalMl} ml`}
                </p>

                {isToday && (
                    <button
                        onClick={quickAdd}
                        disabled={saving}
                        aria-label={`Add ${QUICK_ADD_ML} millilitres of water`}
                        className="mt-2.5 w-full flex items-center justify-center gap-1 bg-primary text-on-primary font-label-md text-label-md py-2 rounded-full active:scale-95 transition-transform disabled:opacity-50"
                    >
                        <Plus size={14} /> {QUICK_ADD_ML}
                    </button>
                )}
            </div>
        </div>
    );
}
