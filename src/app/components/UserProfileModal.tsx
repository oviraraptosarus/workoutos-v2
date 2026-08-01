'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, User, Save, Trash2, Database, Settings, LogOut, CheckCircle2, Ruler, Download, Upload, FileJson, HelpCircle, Sparkles } from 'lucide-react';
import clsx from 'clsx';


interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'profile' | 'preferences' | 'config';
}

export default function UserProfileModal({ isOpen, onClose, initialTab = 'profile' }: UserProfileModalProps) {

    const { userProfile, updateUserProfile, clearUserCache, signOut } = useAuth();
    const [formData, setFormData] = useState({ ...userProfile, units: userProfile.units || 'metric' });
    const [savedNotice, setSavedNotice] = useState(false);
    const [noticeText, setNoticeText] = useState('Settings saved to local cache!');
    const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'config'>(initialTab);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setFormData({ ...userProfile, units: userProfile.units || 'metric' });
        }
    }, [isOpen, initialTab, userProfile]);

    if (!isOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
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
        signOut();
        onClose();
    };

    const handleExportConfig = () => {
        try {
            const workoutOsData: Record<string, string> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('workout_os_')) {
                    workoutOsData[key] = localStorage.getItem(key) || '';
                }
            }

            const configData = {
                app: 'Workout OS',
                version: '2.0',
                exportedAt: new Date().toISOString(),
                userProfile: formData,
                localStorageData: workoutOsData
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configData, null, 2));
            const downloadAnchor = document.createElement('a');
            const safeUsername = (formData.username || formData.fullName || 'account').toLowerCase().replace(/[^a-z0-9]/g, '_');
            const filename = `workout_os_config_${safeUsername}_${new Date().toISOString().slice(0, 10)}.json`;
            
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", filename);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            setNoticeText('Configuration exported as JSON!');
            setSavedNotice(true);
            setTimeout(() => setSavedNotice(false), 3500);
        } catch (err) {
            console.error('Failed to export configuration', err);
            alert('Failed to export account configuration.');
        }
    };

    const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string);
                
                if (parsed.userProfile) {
                    updateUserProfile(parsed.userProfile);
                    setFormData(parsed.userProfile);
                }

                // V2 Import: Dynamic keys
                if (parsed.localStorageData) {
                    Object.entries(parsed.localStorageData).forEach(([key, value]) => {
                        if (key.startsWith('workout_os_') && typeof value === 'string') {
                            localStorage.setItem(key, value);
                        }
                    });
                }

                // V1 Legacy Import fallback
                if (parsed.dietMeals) {
                    localStorage.setItem('workout_os_diet_meals_v1', JSON.stringify(parsed.dietMeals));
                }
                if (parsed.waterLog) {
                    localStorage.setItem('workout_os_water_log', JSON.stringify(parsed.waterLog));
                }
                if (parsed.weightLogs) {
                    localStorage.setItem('workout_os_weight_log', JSON.stringify(parsed.weightLogs));
                }

                setNoticeText('Account configuration imported successfully!');
                setSavedNotice(true);
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } catch (err) {
                console.error('Failed to import configuration file', err);
                alert('Invalid JSON configuration file format. Please check the file and try again.');
            }
        };

        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-card-white dark:bg-surface-container-high border border-black/10 dark:border-white/10 rounded-3xl w-full max-w-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                
                {/* Sidebar Tabs */}
                <div className="w-full md:w-1/3 bg-surface-container-low border-r border-surface-variant p-4 flex flex-row md:flex-col gap-2 overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide md:overflow-x-visible">
                    <div className="hidden md:flex items-center gap-2 mb-6 px-2">
                        <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-sm border border-white/20">
                            {userProfile.fullName ? userProfile.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <h2 className="text-sm font-bold text-on-surface leading-tight drop-shadow-sm">Settings</h2>
                    </div>
                    
                    <button 
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className={clsx("flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors", activeTab === 'profile' ? "bg-surface-container text-secondary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high")}
                    >
                        <User size={14} /> Profile & Goals
                    </button>
                    <button 
                        type="button"
                        onClick={() => setActiveTab('preferences')}
                        className={clsx("flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors", activeTab === 'preferences' ? "bg-surface-container text-secondary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high")}
                    >
                        <Ruler size={14} /> Preferences
                    </button>
                    <button 
                        type="button"
                        onClick={() => setActiveTab('config')}
                        className={clsx("flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors", activeTab === 'config' ? "bg-surface-container text-secondary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high")}
                    >
                        <FileJson size={14} /> Import / Export
                    </button>
                    <button 
                        type="button"
                        onClick={() => {
                            onClose();
                            window.dispatchEvent(new Event('open-command-palette'));
                        }}
                        className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors text-on-surface-variant hover:bg-surface-container-high md:mt-auto border border-surface-variant"
                    >
                        <HelpCircle size={14} /> Help & Navigation
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col relative">
                    {/* Header Mobile Close */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors bg-surface-container-low border border-surface-variant shadow-sm z-10"
                    >
                        <X size={16} />
                    </button>

                    <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
                        
                        {savedNotice && (
                            <div className="bg-activity-green text-white rounded-xl p-2.5 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-md mb-4">
                                <CheckCircle2 size={16} />
                                <span>{noticeText}</span>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-sm font-bold text-on-surface border-b border-surface-variant/50 pb-2 mb-4">Profile & Goals</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:bg-card-white bg-card-white focus:border-secondary transition-colors shadow-inner"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Username</label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:bg-card-white bg-card-white focus:border-secondary transition-colors shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:bg-card-white bg-card-white focus:border-secondary transition-colors shadow-inner"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant mb-1">Primary Fitness Goal</label>
                                    <input
                                        type="text"
                                        value={formData.fitnessGoal}
                                        onChange={(e) => setFormData({ ...formData, fitnessGoal: e.target.value })}
                                        className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:bg-card-white bg-card-white focus:border-secondary transition-colors shadow-inner"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Current Weight</label>
                                        <input
                                            type="number"
                                            value={formData.currentWeight === 0 ? '' : formData.currentWeight}
                                            onChange={(e) => setFormData({ ...formData, currentWeight: Number(e.target.value) })}
                                            className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:bg-card-white bg-card-white focus:border-secondary transition-colors shadow-inner"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Target Weight</label>
                                        <input
                                            type="number"
                                            value={formData.targetWeight === 0 ? '' : formData.targetWeight}
                                            onChange={(e) => setFormData({ ...formData, targetWeight: Number(e.target.value) })}
                                            className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:bg-card-white bg-card-white focus:border-secondary transition-colors shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Height (cm)</label>
                                        <input
                                            type="number"
                                            value={formData.heightCm === 0 ? '' : formData.heightCm}
                                            onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                                            className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:bg-card-white bg-card-white focus:border-secondary transition-colors shadow-inner"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Gender (for TDEE)</label>
                                        <select
                                            value={formData.gender || 'male'}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male'|'female'|'other' })}
                                            className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:bg-card-white bg-card-white focus:border-secondary transition-colors shadow-inner"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h3 className="text-sm font-bold text-on-surface border-b border-surface-variant/50 pb-2 mb-4">Diet & Finance Targets</h3>
                                    
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Daily Calorie Limit (kcal)</label>
                                        <input
                                            type="number"
                                            value={formData.calorieGoal === 0 ? '' : formData.calorieGoal !== undefined ? formData.calorieGoal : 2200}
                                            onChange={(e) => setFormData({ ...formData, calorieGoal: e.target.value === '' ? 0 : Number(e.target.value) })}
                                            className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:bg-card-white bg-card-white focus:border-secondary transition-colors shadow-inner"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Water Goal (ml)</label>
                                        <input
                                            type="number"
                                            value={formData.waterGoalMl === 0 ? '' : formData.waterGoalMl !== undefined ? formData.waterGoalMl : 3000}
                                            onChange={(e) => setFormData({ ...formData, waterGoalMl: e.target.value === '' ? 0 : Number(e.target.value) })}
                                            className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:bg-card-white bg-card-white focus:border-secondary transition-colors shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-sm font-bold text-on-surface border-b border-surface-variant/50 pb-2 mb-4">App Preferences</h3>
                                
                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant mb-2">Measurement Units</label>
                                    <div className="flex bg-surface-container-low p-1 rounded-xl border border-surface-variant shadow-inner">
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({ ...formData, units: 'metric' })}
                                            className={clsx("flex-1 py-2 rounded-lg text-xs font-bold transition-all", formData.units === 'metric' ? 'bg-card-white shadow-sm text-secondary' : 'text-on-surface-variant hover:text-on-surface-variant dark:text-on-surface-variant')}
                                        >
                                            Metric (kg, cm, ml)
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({ ...formData, units: 'imperial' })}
                                            className={clsx("flex-1 py-2 rounded-lg text-xs font-bold transition-all", formData.units === 'imperial' ? 'bg-card-white shadow-sm text-secondary' : 'text-on-surface-variant hover:text-on-surface-variant dark:text-on-surface-variant')}
                                        >
                                            Imperial (lbs, in, oz)
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Account Created</label>
                                        <input 
                                            disabled 
                                            type="text" 
                                            value={userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'} 
                                            className="w-full bg-surface-container dark:bg-surface-container-high/50 border border-transparent rounded-xl px-3 py-2 text-sm text-on-surface-variant font-medium cursor-not-allowed" 
                                        />
                                        <p className="text-[10px] text-on-surface-variant mt-1">Graphs and historical data will track back up to this date.</p>
                                    </div>
                                    
                                </div>
                                
                                <div className="mt-6 pt-4 border-t border-surface-variant/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-on-surface dark:text-white mb-0.5">Theme</h4>
                                            <p className="text-[11px] text-on-surface-variant font-medium">Choose your preferred app appearance.</p>
                                        </div>
                                        <select
                                            value={formData.theme || 'system'}
                                            onChange={(e) => setFormData({ ...formData, theme: e.target.value as 'light' | 'dark' | 'system' })}
                                            className="bg-surface-container-low border border-surface-variant rounded-xl px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-secondary transition-colors"
                                        >
                                            <option value="system">System</option>
                                            <option value="light">Light</option>
                                            <option value="dark">Dark</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-on-surface dark:text-white mb-0.5">Language</h4>
                                            <p className="text-[11px] text-on-surface-variant font-medium">Preferred language for the interface and AI.</p>
                                        </div>
                                        <select
                                            value={formData.preferredLanguage || 'en'}
                                            onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                                            className="bg-surface-container-low border border-surface-variant rounded-xl px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-secondary transition-colors"
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                            <option value="de">German</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-on-surface dark:text-white mb-0.5">Voice Enabled</h4>
                                            <p className="text-[11px] text-on-surface-variant font-medium">Allow AVA AI to speak responses aloud.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, voiceEnabled: !formData.voiceEnabled })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.voiceEnabled ? 'bg-secondary' : 'bg-surface-container-high dark:bg-surface-container-high'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-card-white transition-transform ${formData.voiceEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-on-surface dark:text-white mb-0.5">AI Memory</h4>
                                            <p className="text-[11px] text-on-surface-variant font-medium">Allow AVA to remember past conversations.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, aiMemoryEnabled: !formData.aiMemoryEnabled })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.aiMemoryEnabled ? 'bg-secondary' : 'bg-surface-container-high dark:bg-surface-container-high'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-card-white transition-transform ${formData.aiMemoryEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-on-surface dark:text-white mb-0.5">Push Notifications</h4>
                                            <p className="text-[11px] text-on-surface-variant font-medium">Receive reminders and updates.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, notificationsEnabled: !formData.notificationsEnabled })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.notificationsEnabled ? 'bg-secondary' : 'bg-surface-container-high dark:bg-surface-container-high'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-card-white transition-transform ${formData.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-on-surface dark:text-white mb-0.5">Financial Reminders</h4>
                                            <p className="text-[11px] text-on-surface-variant font-medium">Show reminders for insurance, subscriptions, and passive income tracking on the dashboard.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, enableFinancialReminders: !formData.enableFinancialReminders })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.enableFinancialReminders ? 'bg-secondary' : 'bg-surface-container-high dark:bg-surface-container-high'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-card-white transition-transform ${formData.enableFinancialReminders ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'config' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-sm font-bold text-on-surface border-b border-surface-variant/50 pb-2 mb-4">
                                    Account Configuration (Import / Export)
                                </h3>
                                <p className="text-xs text-on-surface-variant font-medium">
                                    Backup your profile settings, macro targets, diet logs, and preferences into a JSON file, or restore them onto any device.
                                </p>

                                <div className="space-y-3 pt-2">
                                    {/* Export Button */}
                                    <button
                                        type="button"
                                        onClick={handleExportConfig}
                                        className="w-full bg-secondary text-on-secondary font-bold px-4 py-3 rounded-2xl transition-all text-xs flex items-center justify-between shadow-sm btn-press"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Download size={16} /> Export Account Configuration (.json)
                                        </span>
                                        <span className="text-[10px] uppercase bg-surface-container-high px-2 py-0.5 rounded text-white tracking-wider font-bold">JSON</span>
                                    </button>

                                    {/* Import File Button */}
                                    <div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept=".json"
                                            onChange={handleImportConfig}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface border border-surface-variant font-bold px-4 py-3 rounded-2xl transition-all text-xs flex items-center justify-between shadow-sm btn-press"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Upload size={16} className="text-on-surface-variant" /> Import Account Configuration
                                            </span>
                                            <span className="text-[10px] uppercase bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant tracking-wider font-bold">Select File</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Cache tab removed */}

                        {/* Save + Account actions (always visible) */}
                        <div className="pt-4 border-t border-surface-variant/50 space-y-3">
                            <button
                                type="submit"
                                className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl transition-transform active:scale-[0.98] text-sm flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Save size={16} /> Save Settings
                            </button>
                            <button
                                type="button"
                                onClick={handleSignOut}
                                className="w-full bg-error/10 hover:bg-error/20 text-error font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
