'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, getURL } from '@/lib/supabase/client';

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
    foodBudgets?: Record<string, number>;
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
    targetConfig?: unknown;
    dashboard_config?: unknown;
    xp?: number;
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



interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    isLoading: boolean;
    isProfileLoaded: boolean;
    signUp: (email: string, password: string, metadata?: UserMetadata & Partial<UserProfile>) => Promise<unknown>;
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
    const [isProfileLoaded, setIsProfileLoaded] = useState(false);

    // Initial session load
    useEffect(() => {
        let isMounted = true;
        
        // Safety timeout to prevent infinite loading screen
        const safetyTimer = setTimeout(() => {
            if (isMounted) {
                console.warn('Auth session load timed out, forcing loading to false');
                setLoading(false);
            }
        }, 3000);

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!isMounted) return;
            clearTimeout(safetyTimer);
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        }).catch((err) => {
            if (!isMounted) return;
            clearTimeout(safetyTimer);
            console.error('Error fetching Supabase session:', err);
            setLoading(false);
        });

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            if (!isMounted) return;
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            isMounted = false;
            clearTimeout(safetyTimer);
            subscription?.unsubscribe();
        };
    }, []);

    const refreshProfile = async () => {
        setIsProfileLoaded(false);
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
                        foodBudgets: data.food_budgets || {},
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
                        dashboard_config: data.dashboard_config,
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
            } catch {
                // If profile not found in DB, it's null (requires onboarding)
                setUserProfile(null);
            }
        } else {
            setUserProfile(null);
        }
        setIsProfileLoaded(true);
    };

    // Load profile from Supabase when user changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        refreshProfile();
    }, [user]);

    // Listen for realtime XP awards
    useEffect(() => {
        if (!user) return;
        const handleXpAwarded = () => {
            refreshProfile();
        };
        window.addEventListener('workout_os_xp_awarded', handleXpAwarded);
        return () => window.removeEventListener('workout_os_xp_awarded', handleXpAwarded);
    }, [user]);

    const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
        // Optimistic local update removed so that the UI waits for Supabase row.
        
        if (user) {
            const fallbackEmail = updates.email || user.email || '';
            const fallbackUsername = fallbackEmail 
                ? fallbackEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(Math.random() * 10000)
                : `user_${Math.floor(Math.random() * 1000000)}`;

            const payload: Record<string, any> = {
                id: user.id,
                updated_at: new Date().toISOString(),
            };

            if (fallbackEmail) payload.email = fallbackEmail;
            
            // For full_name and username, preserve existing logic of falling back to userProfile or generated username if missing
            payload.full_name = updates.fullName !== undefined ? updates.fullName : (userProfile?.fullName || '');
            payload.username = updates.username !== undefined ? updates.username : (userProfile?.username || fallbackUsername);

            if (updates.currentWeight !== undefined) payload.current_weight = updates.currentWeight;
            if (updates.targetWeight !== undefined) payload.target_weight = updates.targetWeight;
            if (updates.fitnessGoal !== undefined) payload.fitness_goal = updates.fitnessGoal;
            if (updates.enableFinancialReminders !== undefined) payload.enable_financial_reminders = updates.enableFinancialReminders;
            if (updates.dob !== undefined) payload.dob = updates.dob;
            if (updates.heightCm !== undefined) payload.height_cm = updates.heightCm;
            if (updates.gender !== undefined) payload.gender = updates.gender;
            if (updates.calorieGoal !== undefined) payload.calorie_goal = updates.calorieGoal;
            if (updates.sleepGoal !== undefined) payload.sleep_goal = updates.sleepGoal;
            if (updates.monthlyBudget !== undefined) payload.monthly_budget = updates.monthlyBudget;
            if (updates.monthlyIncome !== undefined) payload.monthly_income = updates.monthlyIncome;
            if (updates.foodBudgets !== undefined) payload.food_budgets = updates.foodBudgets;
            if (updates.waterGoalMl !== undefined) payload.water_goal_ml = updates.waterGoalMl;
            if (updates.units !== undefined) payload.units = updates.units;
            if (updates.theme !== undefined) payload.theme = updates.theme;
            if (updates.avatarPath !== undefined) payload.avatar_path = updates.avatarPath;
            if (updates.onboarding_completed !== undefined) payload.onboarding_completed = updates.onboarding_completed;
            if (updates.activityLevel !== undefined) payload.activity_level = updates.activityLevel;
            if (updates.voiceEnabled !== undefined) payload.voice_enabled = updates.voiceEnabled;
            if (updates.aiMemoryEnabled !== undefined) payload.ai_memory_enabled = updates.aiMemoryEnabled;
            if (updates.preferredAiVoice !== undefined) payload.preferred_ai_voice = updates.preferredAiVoice;
            if (updates.preferredLanguage !== undefined) payload.preferred_language = updates.preferredLanguage;
            if (updates.notificationsEnabled !== undefined) payload.notifications_enabled = updates.notificationsEnabled;
            
            if (updates.targetConfig !== undefined || updates.streamingResponsesEnabled !== undefined) {
                payload.target_config = {
                    ...(typeof userProfile?.targetConfig === 'object' ? userProfile.targetConfig : {}),
                    ...(typeof updates.targetConfig === 'object' ? updates.targetConfig : {}),
                };
                if (updates.streamingResponsesEnabled !== undefined) {
                    payload.target_config.streaming_responses_enabled = updates.streamingResponsesEnabled;
                }
            }
            if (updates.dashboard_config !== undefined) payload.dashboard_config = updates.dashboard_config;

            if (updates.accepted_terms !== undefined) payload.accepted_terms = updates.accepted_terms;
            if (updates.accepted_privacy !== undefined) payload.accepted_privacy = updates.accepted_privacy;
            if (updates.terms_version !== undefined) payload.terms_version = updates.terms_version;
            if (updates.privacy_version !== undefined) payload.privacy_version = updates.privacy_version;
            if (updates.accepted_at !== undefined) payload.accepted_at = updates.accepted_at;

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
                redirectTo: `${getURL()}auth/callback`,
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


    // Sign Out
    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        clearUserCache();
        if (typeof window !== 'undefined') {
            window.location.href = '/sign-up-login-screen';
        }
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
        isProfileLoaded,
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
