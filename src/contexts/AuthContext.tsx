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
    activityLevel?: string;
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
    onboarding_completed?: boolean;
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

export type { UserProfile };

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
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
    refreshProfile: () => Promise<void>;
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
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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

    const refreshProfile = async () => {
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
                        fitnessGoal: data.fitness_goal || 'Build Muscle & Stay Active',
                        currentWeight: Number(data.current_weight) || 75,
                        targetWeight: Number(data.target_weight) || 70,
                        waterGoalMl: data.water_goal_ml || 3000,
                        calorieGoal: data.calorie_goal || 2200,
                        sleepGoal: data.sleep_goal || 8,
                        monthlyBudget: data.monthly_budget || 1000,
                        monthlyIncome: data.monthly_income || 2000,
                        enableFinancialReminders: data.enable_financial_reminders !== false,
                        dob: data.dob,
                        heightCm: Number(data.height_cm) || 170,
                        gender: data.gender || 'male',
                        units: data.units || 'metric',
                        theme: data.theme || 'system',
                        avatarPath: data.avatar_path,
                        voiceEnabled: data.voice_enabled ?? true,
                        aiMemoryEnabled: data.ai_memory_enabled ?? true,
                        preferredAiVoice: data.preferred_ai_voice,
                        preferredLanguage: data.preferred_language || 'en',
                        notificationsEnabled: data.notifications_enabled ?? true,
                        streamingResponsesEnabled: data.target_config?.streaming_responses_enabled ?? true,
                        targetConfig: data.target_config || {},
                        onboarding_completed: data.onboarding_completed ?? false,
                        createdAt: user.created_at || data.created_at || new Date().toISOString(),
                        updatedAt: data.updated_at || new Date().toISOString(),
                        accepted_terms: data.accepted_terms,
                        accepted_privacy: data.accepted_privacy,
                        terms_version: data.terms_version,
                        privacy_version: data.privacy_version,
                        accepted_at: data.accepted_at
                    });
                } else {
                    setUserProfile(null);
                }
            } catch (error) {
                // If profile not found in DB, it's null (requires onboarding)
                setUserProfile(null);
            }
        } else {
            setUserProfile(null);
        }
    };

    // Load profile from Supabase when user changes
    useEffect(() => {
        refreshProfile();
    }, [user]);

    const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
        // Optimistic local update removed so that the UI waits for Supabase row.
        
        if (user) {
            const fallbackEmail = updates.email || user.email || '';
            const fallbackUsername = fallbackEmail 
                ? fallbackEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(Math.random() * 10000)
                : `user_${Math.floor(Math.random() * 1000000)}`;

            const payload = {
                id: user.id,
                email: fallbackEmail,
                full_name: updates.fullName || (userProfile?.fullName || ''),
                username: updates.username || (userProfile?.username || fallbackUsername),
                current_weight: updates.currentWeight,
                target_weight: updates.targetWeight,
                fitness_goal: updates.fitnessGoal,
                enable_financial_reminders: updates.enableFinancialReminders,
                dob: updates.dob || null,
                height_cm: updates.heightCm,
                gender: updates.gender,
                calorie_goal: updates.calorieGoal,
                sleep_goal: updates.sleepGoal,
                monthly_budget: updates.monthlyBudget,
                monthly_income: updates.monthlyIncome,
                water_goal_ml: updates.waterGoalMl,
                units: updates.units || 'metric',
                theme: updates.theme || 'system',
                avatar_path: updates.avatarPath,
                onboarding_completed: updates.onboarding_completed,
                activity_level: updates.activityLevel,
                voice_enabled: updates.voiceEnabled,
                ai_memory_enabled: updates.aiMemoryEnabled,
                preferred_ai_voice: updates.preferredAiVoice,
                preferred_language: updates.preferredLanguage || 'en',
                notifications_enabled: updates.notificationsEnabled,
                target_config: {
                    ...(updates.targetConfig || {}),
                    streaming_responses_enabled: updates.streamingResponsesEnabled
                },
                updated_at: new Date().toISOString(),
                accepted_terms: updates.accepted_terms,
                accepted_privacy: updates.accepted_privacy,
                terms_version: updates.terms_version,
                privacy_version: updates.privacy_version,
                accepted_at: updates.accepted_at
            };

            // Remove undefined fields
            Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);

            console.log("================ DATABASE OPERATION LOG ================");
            console.log("1. SQL being executed: UPSERT profiles (via supabase.from('profiles').upsert)");
            console.log("2. Payload:", JSON.stringify(payload, null, 2));

            const response = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select().single();
            
            console.log("3. Returned data:", response.data);
            console.log("4. Returned error:", response.error);
            console.log("5. HTTP status:", response.status);
            if (response.error) {
                console.log("6. Supabase error object:", JSON.stringify(response.error, null, 2));
            }
            console.log("========================================================");
            
            if (response.error) {
                console.error("Failed to update profile in Supabase:", response.error);
                throw new Error(`Supabase Error (${response.status}): ` + JSON.stringify(response.error) + " | Data: " + JSON.stringify(response.data));
            }
            
            // Sync with backend immediately
            if (response.data) {
                await refreshProfile();
            }
        }
    };

    const clearUserCache = () => {
        setUserProfile(null);
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
        getUserProfile,
        refreshProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
