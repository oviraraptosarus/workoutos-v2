'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, ChevronDown, ChevronLeft, ChevronRight, Database, LogOut, User, Settings, Sparkles, Moon, Sun } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { useTheme } from '@/contexts/ThemeContext';
import UserProfileModal from './UserProfileModal';
import BiWeeklyReportModal from './BiWeeklyReportModal';

const GREETING_BY_HOUR = (h: number) => {
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
};

export default function DashboardHeader() {
    const { userProfile, signOut } = useAuth();
    const { offsetDays, setOffsetDays, selectedDate, isToday } = useDate();
    const { theme, toggleTheme } = useTheme();
    const [greeting, setGreeting] = useState('Good morning');
    const [dateStr, setDateStr] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [profileTab, setProfileTab] = useState<'profile' | 'preferences' | 'cache'>('profile');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [reportReady, setReportReady] = useState(false);
    
    // Mock notifications state
    const [notifications, setNotifications] = useState<any[]>([]);
    


    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const displayName = userProfile?.fullName ? userProfile.fullName.split(' ')[0] : (userProfile?.username || 'Friend');
    const initial = displayName.charAt(0).toUpperCase();

    useEffect(() => {
        if (!selectedDate) return;
        const d = new Date(selectedDate);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        setDateStr(`${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`);
    }, [selectedDate]);

    useEffect(() => {
        const now = new Date();
        const h = now.getHours();
        setGreeting(GREETING_BY_HOUR(h));

        // Check if report is ready
        const savedReport = localStorage.getItem('workout_os_biweekly_report');
        if (savedReport) {
            setReportReady(true);
        }
    }, []);

    // Re-check when modal closes in case they deleted it or generated it
    useEffect(() => {
        if (!isReportOpen) {
            const savedReport = localStorage.getItem('workout_os_biweekly_report');
            setReportReady(!!savedReport);
        }
    }, [isReportOpen]);



    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = () => {
        setIsDropdownOpen(false);
        signOut();
    };

    return (
        <div className="space-y-4">

            {/* Header Main Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AppLogo size={38} className="hidden sm:block shrink-0" />
                    <div className="flex flex-col items-start">
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none drop-shadow-sm">
                            {greeting}, {displayName}
                        </h1>
                        <div className="flex items-center gap-2 mt-1.5 sm:mt-1">
                            <button 
                                onClick={() => setOffsetDays(Math.max(offsetDays - 1, -14))}
                                disabled={offsetDays <= -14}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors text-gray-500 dark:text-gray-400"
                            >
                                <ChevronLeft size={12} />
                            </button>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-bold whitespace-nowrap select-none">
                                {isToday ? 'Today, ' : ''}{dateStr || 'Loading...'}
                            </p>
                            <button 
                                onClick={() => setOffsetDays(Math.min(offsetDays + 1, 0))}
                                disabled={isToday}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors text-gray-500 dark:text-gray-400"
                            >
                                <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Notification Bell */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className="relative p-2.5 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm btn-press"
                            aria-label="Notifications"
                        >
                            <Bell size={18} />
                            {(notifications.length > 0 || reportReady) && (
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white" />
                            )}
                        </button>
                        
                        {isNotifOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase">Notifications</h3>
                                        {notifications.length > 0 && (
                                            <span onClick={() => setNotifications([])} className="text-[10px] text-blue-600 dark:text-blue-400 font-bold cursor-pointer hover:underline">Mark all read</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsNotifOpen(false);
                                            setIsReportOpen(true);
                                        }}
                                        className={`w-full mt-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                            reportReady 
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                                                : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'
                                        }`}
                                    >
                                        <Sparkles size={14} /> {reportReady ? 'View AI Report (Ready)' : 'Generate 14-Day AI Report'}
                                    </button>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-xs font-medium">
                                            No new notifications.
                                        </div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div key={n.id} className="px-4 py-3 border-b border-gray-50 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer last:border-0">
                                                <p className="text-xs font-bold text-gray-900 dark:text-gray-200">{n.title}</p>
                                                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">{n.desc}</p>
                                                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold mt-1">{n.time}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Profile Pill & Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm btn-press border border-gray-200 dark:border-slate-700"
                        >
                            <div className="w-6 h-6 rounded-full bg-blue-500/80 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                                {initial}
                            </div>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 hidden sm:block">
                                {userProfile?.username || userProfile?.fullName?.split(' ')[0] || 'User'}
                            </span>
                            <ChevronDown size={14} className="text-gray-600 dark:text-gray-400 dark:text-gray-500" />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800">
                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate drop-shadow-sm">{userProfile.fullName}</p>
                                    <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium truncate">{userProfile.email}</p>
                                </div>

                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            setProfileTab('profile');
                                            setIsProfileOpen(true);
                                        }}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/50 flex items-center gap-2 transition-colors"
                                    >
                                        <User size={14} className="text-gray-500 dark:text-gray-400 dark:text-gray-500" /> Profile & Goals
                                    </button>
                                </div>

                                <div className="pt-1 border-t border-gray-100 dark:border-slate-800">
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-900/20 flex items-center gap-2 transition-colors"
                                    >
                                        <LogOut size={14} /> Log Out / Switch Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {/* User Profile & Cache Modal */}
            <UserProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                initialTab={profileTab}
            />

            <BiWeeklyReportModal 
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
            />
        </div>
    );
}