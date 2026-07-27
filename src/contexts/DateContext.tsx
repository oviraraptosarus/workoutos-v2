'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DateContextType {
    selectedDate: string; // YYYY-MM-DD
    setSelectedDate: (date: string) => void;
    offsetDays: number; // 0 = today, -1 = yesterday, etc.
    setOffsetDays: (offset: number) => void;
    isToday: boolean;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: React.ReactNode }) {
    const [offsetDays, setOffsetDays] = useState(0);
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setSelectedDate(`${yyyy}-${mm}-${dd}`);
    }, [offsetDays]);

    const isToday = offsetDays === 0;

    return (
        <DateContext.Provider value={{ selectedDate, setSelectedDate, offsetDays, setOffsetDays, isToday }}>
            {children}
        </DateContext.Provider>
    );
}

export function useDate() {
    const context = useContext(DateContext);
    if (context === undefined) {
        throw new Error('useDate must be used within a DateProvider');
    }
    return context;
}
