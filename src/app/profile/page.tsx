'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfileStats } from '@/lib/hooks/useProfileStats';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/lib/supabase/client';
import { ChevronRight, Download, Upload, Check, AlertTriangle, MonitorSmartphone, Activity, Camera, ExternalLink, Moon, Settings, Zap, ArrowLeft, LogOut, FileText, User as UserIcon, Bell } from 'lucide-react';
import ProgressPhotosRow, { ProgressPhotoItem } from '@/components/progress/ProgressPhotosRow';
import ProgressPhotoGalleryModal from '@/components/progress/ProgressPhotoGalleryModal';
import WeightWeighInPromptModal from '@/components/progress/WeightWeighInPromptModal';
import { getLevelProgress, getNametagForLevel } from '@/lib/leveling';

// ─── Settings Row Component ───────────────────────────────────────────────────
function SettingsRow({ icon, label, value, onClick, isFirst, isLast, rightContent }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 bg-card-white hover:bg-surface-container-low transition-colors active:bg-surface-container
                ${isFirst ? 'rounded-t-2xl' : ''} 
                ${isLast ? 'rounded-b-2xl' : 'border-b border-surface-variant/40'}`}
        >
            <div className="flex items-center gap-3">
                {icon && <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{icon}</span>
                </div>}
                <span className="font-body-md text-on-surface font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className="font-body-md text-on-surface-variant text-sm truncate max-w-[120px] sm:max-w-[180px] text-right">{value}</span>}
                {rightContent}
                <ChevronRight size={16} className="text-on-surface-variant shrink-0" />
            </div>
        </button>
    );
}

function ToggleRow({ icon, label, value, onChange }: { icon: string, label: string, value: boolean, onChange: (val: boolean) => void }) {
    return (
        <div className="flex items-center justify-between p-4 bg-card-white">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{icon}</span>
                    </div>
                )}
                <span className="font-body-md text-on-surface font-medium">{label}</span>
            </div>
            <button
                onClick={() => onChange(!value)}
                className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors ${value ? 'bg-[#0a84ff]' : 'bg-surface-variant/50'}`}
            >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${value ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfileHub() {
    const router = useRouter();
    const { t } = useLanguage();
    const { user, userProfile, updateUserProfile, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { setLanguage } = useLanguage();
    const stats = useProfileStats();
    
    // View state
    const [activeSection, setActiveSection] = useState<string | null>(null);

    // Form data
    const [formData, setFormData] = useState({ ...userProfile });
    const [savedNotice, setSavedNotice] = useState(false);
    const [noticeText, setNoticeText] = useState('Settings saved!');
    const [newFoodCategory, setNewFoodCategory] = useState('');
    const [newFoodBudgetAmount, setNewFoodBudgetAmount] = useState('');

    const showNotice = () => {
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);
    };

    const handleAddFoodBudget = () => {
        if (!newFoodCategory.trim() || !newFoodBudgetAmount) return;
        const amount = Number(newFoodBudgetAmount);
        if (isNaN(amount) || amount <= 0) return;
        
        const currentBudgets = formData.foodBudgets || {};
        const updatedBudgets = { ...currentBudgets, [newFoodCategory.trim()]: amount };
        setFormData({ ...formData, foodBudgets: updatedBudgets });
        handleInputSave('foodBudgets', updatedBudgets);
        
        setNewFoodCategory('');
        setNewFoodBudgetAmount('');
    };

    const handleRemoveFoodBudget = (category: string) => {
        const currentBudgets = { ...(formData.foodBudgets || {}) };
        delete currentBudgets[category];
        setFormData({ ...formData, foodBudgets: currentBudgets });
        handleInputSave('foodBudgets', currentBudgets);
    };

    // Notification settings states
    const [notifSettings, setNotifSettings] = useState({
        planner_reminders: true,
        habit_reminders: true,
        budget_alerts: true,
        weekly_reports: true,
        ai_insights: true,
        notification_sound: true,
        vibration_enabled: true,
        push_enabled: true,
        email_enabled: false
    });

    useEffect(() => {
        if (!user) return;
        const fetchNotifSettings = async () => {
            const { data } = await supabase.from('notification_settings').select('*').eq('user_id', user.id).maybeSingle();
            if (data) setNotifSettings(data);
        };
        fetchNotifSettings();
    }, [user]);

    const updateNotifSetting = async (key: string, value: boolean) => {
        if (key === 'push_enabled' && value === true) {
            if (typeof window !== 'undefined' && 'Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    alert('You must allow notifications in your browser settings to receive push alerts.');
                    return;
                }
            } else {
                alert('Push notifications are not supported in your browser.');
                return;
            }
        }

        setNotifSettings(prev => ({ ...prev, [key]: value }));
        if (user) {
            await supabase.from('notification_settings').upsert({ user_id: user.id, [key]: value }, { onConflict: 'user_id' });
            showNotice();
        }
    };

    // Weight trend
    const [currentWeightVal, setCurrentWeightVal] = useState<number | null>(null);

    // Progress photos
    const [photos, setPhotos] = useState<ProgressPhotoItem[]>([]);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryInitialPhotoId, setGalleryInitialPhotoId] = useState<string | undefined>(undefined);
    const [showWeighInPrompt, setShowWeighInPrompt] = useState(false);

    // Import/export
    const importRef = useRef<HTMLInputElement>(null);

    // ── sync formData when profile loads ──
    useEffect(() => {
        setFormData({ ...userProfile });
    }, [userProfile]);

    // ── Load weight trend (for current weight snapshot) ──
    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from('daily_logs')
                .select('weight_kg')
                .eq('user_id', user.id)
                .not('weight_kg', 'is', null)
                .order('date', { ascending: false })
                .limit(1);
            if (data && data.length > 0) {
                setCurrentWeightVal(data[0].weight_kg);
            }
        };
        load();
    }, []);

    // ── Load progress photos ──
    const fetchPhotos = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
            .from('progress_photos')
            .select('*')
            .eq('user_id', user.id)
            .order('uploaded_at', { ascending: true });
        if (error || !data) return;
        
        const loaded: ProgressPhotoItem[] = [];
        for (const row of data) {
            const { data: fileData } = await supabase.storage
                .from('progress_photos')
                .download(row.storage_path);
            if (fileData) {
                const displayLabel = new Date(row.taken_at || row.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                loaded.push({
                    id: row.id,
                    storage_path: row.storage_path,
                    uploaded_at: row.uploaded_at,
                    taken_at: row.taken_at,
                    weight_snapshot: row.weight_snapshot,
                    notes: row.notes,
                    dataUrl: URL.createObjectURL(fileData),
                    label: displayLabel
                });
            }
        }
        setPhotos(loaded);
    }, []);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    // ── Save ──
    const handleSave = useCallback(async () => {
        await updateUserProfile(formData);

        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('workout_os_budget_updated'));
        setNoticeText('Settings saved!');
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
    }, [formData, updateUserProfile]);

    const handleInputSave = (key: keyof typeof formData, value: any) => {
        const newData = { ...formData, [key]: value };
        setFormData(newData);
        updateUserProfile({ [key]: value });
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
    };

    // ── Sign out ──
    const handleSignOut = () => {
        if (confirm('Are you sure you want to sign out?')) {
            signOut();
            window.location.href = '/';
        }
    };

    // ── Export config ──
    const handleExport = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setNoticeText('Generating backup...');
        setSavedNotice(true);

        const tables = ['daily_logs', 'meal_entries', 'expenses', 'workout_logs', 'tasks', 'milestones', 'injury_logs', 'bloodwork_entries'];
        const backup: Record<string, any> = {
            app: 'Workout OS',
            version: '2.0',
            exportedAt: new Date().toISOString(),
            userProfile: formData,
        };

        for (const t of tables) {
            const { data } = await supabase.from(t).select('*').eq('user_id', user.id);
            if (data) backup[t] = data;
        }

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workout_os_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        setNoticeText('Backup exported!');
        setTimeout(() => setSavedNotice(false), 2500);
    };

    // ── Import config ──
    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setNoticeText('Restoring backup...');
        setSavedNotice(true);
        
        const reader = new FileReader();
        reader.onload = async ev => {
            try {
                const parsed = JSON.parse(ev.target?.result as string);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                if (parsed.userProfile) { 
                    await updateUserProfile(parsed.userProfile); 
                    setFormData(parsed.userProfile); 
                }

                const tables = ['daily_logs', 'meal_entries', 'expenses', 'workout_logs', 'tasks', 'milestones', 'injury_logs', 'bloodwork_entries'];
                for (const t of tables) {
                    if (parsed[t] && Array.isArray(parsed[t])) {
                        const rows = parsed[t].map((r: any) => ({ ...r, user_id: user.id }));
                        if (rows.length > 0) {
                            await supabase.from(t).upsert(rows);
                        }
                    }
                }
                
                setNoticeText('Backup restored! Reloading…');
                setTimeout(() => window.location.reload(), 1200);
            } catch (err) {
                console.error(err);
                alert('Invalid JSON file or restore failed.'); 
                setSavedNotice(false);
            }
        };
        reader.readAsText(file);
    };

    const renderHeader = () => {
        const xp = formData.xp || 0;
        const { currentLevel, nextLevelXP, currentLevelXP, progressPercent } = getLevelProgress(xp);
        const { name: tag, colorClass, bgClass } = getNametagForLevel(currentLevel);

        return (
            <div className="flex flex-col items-center pt-8 pb-6 animate-fade-in relative">
                {/* Level Badge */}
                <div className="relative mb-6 group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
                    <div className="relative w-28 h-28 rounded-full bg-surface-container-lowest border-[3px] border-surface-variant flex items-center justify-center shadow-2xl overflow-hidden">
                        {formData.avatarPath ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={formData.avatarPath} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-5xl font-display-lg text-primary">
                                {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                            </span>
                        )}
                        
                        {/* Current Level Overlay at bottom of circle */}
                        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-black/40 backdrop-blur-md flex items-center justify-center">
                            <span className="text-white text-xs font-bold tracking-widest uppercase">Lvl {currentLevel}</span>
                        </div>
                    </div>
                </div>

                <h1 className="font-headline-md text-3xl font-bold text-on-surface tracking-tight">
                    {formData.fullName || 'User Profile'}
                </h1>
                <p className="text-on-surface-variant font-medium mt-1">@{formData.username || 'username'}</p>
                
                {/* Reddit-style Nametag */}
                <div className={`mt-3 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-sm border border-white/5 ${bgClass} ${colorClass}`}>
                    <Zap size={14} className="fill-current" />
                    {tag}
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-xs mt-8">
                    <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                        <span>{xp - currentLevelXP} XP</span>
                        <span>{nextLevelXP - currentLevelXP} XP to Lvl {Math.min(50, currentLevel + 1)}</span>
                    </div>
                    <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div 
                            className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(var(--primary-rgb),0.6)]"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderQuickStats = () => (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-1 mb-8">
            <div className="bg-card-white p-4 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t('profile.weight')}</span>
                <span className="text-xl font-bold text-on-surface">{currentWeightVal ?? (formData.currentWeight || '—')} <span className="text-sm font-medium text-on-surface-variant">kg</span></span>
            </div>
            <div className="bg-card-white p-4 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t('profile.goal')}</span>
                <span className="text-xl font-bold text-on-surface">{formData.targetWeight || '—'} <span className="text-sm font-medium text-on-surface-variant">kg</span></span>
            </div>
            <div className="bg-card-white p-4 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t('profile.calories')}</span>
                <span className="text-xl font-bold text-activity-red">{formData.calorieGoal || '—'}</span>
            </div>
            <div className="bg-card-white p-4 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t('profile.water')}</span>
                <span className="text-xl font-bold text-activity-blue">{formData.waterGoalMl ? `${(formData.waterGoalMl / 1000).toFixed(1)}L` : '—'}</span>
            </div>
        </div>
    );

    // ─── Sub-views ──────────────────────────────────────────────────────────────
    
    if (activeSection === 'profile') {
        return (
            <AppLayout>
                <div className="pb-12 animate-in slide-in-from-right-4 duration-200">
                    <button onClick={() => setActiveSection(null)} className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-6 font-medium">
                        <ArrowLeft size={18} /> Back to Hub
                    </button>
                    <h2 className="text-2xl font-bold mb-6">{t('profile.settings')}</h2>
                    <div className="bg-card-white rounded-2xl shadow-sm border border-surface-variant/30 overflow-hidden divide-y divide-surface-variant/40">
                        {[
                            { label: t('profile.fullName'), key: 'fullName', type: 'text' },
                            { label: t('profile.username'), key: 'username', type: 'text' },
                            { label: 'Date of Birth', key: 'dob', type: 'date' },
                            { label: t('profile.height'), key: 'heightCm', type: 'number' },
                            { label: t('profile.currentWeight'), key: 'currentWeight', type: 'number' },
                            { label: t('profile.targetWeight'), key: 'targetWeight', type: 'number' },
                            { label: t('profile.fitnessGoal'), key: 'fitnessGoal', type: 'text' },
                            { label: t('profile.calorieGoal'), key: 'calorieGoal', type: 'number' },
                            { label: 'Daily Burn Goal', key: 'daily_burn_goal', type: 'number' },
                            { label: t('profile.waterGoal'), key: 'waterGoalMl', type: 'number' },
                        ].map(f => (
                            <div key={f.key} className="p-4 flex items-center justify-between">
                                <label className="font-medium text-sm text-on-surface w-1/3">{f.label}</label>
                                <input
                                    type={f.type}
                                    value={(formData as any)[f.key] || ''}
                                    onChange={e => setFormData({ ...formData, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                                    onBlur={() => handleSave()}
                                    className="bg-surface-container rounded-xl px-3 py-2 text-sm text-on-surface text-right w-2/3 focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (activeSection === 'preferences') {
        return (
            <AppLayout>
                <div className="pb-12 animate-in slide-in-from-right-4 duration-200">
                    <button onClick={() => setActiveSection(null)} className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-6 font-medium">
                        <ArrowLeft size={18} /> Back to Hub
                    </button>
                    <h2 className="text-2xl font-bold mb-6">{t('profile.preferences')}</h2>
                    <div className="bg-card-white rounded-2xl shadow-sm border border-surface-variant/30 overflow-hidden divide-y divide-surface-variant/40">
                        <div className="p-4 flex items-center justify-between">
                            <label className="font-medium text-sm text-on-surface">{t('profile.theme')}</label>
                            <div className="flex bg-surface-container-low p-1 rounded-xl">
                                {['light', 'dark', 'system'].map(themeOption => (
                                    <button
                                        key={themeOption}
                                        onClick={() => {
                                            setFormData({ ...formData, theme: themeOption as any });
                                            if (themeOption !== 'system') {
                                                if (themeOption === 'light' && theme === 'dark') toggleTheme();
                                                if (themeOption === 'dark' && theme === 'light') toggleTheme();
                                            }
                                            handleInputSave('theme', themeOption);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${formData.theme === themeOption ? 'bg-card-white shadow-sm text-secondary' : 'text-on-surface-variant'}`}
                                    >
                                        {themeOption}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <label className="font-medium text-sm text-on-surface">{t('profile.units')}</label>
                            <div className="flex bg-surface-container-low p-1 rounded-xl">
                                {['metric', 'imperial'].map(unitOption => (
                                    <button
                                        key={unitOption}
                                        onClick={() => handleInputSave('units', unitOption)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${formData.units === unitOption ? 'bg-card-white shadow-sm text-secondary' : 'text-on-surface-variant'}`}
                                    >
                                        {t(`units.${unitOption}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <label className="font-medium text-sm text-on-surface">{t('profile.theme') || 'Theme'}</label>
                            <select 
                                value={formData.theme || 'system'}
                                onChange={e => {
                                    handleInputSave('theme', e.target.value);
                                    if (e.target.value === 'light' || e.target.value === 'dark' || e.target.value === 'system') {
                                        // Wait, ThemeContext might not have setTheme. Let's rely on AuthContext.
                                        // If toggleTheme just toggles dark/light, maybe I should just use toggleTheme.
                                        // Actually, if AuthContext saves it, the whole app re-renders.
                                    }
                                }}
                                className="bg-surface-container rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none"
                            >
                                <option value="system">System</option>
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                            </select>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <label className="font-medium text-sm text-on-surface">{t('profile.language')}</label>
                            <select 
                                value={formData.preferredLanguage || 'en'}
                                onChange={e => {
                                    handleInputSave('preferredLanguage', e.target.value);
                                    if (e.target.value === 'en' || e.target.value === 'te') {
                                        setLanguage(e.target.value as 'en' | 'te');
                                    }
                                }}
                                className="bg-surface-container rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none"
                            >
                                <option value="en">English</option>
                                <option value="te">తెలుగు</option>
                            </select>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <label className="font-medium text-sm text-on-surface">{t('profile.notifications')}</label>
                                <span className="text-xs text-on-surface-variant">{t('profile.dailyReminders')}</span>
                            </div>
                            <button
                                onClick={() => handleInputSave('notificationsEnabled', !formData.notificationsEnabled)}
                                className={`relative w-12 h-7 rounded-full transition-colors ${formData.notificationsEnabled ? 'bg-[#0a84ff]' : 'bg-surface-container-high'}`}
                            >
                                <span className={`absolute top-1 w-5 h-5 bg-card-white rounded-full transition-transform shadow ${formData.notificationsEnabled ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <label className="font-medium text-sm text-on-surface">{t('profile.financialReminders')}</label>
                                <span className="text-xs text-on-surface-variant">{t('profile.subscriptionAlerts')}</span>
                            </div>
                            <button
                                onClick={() => handleInputSave('enableFinancialReminders', !formData.enableFinancialReminders)}
                                className={`relative w-12 h-7 rounded-full transition-colors ${formData.enableFinancialReminders ? 'bg-[#0a84ff]' : 'bg-surface-container-high'}`}
                            >
                                <span className={`absolute top-1 w-5 h-5 bg-card-white rounded-full transition-transform shadow ${formData.enableFinancialReminders ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <label className="font-medium text-sm text-on-surface">{t('profile.timezone') !== 'profile.timezone' ? t('profile.timezone') : 'Timezone'}</label>
                            <select 
                                value={formData.timezone || 'UTC'}
                                onChange={e => handleInputSave('timezone', e.target.value)}
                                className="bg-surface-container rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none"
                            >
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">Eastern Time (ET)</option>
                                <option value="America/Chicago">Central Time (CT)</option>
                                <option value="America/Denver">Mountain Time (MT)</option>
                                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                <option value="Europe/London">London (GMT)</option>
                                <option value="Asia/Kolkata">India (IST)</option>
                            </select>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <div className="flex flex-col">
                                <label className="font-medium text-sm text-on-surface">{t('profile.quietHours') !== 'profile.quietHours' ? t('profile.quietHours') : 'Quiet Hours'}</label>
                                <span className="text-xs text-on-surface-variant">Prevent notifications during these hours</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col w-full">
                                    <label className="text-xs text-on-surface-variant mb-1">{t('profile.quietHoursStart') !== 'profile.quietHoursStart' ? t('profile.quietHoursStart') : 'Start'}</label>
                                    <input 
                                        type="time" 
                                        value={formData.quiet_hours_start || ''} 
                                        onChange={e => handleInputSave('quiet_hours_start', e.target.value)}
                                        className="bg-surface-container rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-col w-full">
                                    <label className="text-xs text-on-surface-variant mb-1">{t('profile.quietHoursEnd') !== 'profile.quietHoursEnd' ? t('profile.quietHoursEnd') : 'End'}</label>
                                    <input 
                                        type="time" 
                                        value={formData.quiet_hours_end || ''} 
                                        onChange={e => handleInputSave('quiet_hours_end', e.target.value)}
                                        className="bg-surface-container rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold mt-8 mb-4">Food Budgets</h3>
                    <div className="bg-card-white rounded-2xl shadow-sm border border-surface-variant/30 overflow-hidden">
                        <div className="p-4 flex flex-col gap-4">
                            <p className="text-sm text-on-surface-variant">Set specific monthly budgets for categories (e.g., Protein Powder, Groceries).</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Category (e.g., Protein)"
                                    value={newFoodCategory}
                                    onChange={(e) => setNewFoodCategory(e.target.value)}
                                    className="flex-1 bg-surface-container rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none"
                                />
                                <input
                                    type="number"
                                    placeholder="Budget ($)"
                                    value={newFoodBudgetAmount}
                                    onChange={(e) => setNewFoodBudgetAmount(e.target.value)}
                                    className="w-24 bg-surface-container rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none"
                                />
                                <button
                                    onClick={handleAddFoodBudget}
                                    className="bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
                                >
                                    Add
                                </button>
                            </div>
                            
                            {formData.foodBudgets && Object.keys(formData.foodBudgets).length > 0 && (
                                <div className="mt-2 divide-y divide-surface-variant/40 border border-surface-variant/30 rounded-xl">
                                    {Object.entries(formData.foodBudgets).map(([category, amount]) => (
                                        <div key={category} className="p-3 flex items-center justify-between">
                                            <span className="text-sm font-medium text-on-surface">{category}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-on-surface-variant">${amount}</span>
                                                <button
                                                    onClick={() => handleRemoveFoodBudget(category)}
                                                    className="text-activity-red/70 hover:text-activity-red transition-colors p-1"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-bold mt-8 mb-4">{t('profile.legal') !== 'profile.legal' ? t('profile.legal') : 'Legal & Compliance'}</h3>
                    <div className="bg-card-white rounded-2xl shadow-sm border border-surface-variant/30 overflow-hidden divide-y divide-surface-variant/40">
                        <Link href="/terms" className="p-4 flex items-center justify-between hover:bg-surface-container/50 transition-colors">
                            <span className="font-medium text-sm text-on-surface">{t('profile.terms') !== 'profile.terms' ? t('profile.terms') : 'Terms of Service'}</span>
                            <ChevronRight size={16} className="text-on-surface-variant" />
                        </Link>
                        <Link href="/privacy" className="p-4 flex items-center justify-between hover:bg-surface-container/50 transition-colors">
                            <span className="font-medium text-sm text-on-surface">{t('profile.privacy') !== 'profile.privacy' ? t('profile.privacy') : 'Privacy Policy'}</span>
                            <ChevronRight size={16} className="text-on-surface-variant" />
                        </Link>
                        <Link href="/cookies" className="p-4 flex items-center justify-between hover:bg-surface-container/50 transition-colors">
                            <span className="font-medium text-sm text-on-surface">{t('profile.cookies') !== 'profile.cookies' ? t('profile.cookies') : 'Cookie Policy'}</span>
                            <ChevronRight size={16} className="text-on-surface-variant" />
                        </Link>
                        <Link href="/disclaimer" className="p-4 flex items-center justify-between hover:bg-surface-container/50 transition-colors">
                            <span className="font-medium text-sm text-on-surface">{t('profile.disclaimer') !== 'profile.disclaimer' ? t('profile.disclaimer') : 'Medical Disclaimer'}</span>
                            <ChevronRight size={16} className="text-on-surface-variant" />
                        </Link>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (activeSection === 'ai_settings') {
        return (
            <AppLayout>
                <div className="pb-12 animate-in slide-in-from-right-4 duration-200">
                    <button onClick={() => setActiveSection(null)} className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-6 font-medium">
                        <ArrowLeft size={18} /> Back to Hub
                    </button>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary">memory</span> AI Settings
                    </h2>
                    <div className="bg-card-white rounded-2xl shadow-sm border border-surface-variant/30 overflow-hidden divide-y divide-surface-variant/40">
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <label className="font-medium text-sm text-on-surface">{t('profile.voiceInput')}</label>
                                <span className="text-xs text-on-surface-variant">{t('profile.allowDictation')}</span>
                            </div>
                            <button
                                onClick={() => handleInputSave('voiceEnabled', !formData.voiceEnabled)}
                                className={`relative w-12 h-7 rounded-full transition-colors ${formData.voiceEnabled ? 'bg-[#0a84ff]' : 'bg-surface-container-high'}`}
                            >
                                <span className={`absolute top-1 w-5 h-5 bg-card-white rounded-full transition-transform shadow ${formData.voiceEnabled ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <label className="font-medium text-sm text-on-surface">{t('profile.preferredAiVoice')}</label>
                            <select 
                                value={formData.preferredAiVoice || 'default'}
                                onChange={e => handleInputSave('preferredAiVoice', e.target.value)}
                                className="bg-surface-container rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none"
                            >
                                <option value="default">{t('profile.systemDefault')}</option>
                                <option value="alloy">{t('profile.alloy')}</option>
                                <option value="echo">{t('profile.echo')}</option>
                                <option value="nova">{t('profile.nova')}</option>
                            </select>
                        </div>
                        <div className="p-4 flex items-center justify-between group cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => router.push('/settings/ai-memory')}>
                            <div className="flex flex-col">
                                <label className="font-medium text-sm text-on-surface cursor-pointer">{t('profile.aiMemory')}</label>
                                <span className="text-xs text-on-surface-variant">{t('profile.rememberPast')}</span>
                            </div>
                            <ChevronRight size={18} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <label className="font-medium text-sm text-on-surface">{t('profile.streamingResponses')}</label>
                                <span className="text-xs text-on-surface-variant">{t('profile.showAiText')}</span>
                            </div>
                            <button
                                onClick={() => handleInputSave('streamingResponsesEnabled', !formData.streamingResponsesEnabled)}
                                className={`relative w-12 h-7 rounded-full transition-colors ${formData.streamingResponsesEnabled ? 'bg-[#0a84ff]' : 'bg-surface-container-high'}`}
                            >
                                <span className={`absolute top-1 w-5 h-5 bg-card-white rounded-full transition-transform shadow ${formData.streamingResponsesEnabled ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (activeSection === 'help') {
        return (
            <AppLayout>
                <div className="pb-12 animate-in slide-in-from-right-4 duration-200">
                    <button onClick={() => setActiveSection(null)} className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-6 font-medium">
                        <ArrowLeft size={18} /> Back to Hub
                    </button>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-activity-blue">help</span> Help & Support
                    </h2>
                    
                    <div className="bg-card-white rounded-2xl shadow-sm border border-surface-variant/30 overflow-hidden divide-y divide-surface-variant/40 mb-6">
                        <button className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left">
                            <label className="font-medium text-sm text-on-surface cursor-pointer">{t('profile.helpCenter')}</label>
                            <ExternalLink size={16} className="text-on-surface-variant shrink-0" />
                        </button>
                        <button className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left">
                            <label className="font-medium text-sm text-on-surface cursor-pointer">{t('profile.shortcuts')}</label>
                            <ChevronRight size={16} className="text-on-surface-variant shrink-0" />
                        </button>
                        <button className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left">
                            <label className="font-medium text-sm text-on-surface cursor-pointer">{t('profile.walkthrough')}</label>
                            <ChevronRight size={16} className="text-on-surface-variant shrink-0" />
                        </button>
                        <button className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left">
                            <label className="font-medium text-sm text-on-surface cursor-pointer">{t('profile.reportBug')}</label>
                            <ChevronRight size={16} className="text-on-surface-variant shrink-0" />
                        </button>
                    </div>

                    <div className="bg-card-white rounded-2xl shadow-sm border border-surface-variant/30 overflow-hidden divide-y divide-surface-variant/40 mb-6">
                        <button className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left">
                            <label className="font-medium text-sm text-on-surface cursor-pointer">{t('profile.privacyPolicy')}</label>
                            <ExternalLink size={16} className="text-on-surface-variant shrink-0" />
                        </button>
                        <button className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left">
                            <label className="font-medium text-sm text-on-surface cursor-pointer">{t('profile.termsOfService')}</label>
                            <ExternalLink size={16} className="text-on-surface-variant shrink-0" />
                        </button>
                        <div className="p-4 flex items-center justify-between">
                            <label className="font-medium text-sm text-on-surface">{t('profile.appVersion')}</label>
                            <span className="text-sm font-medium text-on-surface-variant">2.0.0 (Build 42)</span>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (activeSection === 'account') {
        return (
            <AppLayout>
                <div className="pb-12 animate-in slide-in-from-right-4 duration-200">
                    <button onClick={() => setActiveSection(null)} className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-6 font-medium">
                        <ArrowLeft size={18} /> Back to Hub
                    </button>
                    <h2 className="text-2xl font-bold mb-6">{t('profile.accountData')}</h2>
                    
                    <div className="bg-card-white rounded-2xl shadow-sm border border-surface-variant/30 overflow-hidden divide-y divide-surface-variant/40 mb-6">
                        <div className="p-4 flex items-center justify-between">
                            <label className="font-medium text-sm text-on-surface">{t('profile.emailAddress')}</label>
                            <span className="text-sm font-medium text-on-surface-variant">{formData.email}</span>
                        </div>
                        <button className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left">
                            <label className="font-medium text-sm text-on-surface cursor-pointer">{t('profile.changePassword')}</label>
                            <ChevronRight size={16} className="text-on-surface-variant shrink-0" />
                        </button>
                    </div>

                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 px-2">{t('profile.dataManagement')}</h3>
                    <div className="bg-card-white rounded-2xl shadow-sm border border-surface-variant/30 overflow-hidden divide-y divide-surface-variant/40 mb-8">
                        <button onClick={handleExport} className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left">
                            <div className="flex items-center gap-3">
                                <Download size={18} className="text-secondary" />
                                <label className="font-medium text-sm text-on-surface cursor-pointer">{t('profile.exportData')}</label>
                            </div>
                        </button>
                        <input type="file" accept=".json" ref={importRef} onChange={handleImport} className="hidden" />
                        <button onClick={() => importRef.current?.click()} className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left">
                            <div className="flex items-center gap-3">
                                <Upload size={18} className="text-on-surface-variant" />
                                <label className="font-medium text-sm text-on-surface cursor-pointer">{t('profile.importBackup')}</label>
                            </div>
                        </button>
                    </div>

                    <div className="bg-error/5 rounded-2xl overflow-hidden divide-y divide-error/10 border border-error/20">
                        <button onClick={handleSignOut} className="w-full p-4 flex items-center gap-3 hover:bg-error/10 transition-colors text-left text-error font-medium">
                            <LogOut size={18} /> Sign Out
                        </button>
                        <button onClick={() => confirm('Are you sure? This cannot be undone.')} className="w-full p-4 flex items-center gap-3 hover:bg-error/10 transition-colors text-left text-error font-medium">
                            <AlertTriangle size={18} /> Delete Account
                        </button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            {/* Notifications & Alerts */}
            {activeSection === 'notifications' && (
                <div className="animate-in slide-in-from-right-4 duration-300 relative z-10 w-full h-full bg-background">
                    <div className="flex items-center gap-4 mb-6 sticky top-0 bg-background/90 backdrop-blur-md z-10 py-2 border-b border-surface-variant/30">
                        <button onClick={() => setActiveSection('main')} className="p-2 rounded-full hover:bg-surface-container active:scale-95 transition-all text-on-surface">
                            <ArrowLeft size={24} />
                        </button>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Bell size={20} className="text-primary" /> Notifications & Alerts
                        </h2>
                    </div>
                    <div className="space-y-4 pb-20">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-4 px-2">Delivery Methods</h3>
                            <div className="bg-surface-container-low rounded-2xl border border-surface-variant/30 overflow-hidden divide-y divide-surface-variant/30">
                                <ToggleRow icon="volume_up" label="Notification Sounds" value={notifSettings.notification_sound} onChange={(val) => updateNotifSetting('notification_sound', val)} />
                                <ToggleRow icon="vibration" label="Vibration" value={notifSettings.vibration_enabled} onChange={(val) => updateNotifSetting('vibration_enabled', val)} />
                                <ToggleRow icon="notifications_active" label="Push Notifications" value={notifSettings.push_enabled} onChange={(val) => updateNotifSetting('push_enabled', val)} />
                                <ToggleRow icon="mail" label="Email Notifications" value={notifSettings.email_enabled} onChange={(val) => updateNotifSetting('email_enabled', val)} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-4 px-2">Alert Types</h3>
                            <div className="bg-surface-container-low rounded-2xl border border-surface-variant/30 overflow-hidden divide-y divide-surface-variant/30">
                                <ToggleRow icon="task_alt" label="Planner Reminders" value={notifSettings.planner_reminders} onChange={(val) => updateNotifSetting('planner_reminders', val)} />
                                <ToggleRow icon="loop" label="Habit Reminders" value={notifSettings.habit_reminders} onChange={(val) => updateNotifSetting('habit_reminders', val)} />
                                <ToggleRow icon="account_balance_wallet" label="Budget Alerts" value={notifSettings.budget_alerts} onChange={(val) => updateNotifSetting('budget_alerts', val)} />
                                <ToggleRow icon="auto_awesome" label="AI Insights (Ava)" value={notifSettings.ai_insights} onChange={(val) => updateNotifSetting('ai_insights', val)} />
                                <ToggleRow icon="summarize" label="Weekly Reports" value={notifSettings.weekly_reports} onChange={(val) => updateNotifSetting('weekly_reports', val)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Help & Support */}
            {savedNotice && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-activity-green text-white px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-top-4 flex items-center gap-2 text-sm font-medium whitespace-nowrap">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    {noticeText}
                </div>
            )}

            <div className="flex flex-col w-full gap-5 pb-12 animate-fade-in">
                {renderHeader()}
                {renderQuickStats()}

                {/* Progress Photos Row in Hub */}
                <div className="bg-card-white rounded-2xl shadow-sm border border-surface-variant/30 p-5 mb-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Camera size={18} className="text-secondary" />
                        <h3 className="font-headline-md text-lg text-on-surface">{t('profile.progressPhotos')}</h3>
                    </div>
                    <ProgressPhotosRow
                        photos={photos}
                        currentWeight={currentWeightVal ?? (userProfile?.currentWeight || null)}
                        onPhotosUpdated={fetchPhotos}
                        onOpenGallery={(photoId) => {
                            setGalleryInitialPhotoId(photoId);
                            setGalleryOpen(true);
                        }}
                    />
                </div>

                {/* Main Settings List */}
                <div className="rounded-2xl shadow-sm border border-surface-variant/30 overflow-hidden">
                    <SettingsRow 
                        icon="person" 
                        label={t('profile.profile')} 
                        value={formData.fullName} 
                        onClick={() => setActiveSection('profile')} 
                        isFirst 
                    />
                    <SettingsRow 
                        icon="tune" 
                        label={t('profile.preferences')} 
                        value={formData.theme === 'dark' ? 'Dark Mode' : 'Light Mode'} 
                        onClick={() => setActiveSection('preferences')} 
                    />
                    <SettingsRow 
                        icon="notifications" 
                        label="Notifications & Alerts" 
                        onClick={() => setActiveSection('notifications')} 
                    />
                    <SettingsRow 
                        icon="memory"  
                        label={t('profile.aiSettings')} 
                        value={formData.voiceEnabled ? 'Voice On' : 'Voice Off'}
                        onClick={() => setActiveSection('ai_settings')} 
                        isLast
                    />
                </div>

                <div className="rounded-2xl shadow-sm border border-surface-variant/30 overflow-hidden mt-1">
                    <SettingsRow 
                        icon="help_outline" 
                        label={t('profile.helpSupport')} 
                        onClick={() => setActiveSection('help')} 
                        isFirst 
                    />
                    <SettingsRow 
                        icon="account_circle" 
                        label={t('profile.account')} 
                        value={formData.email}
                        onClick={() => setActiveSection('account')} 
                        isLast
                    />
                </div>
                
                <p className="text-center text-xs font-medium text-on-surface-variant/50 mt-4">
                    Workout OS v2.0 • WorkoutOS.com
                </p>
            </div>

            {/* Progress Photo Full Gallery Modal */}
            <ProgressPhotoGalleryModal
                isOpen={galleryOpen}
                initialPhotoId={galleryInitialPhotoId}
                photos={photos}
                onClose={() => setGalleryOpen(false)}
                onPhotosUpdated={fetchPhotos}
            />

            {/* 7-Day Weigh-In Photo Prompt Modal */}
            <WeightWeighInPromptModal
                isOpen={showWeighInPrompt}
                currentWeight={currentWeightVal ?? (userProfile?.currentWeight || null)}
                onClose={() => setShowWeighInPrompt(false)}
                onPhotoUploaded={fetchPhotos}
            />
        </AppLayout>
    );
}
