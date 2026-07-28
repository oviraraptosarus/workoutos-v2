'use client';

import React, { useState, useEffect } from 'react';

export default function TimeProgressWidget() {
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
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-full flex flex-col justify-center min-h-[160px]">
            <div className="animate-pulse flex flex-col gap-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-2.5 bg-gray-200 rounded w-full"></div>
                <div className="h-2.5 bg-gray-200 rounded w-full"></div>
                <div className="h-2.5 bg-gray-200 rounded w-full"></div>
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors h-full">
            <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight mb-5">Time Elapsed</h3>
            
            <div className="space-y-4">
                {/* Year */}
                <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                        <span className="text-gray-500 dark:text-gray-400">Year</span>
                        <span className="text-gray-900 dark:text-white">{progress.year.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progress.year}%` }}
                        />
                    </div>
                </div>

                {/* Month */}
                <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                        <span className="text-gray-500 dark:text-gray-400">Month</span>
                        <span className="text-gray-900 dark:text-white">{progress.month.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-violet-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progress.month}%` }}
                        />
                    </div>
                </div>

                {/* Day */}
                <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                        <span className="text-gray-500 dark:text-gray-400">Today</span>
                        <span className="text-gray-900 dark:text-white">{progress.day.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-purple-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progress.day}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
