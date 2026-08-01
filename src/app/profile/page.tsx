'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useProfileStats } from '@/lib/hooks/useProfileStats';
import AppLayout from '@/components/AppLayout';

export default function ProfilePage() {
    const { userProfile, updateUserProfile, clearUserCache, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const stats = useProfileStats();
    const [formData, setFormData] = useState({ units: 'metric', ...userProfile });
    const [savedNotice, setSavedNotice] = useState(false);
    const [noticeText, setNoticeText] = useState('Settings saved to local cache!');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Real join date from profiles.created_at — replaces the former hardcoded tier badge.
    const memberSince = userProfile?.createdAt
        ? new Date(userProfile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
        : null;

    useEffect(() => {
        setFormData({ units: 'metric', ...userProfile });
    }, [userProfile]);

    const handleSave = () => {
        updateUserProfile(formData);
        if (formData.calorieGoal !== undefined) {
            localStorage.setItem('workout_os_calorie_goal', formData.calorieGoal.toString());
        }
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('workout_os_budget_updated'));
        setNoticeText('Settings saved successfully!');
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);
    };

    const handleSignOut = () => {
        if (confirm('Are you sure you want to sign out?')) {
            signOut();
            window.location.href = '/';
        }
    };

    return (
        <AppLayout>
            {savedNotice && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-activity-green text-white px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-top-4 flex items-center gap-2 text-sm font-medium">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    {noticeText}
                </div>
            )}

            <div className="flex flex-col w-full gap-bento-gap pb-12 animate-fade-in">
                
                {/* Profile Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-surface-container-highest p-6 shadow-sm mt-4">
                    {memberSince && (
                        <div className="absolute top-0 right-0 p-4">
                            <div className="flex items-center gap-1 bg-surface-container-low px-3 py-1 rounded-full">
                                <span className="material-symbols-outlined text-[14px] text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Since {memberSince}</span>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col items-center gap-4 relative z-10">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-surface-container-lowest shadow-xl flex items-center justify-center bg-primary text-white text-3xl font-display-lg">
                                {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 bg-activity-green border-4 border-surface-container-highest rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[16px]">check</span>
                            </div>
                        </div>
                        <div className="text-center flex flex-col items-center">
                            <input 
                                className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface bg-transparent text-center focus:outline-none border-b border-transparent focus:border-outline-variant w-full"
                                value={formData.fullName || ''}
                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                onBlur={handleSave}
                                placeholder="Your Name"
                            />
                            <input 
                                className="font-body-md text-on-surface-variant bg-transparent text-center focus:outline-none w-full"
                                value={formData.fitnessGoal || ''}
                                onChange={(e) => setFormData({...formData, fitnessGoal: e.target.value})}
                                onBlur={handleSave}
                                placeholder="Elite Performance Athlete"
                            />
                        </div>
                        <div className="grid grid-cols-3 w-full gap-2 mt-2">
                            <div className="bg-surface-container-low p-3 rounded-2xl text-center">
                                <p className="font-label-sm text-label-sm text-on-surface-variant">Level</p>
                                <p className="font-headline-md text-headline-md text-primary tabular-nums">
                                    {stats.loading ? '—' : stats.level}
                                </p>
                            </div>
                            <div className="bg-surface-container-low p-3 rounded-2xl text-center">
                                <p className="font-label-sm text-label-sm text-on-surface-variant">Streak</p>
                                <p className="font-headline-md text-headline-md text-activity-red tabular-nums">
                                    {stats.loading ? '—' : `${stats.currentStreak}d`}
                                </p>
                            </div>
                            <div className="bg-surface-container-low p-3 rounded-2xl text-center">
                                <p className="font-label-sm text-label-sm text-on-surface-variant">Best</p>
                                <p className="font-headline-md text-headline-md text-secondary tabular-nums">
                                    {stats.loading ? '—' : `${stats.bestStreak}d`}
                                </p>
                            </div>
                        </div>
                        {!stats.loading && (
                            <p className="font-label-sm text-label-sm text-on-surface-variant text-center">
                                {stats.daysLogged === 0
                                    ? 'Log a day to start your streak'
                                    : `${stats.daysLogged} ${stats.daysLogged === 1 ? 'day' : 'days'} logged · ${stats.daysToNextLevel} to level ${stats.level + 1}`}
                            </p>
                        )}
                    </div>
                    {/* Ambient Background Glow */}
                    <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-secondary/10 blur-3xl rounded-full"></div>
                </div>

                {/* Main Bento Grid */}
                <div className="flex flex-col gap-bento-gap">
                    
                    {/* Personal Information Card */}
                    <div className="bg-card-white p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-transform active:scale-[0.98]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-headline-md text-headline-md text-on-surface">Personal Info</h2>
                            <button onClick={handleSave} className="text-secondary font-label-md">Save</button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 bg-surface-container-lowest rounded-2xl border border-surface-variant/50 focus-within:border-secondary">
                                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-on-primary-fixed-variant">mail</span>
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Email</span>
                                    <input 
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="font-body-md text-on-surface bg-transparent focus:outline-none w-full"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-surface-container-lowest rounded-2xl border border-surface-variant/50 focus-within:border-secondary">
                                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-on-primary-fixed-variant">monitor_weight</span>
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Body Weight (kg)</span>
                                    <input 
                                        type="number"
                                        value={formData.currentWeight || ''}
                                        onChange={(e) => setFormData({...formData, currentWeight: Number(e.target.value)})}
                                        className="font-body-md text-on-surface bg-transparent focus:outline-none w-full"
                                        placeholder="75"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-surface-container-lowest rounded-2xl border border-surface-variant/50 focus-within:border-secondary">
                                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-on-primary-fixed-variant">straighten</span>
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Height (cm)</span>
                                    <input 
                                        type="number"
                                        value={formData.heightCm || ''}
                                        onChange={(e) => setFormData({...formData, heightCm: Number(e.target.value)})}
                                        className="font-body-md text-on-surface bg-transparent focus:outline-none w-full"
                                        placeholder="180"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Targets Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card-white p-5 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-4 focus-within:ring-2 ring-primary/10 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-activity-red/10 text-activity-red flex items-center justify-center">
                                <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
                            </div>
                            <div>
                                <h3 className="font-label-md text-label-md text-on-surface">Calorie Goal</h3>
                                <input 
                                    type="number"
                                    value={formData.calorieGoal || ''}
                                    onChange={(e) => setFormData({...formData, calorieGoal: Number(e.target.value)})}
                                    onBlur={handleSave}
                                    className="font-body-lg text-on-surface bg-transparent focus:outline-none w-full font-bold mt-1"
                                    placeholder="2200"
                                />
                            </div>
                        </div>
                        <div className="bg-card-white p-5 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-4 focus-within:ring-2 ring-primary/10 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-activity-blue/10 text-activity-blue flex items-center justify-center">
                                <span className="material-symbols-outlined text-[20px]">water_drop</span>
                            </div>
                            <div>
                                <h3 className="font-label-md text-label-md text-on-surface">Water Goal (ml)</h3>
                                <input 
                                    type="number"
                                    value={formData.waterGoalMl || ''}
                                    onChange={(e) => setFormData({...formData, waterGoalMl: Number(e.target.value)})}
                                    onBlur={handleSave}
                                    className="font-body-lg text-on-surface bg-transparent focus:outline-none w-full font-bold mt-1"
                                    placeholder="3000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* App Preferences Split Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Appearance — single source of truth for theme */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            aria-pressed={theme === 'dark'}
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            className="bg-card-white p-5 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-4 text-left transition-transform active:scale-[0.97]"
                        >
                            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                                <span className="material-symbols-outlined text-on-surface transition-transform duration-300" style={{ transform: theme === 'dark' ? 'rotate(-20deg)' : 'none' }}>
                                    {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-label-md text-label-md text-on-surface">Appearance</h3>
                                <p className="font-label-sm text-label-sm text-on-surface-variant">
                                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                </p>
                            </div>
                            {/* Segments reflect the active theme rather than decorating */}
                            <div className="mt-auto flex gap-1" aria-hidden="true">
                                <div className={`h-1.5 flex-1 rounded-full transition-colors ${theme === 'light' ? 'bg-primary' : 'bg-surface-container-high'}`}></div>
                                <div className={`h-1.5 flex-1 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-surface-container-high'}`}></div>
                            </div>
                        </button>
                        
                        {/* Reminders Toggle */}
                        <div className="bg-card-white p-5 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-4 cursor-pointer" onClick={() => {
                            setFormData({...formData, enableFinancialReminders: !formData.enableFinancialReminders});
                            setTimeout(handleSave, 50);
                        }}>
                            <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center">
                                <span className="material-symbols-outlined text-on-secondary-fixed-variant">notifications_active</span>
                            </div>
                            <div>
                                <h3 className="font-label-md text-label-md text-on-surface">Fin Reminders</h3>
                                <p className="font-label-sm text-label-sm text-on-surface-variant">{formData.enableFinancialReminders ? 'Enabled' : 'Disabled'}</p>
                            </div>
                            <div className={`relative w-10 h-5 rounded-full mt-auto self-end transition-colors ${formData.enableFinancialReminders ? 'bg-activity-green' : 'bg-surface-container-high'}`}>
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.enableFinancialReminders ? 'right-1' : 'left-1'}`}></div>
                            </div>
                        </div>
                    </div>

                    {/* Account Actions Card */}
                    <div className="bg-inverse-surface p-6 rounded-3xl shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-surface-glass/20 backdrop-blur-md flex items-center justify-center">
                                <span className="material-symbols-outlined text-surface-bright">manage_accounts</span>
                            </div>
                            <h2 className="font-headline-md text-headline-md text-white">Account</h2>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-error/10 hover:bg-error/20 transition-colors active:scale-[0.98]"
                        >
                            <span className="material-symbols-outlined text-error">logout</span>
                            <span className="font-body-md text-error">Sign Out</span>
                        </button>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
