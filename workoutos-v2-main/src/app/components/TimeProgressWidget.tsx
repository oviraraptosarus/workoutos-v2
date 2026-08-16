'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useEffect } from 'react';
import { Hourglass } from 'lucide-react';

export default function TimeProgressWidget() {
    const { t } = useLanguage();
    const [progress, setProgress] = useState({
        year: 0,
        month: 0,
        day: 0
    });

    useEffect(() => {
        const calculateProgress = () => {
            const now = new Date();
            
            // Year Progress
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
            const yearProgress = ((now.getTime() - startOfYear.getTime()) / (endOfYear.getTime() - startOfYear.getTime())) * 100;
            
            // Month Progress
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const monthProgress = ((now.getTime() - startOfMonth.getTime()) / (endOfMonth.getTime() - startOfMonth.getTime())) * 100;
            
            // Day Progress
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            const dayProgress = ((now.getTime() - startOfDay.getTime()) / (endOfDay.getTime() - startOfDay.getTime())) * 100;
            
            setProgress({
                year: Math.min(100, Math.max(0, yearProgress)),
                month: Math.min(100, Math.max(0, monthProgress)),
                day: Math.min(100, Math.max(0, dayProgress))
            });
        };

        calculateProgress();
        const interval = setInterval(calculateProgress, 60000); // Update every minute
        
        return () => clearInterval(interval);
    }, []);

    // Prevent hydration mismatch by returning a skeleton if 0
    if (progress.year === 0) return (
        <div className="glass-card-premium p-4 sm:p-5 h-full flex flex-col justify-center min-h-[160px]">
            <div className="animate-pulse flex flex-col gap-4">
                <div className="h-4 bg-surface-container rounded w-1/3"></div>
                <div className="h-2.5 bg-surface-container rounded w-full"></div>
                <div className="h-2.5 bg-surface-container rounded w-full"></div>
                <div className="h-2.5 bg-surface-container rounded w-full"></div>
            </div>
        </div>
    );

    return (
        <section className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                    <Hourglass size={20} className="text-primary" />
                    {t('dash.timeProgression')}
                </h3>
            </div>
            
            <div className="glass-card-premium p-4 sm:p-5 transition-all h-full relative overflow-hidden hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] border border-white/10 flex-1">
            
            <div className="space-y-4 relative z-10">
                {/* Year */}
                <div>
                    <div className="flex justify-between items-center font-label-sm text-[11px] mb-1.5 uppercase tracking-wider">
                        <span className="text-on-surface-variant">{t('dash.year')}</span>
                        <span className="text-on-surface">{progress.year.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-secondary rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,88,190,0.3)]"
                            style={{ width: `${progress.year}%` }}
                        />
                    </div>
                </div>

                {/* Month */}
                <div>
                    <div className="flex justify-between items-center font-label-sm text-[11px] mb-1.5 uppercase tracking-wider">
                        <span className="text-on-surface-variant">{t('dash.month')}</span>
                        <span className="text-on-surface">{progress.month.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-activity-blue rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                            style={{ width: `${progress.month}%` }}
                        />
                    </div>
                </div>

                {/* Day */}
                <div>
                    <div className="flex justify-between items-center font-label-sm text-[11px] mb-1.5 uppercase tracking-wider">
                        <span className="text-on-surface-variant">{t('dash.today')}</span>
                        <span className="text-on-surface">{progress.day.toFixed(1)}%</span>
                    </div>

                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-activity-green rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                            style={{ width: `${progress.day}%` }}
                        />
                    </div>
                </div>
            </div>
            </div>
        </section>
    );
}
