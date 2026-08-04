import { create } from 'zustand';

export type SupabaseOperation = 'select' | 'insert' | 'update' | 'upsert' | 'delete' | 'storage upload' | 'storage delete' | 'RPC' | 'auth call' | 'unknown';

export interface DebugLogEntry {
    id: string;
    timestamp: string;
    table: string;
    operation: SupabaseOperation;
    payload: any;
    returnedData: any;
    returnedError: any;
    httpStatus: number;
    executionTimeMs: number;
    authenticatedUserId: string | null;
    url: string;
    method: string;
}

export interface SelfTestResult {
    name: string;
    status: 'pending' | 'pass' | 'fail';
    message?: string;
    lastRunAt?: string;
}

interface DebugStoreState {
    logs: DebugLogEntry[];
    contextState: {
        userId: string | null;
        userEmail: string | null;
        onboardingCompleted: boolean;
        selectedLanguage: string;
        theme: string;
        notificationPermission: string;
        activeAiProvider: string;
    };
    selfTests: Record<string, SelfTestResult>;
    
    // Actions
    addLog: (log: Omit<DebugLogEntry, 'id' | 'timestamp'>) => void;
    clearLogs: () => void;
    updateContextState: (updates: Partial<DebugStoreState['contextState']>) => void;
    updateSelfTest: (id: string, result: Omit<SelfTestResult, 'name'>) => void;
    initializeSelfTests: () => void;
}

export const useDebugStore = create<DebugStoreState>((set) => ({
    logs: [],
    contextState: {
        userId: null,
        userEmail: null,
        onboardingCompleted: false,
        selectedLanguage: 'en',
        theme: 'system',
        notificationPermission: 'unknown',
        activeAiProvider: 'google (gemini)'
    },
    selfTests: {},

    addLog: (log) => set((state) => {
        // Log to console if there's an error, as requested by strict error handling rules
        if (log.returnedError) {
            console.group(`🚨 Backend Error: ${log.operation.toUpperCase()} ${log.table}`);
            console.error("Operation:", `${log.operation.toUpperCase()} ${log.table}`);
            console.error("Payload:", log.payload);
            console.error("Error:", log.returnedError.message || log.returnedError);
            console.error("HTTP Status:", log.httpStatus);
            console.error("Supabase Error:", log.returnedError);
            console.error("Suggested Root Cause: Check payload structure, RLS policies, or authentication session state.");
            console.groupEnd();
        }

        const newLog: DebugLogEntry = {
            ...log,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString()
        };
        
        // Keep max 100 logs in memory
        return { logs: [newLog, ...state.logs].slice(0, 100) };
    }),

    clearLogs: () => set({ logs: [] }),

    updateContextState: (updates) => set((state) => ({
        contextState: { ...state.contextState, ...updates }
    })),

    updateSelfTest: (id, result) => set((state) => ({
        selfTests: {
            ...state.selfTests,
            [id]: { ...state.selfTests[id], ...result }
        }
    })),

    initializeSelfTests: () => {
        const tests = {
            google_login: { name: 'Google login', status: 'pending' as const },
            email_login: { name: 'Email login', status: 'pending' as const },
            username_login: { name: 'Username login', status: 'pending' as const },
            profile_creation: { name: 'Profile creation', status: 'pending' as const },
            onboarding: { name: 'Onboarding', status: 'pending' as const },
            workout_save: { name: 'Workout save', status: 'pending' as const },
            planner_save: { name: 'Planner save', status: 'pending' as const },
            progress_photo: { name: 'Progress photo upload', status: 'pending' as const },
            ai_chat: { name: 'AI chat save', status: 'pending' as const },
            expense_save: { name: 'Expense save', status: 'pending' as const },
            food_scan: { name: 'Food scan save', status: 'pending' as const },
            language_switch: { name: 'Language switch', status: 'pending' as const },
            theme_switch: { name: 'Theme switch', status: 'pending' as const },
            notification_settings: { name: 'Notification settings', status: 'pending' as const }
        };
        set({ selfTests: tests });
    }
}));
