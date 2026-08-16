'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, X, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function EndOfDayBanner() {
    const router = useRouter();
    const { t } = useLanguage();
    const [visible, setVisible] = useState(false);
    const [todayKey, setTodayKey] = useState('');

    useEffect(() => {
        const check = () => {
            const now = new Date();
            const hour = now.getHours();
            const dateKey = now.toLocaleDateString('en-CA');
            setTodayKey(dateKey);

            // Only show between 8 PM (20:00) and 11:59 PM
            if (hour < 20) return;

            // Don't show if already dismissed today
            const dismissedKey = `workout_os_eod_dismissed_${dateKey}`;
            if (localStorage.getItem(dismissedKey)) return;

            // Don't show if reflection already saved today
            const reflectionKey = `workout_os_reflection_${dateKey}`;
            if (localStorage.getItem(reflectionKey)) return;

            setVisible(true);
        };

        check();
        // Re-check every 5 minutes in case user keeps the app open
        const interval = setInterval(check, 5 * 60 * 1000);

        // Auto-dismiss if reflection gets saved anywhere in the app
        const onSaved = () => setVisible(false);
        window.addEventListener('workout_os_reflection_saved', onSaved);

        return () => {
            clearInterval(interval);
            window.removeEventListener('workout_os_reflection_saved', onSaved);
        };
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(`workout_os_eod_dismissed_${todayKey}`, '1');
        setVisible(false);
    };

    const handleGoLog = () => {
        router.push('/planner?tab=reflect');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9997] flex justify-center px-3 pt-safe animate-in slide-in-from-top-2 duration-300">
            <div
                className="mt-2 w-full max-w-sm flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
                style={{
                    background: 'linear-gradient(135deg, rgba(124,77,255,0.95) 0%, rgba(99,51,220,0.95) 100%)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(16px)',
                }}
            >
                {/* Icon */}
                <div
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                    <BookOpen size={18} className="text-white" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-black leading-tight">{t('banner.eod.title') !== 'banner.eod.title' ? t('banner.eod.title') : 'End of Day Reflection'}</p>
                    <p className="text-white/70 text-[11px] font-medium mt-0.5 truncate">
                        {t('banner.eod.desc') !== 'banner.eod.desc' ? t('banner.eod.desc') : 'Log your reflection before you sleep'}
                    </p>
                </div>

                {/* CTA */}
                <button
                    onClick={handleGoLog}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black text-white transition-all active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.25)' }}
                >
                    {t('banner.eod.logIt') !== 'banner.eod.logIt' ? t('banner.eod.logIt') : 'Log It'} <ArrowRight size={11} />
                </button>

                {/* Dismiss */}
                <button
                    onClick={handleDismiss}
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                    aria-label="Dismiss"
                >
                    <X size={12} className="text-white/70" />
                </button>
            </div>
        </div>
    );
}

