'use client';

import React from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase/client';

/** Minutes since midnight, from a Postgres `time` value like "23:30:00". */
function toMinutes(t: string | null): number | null {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    if (Number.isNaN(h)) return null;
    return h * 60 + (m || 0);
}

function fmtClock(t: string | null): string {
    const mins = toMinutes(t);
    if (mins === null) return '—';
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const suffix = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${`${m}`.padStart(2, '0')} ${suffix}`;
}

export default function SleepCard() {
    const { userProfile } = useAuth();
    const { selectedDate } = useDate();
    const { t } = useLanguage();
    const [currentSleep, setCurrentSleep] = React.useState(0);
    const [bedtime, setBedtime] = React.useState<string | null>(null);
    const [waketime, setWaketime] = React.useState<string | null>(null);
    const [hasData, setHasData] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!selectedDate) return;
        const loadSleep = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from('daily_logs')
                .select('sleep_hours, sleep_bedtime, sleep_waketime')
                .eq('user_id', user.id)
                .eq('date', selectedDate)
                .maybeSingle();

            if (data && data.sleep_hours > 0) {
                setCurrentSleep(data.sleep_hours);
                setBedtime(data.sleep_bedtime ?? null);
                setWaketime(data.sleep_waketime ?? null);
                setHasData(true);
            } else {
                setCurrentSleep(0);
                setBedtime(null);
                setWaketime(null);
                setHasData(false);
            }
            setIsLoading(false);
        };
        loadSleep();
        window.addEventListener('storage', loadSleep);
        return () => window.removeEventListener('storage', loadSleep);
    }, [selectedDate]);

    const target = userProfile?.sleepGoal || 7.5;
    const diff = currentSleep - target;
    const isOnTarget = Math.abs(diff) <= 0.5;
    const pct = Math.min(currentSleep / target, 1);

    // Semicircle arc: night runs left (bedtime) to right (wake).
    const R = 52;
    const CX = 60;
    const CY = 60;
    const arcLen = Math.PI * R;
    const hrs = Math.floor(currentSleep);
    const mins = Math.round((currentSleep - hrs) * 60);

    return (
        <Link
            href="/sleep"
            className="glass-card-premium p-4  flex flex-col h-full cursor-pointer active:scale-[0.98] transition-transform group block relative overflow-hidden"
        >
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-primary text-[18px]">dark_mode</span>
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant truncate">{t('dash.sleep')}</span>
                </div>
                <ChevronRight size={16} className="text-on-surface-variant/50 shrink-0" />
            </div>

            {hasData ? (
                <div className="flex flex-col items-center mt-auto">
                    {/* Night arc */}
                    <div className="relative shrink-0" style={{ width: 120, height: 68 }}>
                        <svg width="120" height="68" viewBox="0 0 120 68" aria-hidden="true">
                            <defs>
                                <linearGradient id="sleepArc" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#4338CA" />
                                    <stop offset="60%" stopColor="#0058be" />
                                    <stop offset="100%" stopColor="#F59E0B" />
                                </linearGradient>
                            </defs>
                            <path
                                d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
                                fill="none"
                                stroke="currentColor"
                                className="text-surface-container"
                                strokeWidth="8"
                                strokeLinecap="round"
                            />
                            <path
                                d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
                                fill="none"
                                stroke="url(#sleepArc)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={arcLen}
                                strokeDashoffset={arcLen * (1 - pct)}
                                style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.32,0.72,0,1)' }}
                            />
                        </svg>
                        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
                            <div className="flex items-baseline gap-0.5">
                                <span className="font-headline-lg text-headline-lg text-on-surface tabular-nums leading-none">{hrs}</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant">h</span>
                                {mins > 0 && (
                                    <>
                                        <span className="font-headline-md text-headline-md text-on-surface tabular-nums leading-none ml-0.5">{mins}</span>
                                        <span className="font-label-sm text-label-sm text-on-surface-variant">m</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-full space-y-1 mt-1">
                        <div className="flex items-center justify-between gap-1">
                            <span className="font-label-sm text-label-sm text-on-surface-variant">{t('dash.bed')}</span>
                            <span className="font-label-sm text-label-sm text-on-surface tabular-nums">{fmtClock(bedtime)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                            <span className="font-label-sm text-label-sm text-on-surface-variant">{t('dash.wake')}</span>
                            <span className="font-label-sm text-label-sm text-on-surface tabular-nums">{fmtClock(waketime)}</span>
                        </div>
                        <div className={`w-full text-center px-2 py-0.5 rounded-full font-label-sm text-label-sm ${isOnTarget ? 'bg-activity-green/10 text-activity-green' : 'bg-error-container text-on-error-container'}`}>
                            {diff >= 0 ? '+' : ''}{diff.toFixed(1)}h
                        </div>
                    </div>
                </div>
            ) : isLoading ? (
                <div className="flex flex-col items-center justify-center mt-auto h-full w-full opacity-60">
                    <div className="w-20 h-20 rounded-full border-4 border-surface-variant/30 border-t-surface-variant/80 animate-spin"></div>
                </div>
            ) : (
                <div className="flex flex-col items-start gap-2 mt-auto">
                    <p className="font-body-md text-on-surface-variant">Not logged</p>
                    <span className="inline-flex items-center gap-1 font-label-md text-label-md text-on-primary bg-primary px-3.5 py-2 rounded-full">
                        <Plus size={14} /> Log
                    </span>
                </div>
            )}
        </Link>
    );
}
