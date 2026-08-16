'use client';
import React, { useState, useEffect, useRef, UIEvent } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const ITEM_HEIGHT = 44;

interface IOSDatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    minYear?: number;
    maxYear?: number;
}

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
};

const WheelPicker = ({ items, selectedIndex, onChange }: { items: (string | number)[], selectedIndex: number, onChange: (idx: number) => void }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isScrolling, setIsScrolling] = useState(false);

    useEffect(() => {
        if (containerRef.current && !isScrolling) {
            containerRef.current.scrollTop = selectedIndex * ITEM_HEIGHT;
        }
    }, [selectedIndex, isScrolling]);

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        setIsScrolling(true);
        const scrollTop = e.currentTarget.scrollTop;
        const newIndex = Math.round(scrollTop / ITEM_HEIGHT);
        
        // Debounce the snap and onChange
        clearTimeout((window as any).scrollTimeout);
        (window as any).scrollTimeout = setTimeout(() => {
            setIsScrolling(false);
            if (newIndex !== selectedIndex && newIndex >= 0 && newIndex < items.length) {
                onChange(newIndex);
            }
        }, 150);
    };

    return (
        <div 
            ref={containerRef}
            className="h-[220px] overflow-y-auto overflow-x-hidden snap-y snap-mandatory hide-scrollbar flex-1 relative"
            onScroll={handleScroll}
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <div className="py-[88px]">
                {items.map((item, idx) => (
                    <div 
                        key={idx} 
                        className={`h-[44px] flex items-center justify-center snap-center text-lg font-medium transition-all duration-200
                            ${idx === selectedIndex ? 'text-on-surface opacity-100 scale-110' : 'text-on-surface-variant opacity-40 scale-90'}`}
                    >
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function IOSDatePicker({ value, onChange, minYear, maxYear }: IOSDatePickerProps) {
    const [month, setMonth] = useState(value.getMonth());
    const [day, setDay] = useState(value.getDate());
    const [year, setYear] = useState(value.getFullYear());

    const currentYear = new Date().getFullYear();
    const resolvedMaxYear = maxYear ?? currentYear;
    const resolvedMinYear = minYear ?? currentYear - 100;
    const years = Array.from({ length: resolvedMaxYear - resolvedMinYear + 1 }, (_, i) => resolvedMaxYear - i);
    
    const daysInMonth = getDaysInMonth(month, year);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    useEffect(() => {
        // Adjust day if month changes and the new month has fewer days
        const maxDay = getDaysInMonth(month, year);
        if (day > maxDay) {
            setDay(maxDay);
            onChange(new Date(year, month, maxDay));
        } else {
            onChange(new Date(year, month, day));
        }
    }, [month, day, year]);

    const handleMonthChange = (idx: number) => setMonth(idx);
    
    const handleDayChange = (idx: number) => {
        // days array is 1-indexed for the user, but idx is 0-indexed
        setDay(idx + 1);
    };

    const handleYearChange = (idx: number) => {
        setYear(years[idx]);
    };

    return (
        <div className="relative w-full max-w-sm mx-auto bg-surface-container rounded-3xl p-4 overflow-hidden shadow-inner border border-surface-variant/30">
            {/* Selection Highlight Overlay */}
            <div className="absolute top-1/2 left-4 right-4 h-[44px] -translate-y-1/2 bg-on-surface/5 rounded-xl pointer-events-none border border-on-surface/10" />
            
            {/* Gradient Mask for fading out top/bottom */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-surface-container via-transparent to-surface-container z-10" 
                 style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 20%, transparent 80%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 20%, transparent 80%, black 100%)' }} />

            <div className="flex justify-between items-center relative z-0 h-[220px]">
                <WheelPicker 
                    items={months.map(m => m.slice(0, 3))} // Jan, Feb
                    selectedIndex={month} 
                    onChange={handleMonthChange} 
                />
                <WheelPicker 
                    items={days} 
                    selectedIndex={day - 1} 
                    onChange={handleDayChange} 
                />
                <WheelPicker 
                    items={years} 
                    selectedIndex={years.indexOf(year)} 
                    onChange={handleYearChange} 
                />
            </div>
            
            {/* Helper text */}
            <style jsx global>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}
