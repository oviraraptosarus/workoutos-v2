'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';

interface LogHistoryCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface DayData {
    hasWorkout: boolean;
    hasWater: boolean;
    hasMeal: boolean;
}

export default function LogHistoryCalendarModal({ isOpen, onClose }: LogHistoryCalendarModalProps) {
    const { user } = useAuth();
    const { selectedDate, setOffsetDays } = useDate();
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    // State for the currently viewed month (independent of selected date)
    const [viewDate, setViewDate] = useState(() => {
        return selectedDate ? new Date(selectedDate) : new Date();
    });
    
    const [monthData, setMonthData] = useState<Record<string, DayData>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Reset viewDate when opened
    useEffect(() => {
        if (isOpen) {
            setViewDate(selectedDate ? new Date(selectedDate) : new Date());
        }
    }, [isOpen, selectedDate]);

    // Fetch data for the viewed month
    useEffect(() => {
        if (!isOpen || !user) return;
        
        let isMounted = true;
        const fetchMonthLogs = async () => {
            setIsLoading(true);
            try {
                const year = viewDate.getFullYear();
                const month = viewDate.getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                
                const startDateStr = firstDay.toLocaleDateString('en-CA');
                const endDateStr = lastDay.toLocaleDateString('en-CA');
                
                const [
                    { data: logs },
                    { data: meals },
                    { data: workouts }
                ] = await Promise.all([
                    supabase.from('daily_logs').select('date, water_ml_total').eq('user_id', user.id).gte('date', startDateStr).lte('date', endDateStr),
                    supabase.from('meal_entries').select('date').eq('user_id', user.id).gte('date', startDateStr).lte('date', endDateStr),
                    supabase.from('workout_logs').select('date, completed').eq('user_id', user.id).gte('date', startDateStr).lte('date', endDateStr)
                ]);

                if (!isMounted) return;

                const dataMap: Record<string, DayData> = {};
                
                // Initialize map with all dates in range
                for (let i = 1; i <= lastDay.getDate(); i++) {
                    const dStr = new Date(year, month, i).toLocaleDateString('en-CA');
                    dataMap[dStr] = { hasWorkout: false, hasWater: false, hasMeal: false };
                }

                logs?.forEach(log => {
                    if (dataMap[log.date] && (log.water_ml_total || 0) > 0) {
                        dataMap[log.date].hasWater = true;
                    }
                });

                meals?.forEach(meal => {
                    if (dataMap[meal.date]) {
                        dataMap[meal.date].hasMeal = true;
                    }
                });

                workouts?.forEach(workout => {
                    if (dataMap[workout.date] && workout.completed) {
                        dataMap[workout.date].hasWorkout = true;
                    }
                });

                setMonthData(dataMap);
            } catch (err) {
                console.error("Failed to fetch calendar logs", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        
        fetchMonthLogs();
        
        return () => { isMounted = false; };
    }, [isOpen, viewDate, user]);

    if (!isOpen) return null;

    const handlePrevMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleDateSelect = (day: number) => {
        const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const today = new Date();
        
        // Reset times for accurate day diff calculation
        const selectedMidnight = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        const diffTime = selectedMidnight.getTime() - todayMidnight.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        // Use the existing setOffsetDays constraint if needed, but allow selecting past days
        setOffsetDays(Math.min(diffDays, 0)); 
        onClose();
    };

    // Calendar Grid Generation
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
    
    const calendarCells = [];
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDayOfWeek; i++) {
        calendarCells.push(<div key={`empty-${i}`} className="h-14"></div>);
    }
    
    const todayStr = new Date().toLocaleDateString('en-CA');
    const selectedDateStr = selectedDate || todayStr;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const dateStr = dateObj.toLocaleDateString('en-CA');
        const isSelected = dateStr === selectedDateStr;
        const isToday = dateStr === todayStr;
        
        // Disable future dates
        const isFuture = dateObj > new Date() && !isToday; 
        
        const dayData = monthData[dateStr] || { hasWorkout: false, hasWater: false, hasMeal: false };
        
        calendarCells.push(
            <button 
                key={dateStr}
                onClick={() => handleDateSelect(d)}
                disabled={isFuture}
                className={`relative h-14 flex flex-col items-center justify-start pt-2 rounded-xl transition-all active:scale-95 ${
                    isFuture ? 'opacity-30 cursor-not-allowed' : 'hover:bg-surface-container cursor-pointer'
                }`}
            >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    isSelected 
                        ? 'bg-primary text-on-primary shadow-sm' 
                        : isToday 
                            ? 'text-primary' 
                            : 'text-on-surface'
                }`}>
                    {d}
                </div>
                
                {/* Indicators */}
                <div className="flex gap-1 mt-1">
                    {dayData.hasMeal && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />}
                    {dayData.hasWorkout && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-sm" />}
                    {dayData.hasWater && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm" />}
                </div>
            </button>
        );
    }

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative bg-background border-t border-surface-variant/50 shadow-2xl rounded-t-3xl p-5 pb-safe animate-in slide-in-from-bottom duration-300">
                {/* Handle for bottom sheet */}
                <div className="w-12 h-1.5 bg-surface-variant rounded-full mx-auto mb-4" />
                
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-xl text-on-surface flex items-center gap-2 tracking-tight">
                        <CalendarIcon size={20} className="text-primary" /> History
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors active:scale-95">
                        <X size={18} className="text-on-surface-variant" />
                    </button>
                </div>

                <div className="bg-surface-container-low rounded-[2rem] p-4 border border-surface-variant/50 shadow-sm mb-4">
                    {/* Month Controls */}
                    <div className="flex items-center justify-between mb-4 px-2">
                        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant active:scale-90">
                            <ChevronLeft size={20} />
                        </button>
                        <h4 className="font-bold text-lg text-on-surface tracking-tight">
                            {months[month]} {year}
                        </h4>
                        <button 
                            onClick={handleNextMonth} 
                            disabled={year === new Date().getFullYear() && month === new Date().getMonth()}
                            className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant disabled:opacity-30 active:scale-90"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Days of Week */}
                    <div className="grid grid-cols-7 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} className="text-center text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-y-1">
                        {calendarCells}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 px-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                        <span className="text-xs font-semibold text-on-surface-variant">Diet</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm" />
                        <span className="text-xs font-semibold text-on-surface-variant">Workout</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
                        <span className="text-xs font-semibold text-on-surface-variant">Water</span>
                    </div>
                </div>
                
            </div>
        </div>
    );

    if (mounted && typeof document !== 'undefined') {
        return createPortal(modalContent, document.body);
    }

    return null;
}
