'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export interface UserMetadata {
    fullName?: string;
    avatarUrl?: string;
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
    createdAt?: string;
    updatedAt: string;
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
    enableFinancialReminders: true,
    updatedAt: new Date().toISOString()
};

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile;
    session: Session | null;
    loading: boolean;
    isLoading: boolean;
    signUp: (email: string, password: string, metadata?: UserMetadata & Partial<UserProfile>) => Promise<unknown>;
    signIn: (email?: string, password?: string) => Promise<unknown>;
    login: (email?: string, password?: string) => Promise<unknown>;
    signOut: () => Promise<void>;
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
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    let localCalorieGoal = DEFAULT_USER_PROFILE.calorieGoal;
                    let localWaterGoalMl = DEFAULT_USER_PROFILE.waterGoalMl;
                    let localMonthlyBudget = DEFAULT_USER_PROFILE.monthlyBudget;
                    
                    if (typeof window !== 'undefined') {
                        const savedCal = localStorage.getItem('workout_os_calorie_goal');
                        if (savedCal) localCalorieGoal = parseInt(savedCal, 10);
                        
                        const savedBudget = localStorage.getItem('workout_os_budget_target');
                        if (savedBudget) localMonthlyBudget = parseInt(savedBudget, 10);
                    }

                    setUserProfile({
                        fullName: data.full_name || '',
                        username: data.username || '',
                        email: data.email || user.email || '',
                        fitnessGoal: data.goals?.[0] || DEFAULT_USER_PROFILE.fitnessGoal,
                        currentWeight: Number(data.current_weight) || DEFAULT_USER_PROFILE.currentWeight,
                        targetWeight: Number(data.target_weight) || DEFAULT_USER_PROFILE.targetWeight,
                        waterGoalMl: data.water_goal_ml || localWaterGoalMl,
                        calorieGoal: data.calorie_goal || localCalorieGoal,
                        monthlyBudget: data.monthly_budget || localMonthlyBudget,
                        enableFinancialReminders: data.enable_financial_reminders !== false, // default true
                        createdAt: user.created_at || data.created_at || new Date().toISOString(),
                        updatedAt: data.updated_at || new Date().toISOString()
                    });
                } else {
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
            const { error } = await supabase.from('profiles').update({
                full_name: next.fullName,
                username: next.username,
                current_weight: next.currentWeight,
                target_weight: next.targetWeight,
                enable_financial_reminders: next.enableFinancialReminders,
                updated_at: next.updatedAt
            }).eq('id', user.id);
            
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
                    avatar_url: metadata?.avatarUrl || ''
                }
            }
        });
        
        if (error) throw error;
        
        // Profiles are ideally created via Postgres Triggers on auth.users insert,
        // but as a fallback, we can insert it here.
        if (data.user) {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                email: email,
                full_name: metadata?.fullName || email.split('@')[0],
                username: metadata?.username || email.split('@')[0].toLowerCase().replace(/\s+/g, '_')
            }).select().single();
        }

        return data;
    };

    // Email/Password Sign In
    const signIn = async (email?: string, password?: string) => {
        if (!email || !password) {
            throw new Error('Email and password are required to sign in.');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
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
        login,
        signOut,
        updateUserProfile,
        clearUserCache,
        getCurrentUser,
        isEmailVerified,
        getUserProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
