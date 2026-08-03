'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export interface UserMetadata {
    fullName?: string;
    avatarUrl?: string;
    avatarPath?: string;
    [key: string]: string | number | boolean | undefined;
}

export interface UserProfile {
    fullName: string;
    username: string;
    email: string;
    fitnessGoal: string;
    currentWeight: number;
    targetWeight: number;
    waterGoalMl: number;
    calorieGoal: number;
    monthlyBudget: number;
    monthlyIncome?: number;
    enableFinancialReminders: boolean;
    dob?: string;
    heightCm: number;
    gender: 'male' | 'female' | 'other';
    sleepGoal?: number;
    units: 'metric' | 'imperial';
    theme: 'light' | 'dark' | 'system';
    avatarPath?: string;
    voiceEnabled: boolean;
    aiMemoryEnabled: boolean;
    preferredAiVoice?: string;
    preferredLanguage: string;
    notificationsEnabled: boolean;
    streamingResponsesEnabled: boolean;
    targetConfig?: any;
    createdAt?: string;
    updatedAt: string;
    timezone?: string;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
    accepted_terms?: boolean;
    accepted_privacy?: boolean;
    terms_version?: string;
    privacy_version?: string;
    accepted_at?: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
    fullName: '',
    username: '',
    email: '',
    fitnessGoal: 'Build Muscle & Hypertrophy',
    currentWeight: 75,
    targetWeight: 80,
    waterGoalMl: 3000,
    calorieGoal: 2600,
    monthlyBudget: 1200,
    monthlyIncome: 2000,
    sleepGoal: 8,
    enableFinancialReminders: true,
    heightCm: 170,
    gender: 'male',
    units: 'metric',
    theme: 'system',
    voiceEnabled: true,
    aiMemoryEnabled: true,
    preferredLanguage: 'en',
    notificationsEnabled: true,
    streamingResponsesEnabled: true,
    targetConfig: {},
    updatedAt: new Date().toISOString()
};

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile;
    session: Session | null;
    loading: boolean;
    isLoading: boolean;
    signUp: (email: string, password: string, metadata?: UserMetadata & Partial<UserProfile>) => Promise<any>;
    signIn: (email?: string, password?: string) => Promise<unknown>;
    signInWithGoogle: () => Promise<void>;
    login: (email?: string, password?: string) => Promise<unknown>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
    clearUserCache: () => void;
    getCurrentUser: () => Promise<User | null>;
    isEmailVerified: () => boolean;
    getUserProfile: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial session load
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        }).catch((err) => {
            console.error('Error fetching Supabase session:', err);
            setLoading(false);
        });

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription?.unsubscribe();
    }, []);

    // Load profile from Supabase when user changes
    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (!error && data) {
                        setUserProfile({
                            fullName: data.full_name || '',
                            username: data.username || '',
                            email: data.email || user.email || '',
                            fitnessGoal: data.fitness_goal || DEFAULT_USER_PROFILE.fitnessGoal,
                            currentWeight: Number(data.current_weight) || DEFAULT_USER_PROFILE.currentWeight,
                            targetWeight: Number(data.target_weight) || DEFAULT_USER_PROFILE.targetWeight,
                            waterGoalMl: data.water_goal_ml || DEFAULT_USER_PROFILE.waterGoalMl,
                            calorieGoal: data.calorie_goal || DEFAULT_USER_PROFILE.calorieGoal,
                            sleepGoal: data.sleep_goal || DEFAULT_USER_PROFILE.sleepGoal,
                            monthlyBudget: data.monthly_budget || DEFAULT_USER_PROFILE.monthlyBudget,
                            monthlyIncome: data.monthly_income || DEFAULT_USER_PROFILE.monthlyIncome,
                            enableFinancialReminders: data.enable_financial_reminders !== false,
                            dob: data.dob,
                            heightCm: Number(data.height_cm) || DEFAULT_USER_PROFILE.heightCm,
                            gender: data.gender || DEFAULT_USER_PROFILE.gender,
                            units: data.units || DEFAULT_USER_PROFILE.units,
                            theme: data.theme || DEFAULT_USER_PROFILE.theme,
                            avatarPath: data.avatar_path,
                            voiceEnabled: data.voice_enabled ?? DEFAULT_USER_PROFILE.voiceEnabled,
                            aiMemoryEnabled: data.ai_memory_enabled ?? DEFAULT_USER_PROFILE.aiMemoryEnabled,
                            preferredAiVoice: data.preferred_ai_voice,
                            preferredLanguage: data.preferred_language || DEFAULT_USER_PROFILE.preferredLanguage,
                            notificationsEnabled: data.notifications_enabled ?? DEFAULT_USER_PROFILE.notificationsEnabled,
                            streamingResponsesEnabled: data.target_config?.streaming_responses_enabled ?? DEFAULT_USER_PROFILE.streamingResponsesEnabled,
                            targetConfig: data.target_config || {},
                            createdAt: user.created_at || data.created_at || new Date().toISOString(),
                            updatedAt: data.updated_at || new Date().toISOString()
                        });

                    } else {
                        throw new Error('Profile not found');
                    }
                } catch (error) {
                    // Fallback to minimal profile if not found in DB yet
                    setUserProfile(prev => ({
                        ...prev,
                        email: user.email || '',
                        fullName: user.user_metadata?.full_name || '',
                        createdAt: user.created_at || new Date().toISOString()
                    }));
                }
            } else {
                setUserProfile(DEFAULT_USER_PROFILE);
            }
        };

        fetchProfile();
    }, [user]);

    const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
        const next = { ...userProfile, ...updates, updatedAt: new Date().toISOString() };
        setUserProfile(next);
        
        if (user) {
            const fallbackEmail = next.email || user.email || '';
            const fallbackUsername = fallbackEmail 
                ? fallbackEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(Math.random() * 10000)
                : `user_${Math.floor(Math.random() * 1000000)}`;

            const { error } = await supabase.from('profiles').upsert({
                id: user.id,
                email: fallbackEmail,
                full_name: next.fullName,
                username: next.username || fallbackUsername,
                current_weight: next.currentWeight,
                target_weight: next.targetWeight,
                fitness_goal: next.fitnessGoal,
                enable_financial_reminders: next.enableFinancialReminders,
                dob: next.dob || null,
                height_cm: next.heightCm,
                gender: next.gender,
                calorie_goal: next.calorieGoal,
                sleep_goal: next.sleepGoal,
                monthly_budget: next.monthlyBudget,
                monthly_income: next.monthlyIncome,
                water_goal_ml: next.waterGoalMl,
                units: next.units,
                theme: next.theme,
                avatar_path: next.avatarPath,
                voice_enabled: next.voiceEnabled,
                ai_memory_enabled: next.aiMemoryEnabled,
                preferred_ai_voice: next.preferredAiVoice,
                preferred_language: next.preferredLanguage,
                notifications_enabled: next.notificationsEnabled,
                target_config: {
                    ...(next.targetConfig || {}),
                    streaming_responses_enabled: next.streamingResponsesEnabled
                },
                updated_at: next.updatedAt
            }, { onConflict: 'id' });
            
            if (error) {
                console.error("Failed to update profile in Supabase:", error);
                throw error;
            }
        }
    };

    const clearUserCache = () => {
        setUserProfile(DEFAULT_USER_PROFILE);
    };

    // Email/Password Sign Up
    const signUp = async (email: string, password: string, metadata: UserMetadata & Partial<UserProfile> = {}) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: metadata?.fullName || email.split('@')[0],
                    avatar_url: metadata?.avatarUrl || '',
                    accepted_terms: metadata?.accepted_terms,
                    accepted_privacy: metadata?.accepted_privacy,
                    terms_version: metadata?.terms_version,
                    privacy_version: metadata?.privacy_version,
                    accepted_at: metadata?.accepted_at
                }
            }
        });
        
        if (error) throw error;
        
        if (typeof window !== 'undefined' && metadata?.username) {
            localStorage.setItem('workoutos_remembered_username', metadata.username);
        }

        return data;
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });
        if (error) throw error;
    };

    // Email/Password Sign In (Supports Username)
    const signIn = async (identifier?: string, password?: string) => {
        if (!identifier || !password) {
            throw new Error('Email/Username and password are required to sign in.');
        }

        let emailToUse = identifier;

        // If identifier does not look like an email, assume it is a username
        if (!identifier.includes('@')) {
            const { data, error } = await supabase.rpc('get_email_by_username', { p_username: identifier.toLowerCase() });
            if (error) {
                console.error("Error looking up username:", error);
                throw new Error('Could not find that username.');
            }
            if (!data) {
                throw new Error('Username not found.');
            }
            emailToUse = data;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: emailToUse,
            password
        });
        
        if (error) throw error;
        
        // Remember the username/email
        if (typeof window !== 'undefined') {
            localStorage.setItem('workoutos_remembered_username', identifier);
        }
        
        return data;
    };

    const login = async (email?: string, password?: string) => {
        return signIn(email, password);
    };

    // Sign Out
    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        clearUserCache();
    };

    // Reset Password
    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/sign-up-login-screen?view=reset` : undefined,
        });
        if (error) throw error;
    };

    // Get Current User
    const getCurrentUser = async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    };

    // Check if Email is Verified
    const isEmailVerified = () => {
        return user?.email_confirmed_at != null;
    };

    // Get User Profile from Database directly
    const getUserProfile = async () => {
        if (!user) return null;
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        if (error) throw error;
        return data;
    };

    const value: AuthContextType = {
        user,
        userProfile,
        session,
        loading,
        isLoading: loading,
        signUp,
        signIn,
        signInWithGoogle,
        login: signIn,
        signOut,
        resetPassword,
        updateUserProfile,
        clearUserCache,
        getCurrentUser,
        isEmailVerified,
        getUserProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
