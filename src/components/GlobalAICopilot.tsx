'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, X, Mic, Camera, SlidersHorizontal, BookmarkPlus, Settings2, Trash2, MessageSquare, VolumeX, Image as ImageIcon, Orbit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIDebugDashboard } from './AIDebugDashboard';
import AvaLogo from './ui/AvaLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAIMemories } from '@/services/aiMemoryService';
import { useRouter } from 'next/navigation';
import { getExpenses, getIncome, addTransaction } from '@/app/budget-tracker/services/budgetStorage';
import { getMealsForDate, saveMealsForDate } from '@/app/diet/services/dietStorage';
import { supabase } from '@/lib/supabase/client';
import { WorkoutLogger } from '@/lib/workout';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { telemetryEngine } from '@/services/telemetryEngine';
import ReactMarkdown from 'react-markdown';
import { useRewardSystem } from '@/lib/hooks/useRewardSystem';


interface ChatMessage {
    id: string;
    sender: 'user' | 'ava';
    text: string;
    timestamp: string;
    imageUrl?: string;
    requestId?: string;
    isError?: boolean;
    devDetails?: any;
}

function formatTime(date: Date) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Derive up to 3 contextual quick-action suggestions from the last Ava response
function deriveChips(text: string): string[] {
    const lower = text.toLowerCase();
    const suggestions: string[] = [];
    if (lower.includes('workout') || lower.includes('exercise') || lower.includes('push') || lower.includes('pull'))
        suggestions.push('Add warm-up routine', 'Save this plan', 'Make it beginner-friendly');
    else if (lower.includes('meal') || lower.includes('food') || lower.includes('diet') || lower.includes('calorie'))
        suggestions.push('Log this meal', 'Show macros breakdown', 'Save this plan');
    else if (lower.includes('sleep') || lower.includes('bed'))
        suggestions.push('Show my sleep trend', 'Set a sleep goal', 'Tips to sleep better');
    else if (lower.includes('water') || lower.includes('hydrat'))
        suggestions.push('Log 500ml now', 'Set water goal', 'Show water trend');
    else if (lower.includes('budget') || lower.includes('expense') || lower.includes('spend'))
        suggestions.push('Show this month summary', 'Log an expense', 'Set a budget goal');
    else
        suggestions.push('Tell me more', 'Log this data', 'Show trends');
    return suggestions.slice(0, 3);
}

export default function GlobalAICopilot() {

    const { userProfile } = useAuth();
    const { selectedDate } = useDate();
    const { language, t } = useLanguage();
    const router = useRouter();
    const { triggerTap, triggerPop, triggerSuccess } = useRewardSystem();

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleOpen = (e: any) => {
            setIsOpen(true);
            if (e.detail?.prompt) {
                setPrompt(e.detail.prompt);
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
                }
            }
        };
        window.addEventListener('open-ai-copilot', handleOpen);
        return () => window.removeEventListener('open-ai-copilot', handleOpen);
    }, []);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isDevMode, setIsDevMode] = useState(false);
    const [showDebugDashboard, setShowDebugDashboard] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [contextStatus, setContextStatus] = useState<Record<string, any>>({});
    const [selectedAuditModule, setSelectedAuditModule] = useState<string | null>(null);

    // Conversation history — persists across open/close within the same session
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [apiHistory, setApiHistory] = useState<{ role: string; text: string }[]>([]);
    const [isConversationMode, setIsConversationMode] = useState(false);
    const isConversationModeRef = useRef(false);
    isConversationModeRef.current = isConversationMode;
    const isListeningRef = useRef(false);
    isListeningRef.current = isListening;

    // Quick-action chips derived from the latest Ava response
    const [chips, setChips] = useState<string[]>([]);

    useEffect(() => {
        setIsDevMode(localStorage.getItem('workoutos_dev_mode') === 'true');
    }, []);

    const recognitionRef = useRef<any>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    // Keep a ref to the latest prompt so the voice auto-send can access current value
    const promptRef = useRef('');
    promptRef.current = prompt;

    const displayName = userProfile?.fullName
        ? userProfile.fullName.split(' ')[0]
        : (userProfile?.username || 'there');

    // Scroll to bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // When closing — stop listening and TTS. Do NOT wipe messages.
    useEffect(() => {
        if (!isOpen) {
            window.speechSynthesis.cancel();
            if (isListening && recognitionRef.current) {
                recognitionRef.current.stop();
                setIsListening(false);
            }
        }
    }, [isOpen]);

    const clearChat = () => {
        setMessages([]);
        setApiHistory([]);
        setChips([]);
        setPrompt('');
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
        }
    };

    const isSendingRef = useRef(false);

    // Wrapped in useCallback so voice handler can reference stable function
    const handleSend = useCallback(async (overrideText?: string) => {
        if (isSendingRef.current) return;
        window.speechSynthesis.cancel();
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        const q = (overrideText ?? promptRef.current).trim();
        if (!q && !selectedImage) return;

        isSendingRef.current = true;
        const currentImage = selectedImage;
        const reqId = `REQ-${new Date().toLocaleDateString('en-CA').replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`;
        const now = formatTime(new Date());

        const userMsg: ChatMessage = {
            id: `u-${Date.now()}`,
            sender: 'user',
            text: q || 'Analyzing image…',
            timestamp: now,
            imageUrl: currentImage ?? undefined,
            requestId: reqId
        };

        setMessages(prev => [...prev, userMsg]);
        setPrompt('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        setSelectedImage(null);
        setChips([]);
        setLoading(true);

        try {
            const dateKey = selectedDate || new Date().toLocaleDateString('en-CA');
            // Re-fetch all context just before sending
            const currentAppState: any = { dashboard: null, planner: null, workout: null, nutrition: null, budget: null, habits: null, commandCenter: null, date: dateKey, time: formatTime(new Date()) };
            let apiHistory = messages;
            let aiMemories: any[] = [];
            
            const contextStatus: Record<string, any> = {
                'Profile': { loaded: false, query: "userProfile" },
                'Dashboard': { loaded: false, query: "supabase.from('daily_logs')" },
                'Planner': { loaded: false, query: "supabase.from('tasks')" },
                'Habits': { loaded: false, query: "supabase.from('habits')" },
                'CommandCenter': { loaded: false, query: "supabase.from('command_center_items')" },
                'Workout': { loaded: false, query: "supabase.from('workout_logs')" },
                'Nutrition': { loaded: false, query: "supabase.from('meal_entries')" },
                'Budget': { loaded: false, query: "getIncome() / getExpenses()" },
                'AIMemory': { loaded: false, query: "getAIMemories()" },
                'ExecProfile': { loaded: false, query: "supabase.from('execution_profiles')" },
                'ExecGoals': { loaded: false, query: "supabase.from('execution_goals')" },
                'TaskScores': { loaded: false, query: "supabase.from('task_execution_scores')" },
                'Behaviors': { loaded: false, query: "supabase.from('behavior_patterns')" },
                'Vault': { loaded: false, query: "supabase.from('content_vault')" }
            };

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Determine 'since' for recent data (14 days ago)
                const since = new Date();
                since.setDate(since.getDate() - 13);
                const sinceKey = since.toLocaleDateString('en-CA');

                contextStatus['Profile'].loaded = !!userProfile;
                if (!userProfile) contextStatus['Profile'].error = "User profile is missing or undefined";

                // Fire all DB queries in parallel with catch blocks so one failure doesn't abort the AI pipeline
                const [
                    dailyLogRes,
                    tasksRes,
                    habitsRes,
                    commandCenterRes,
                    workoutRes,
                    recentWorkoutsRes,
                    recentMealsRes,
                    mealsRes,
                    budgetIncomeRes,
                    budgetExpensesRes,
                    memoryRes,
                    execProfileRes,
                    execGoalsRes,
                    taskScoresRes,
                    behaviorsRes,
                    recentDailyLogsRes,
                    vaultRes
                ] = await Promise.all([
                    supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('date', dateKey).maybeSingle().then(res => res, e => ({ data: null, error: e })),
                    supabase.from('tasks').select('*').eq('user_id', user.id).eq('completed', false).then(res => res, e => ({ data: null, error: e })),
                    supabase.from('habits').select('*').eq('user_id', user.id).then(res => res, e => ({ data: null, error: e })),
                    supabase.from('command_center_items').select('*').eq('user_id', user.id).eq('status', 'active').then(res => res, e => ({ data: null, error: e })),
                    supabase.from('workout_logs').select('session_type, exercises, completed').eq('user_id', user.id).eq('date', dateKey).then(res => res, e => ({ data: null, error: e })),
                    supabase.from('workout_logs').select('date, session_type, completed').eq('user_id', user.id).gte('date', sinceKey).order('date', { ascending: true }).then(res => res, e => ({ data: null, error: e })),
                    supabase.from('meal_entries').select('date, meal_slot, name, calories, protein').eq('user_id', user.id).gte('date', sinceKey).order('date', { ascending: true }).then(res => res, e => ({ data: null, error: e })),
                    getMealsForDate(dateKey).then(res => ({ data: res, error: null }), e => ({ data: null, error: e })),
                    getIncome().then(res => ({ data: res, error: null }), e => ({ data: null, error: e })),
                    getExpenses().then(res => ({ data: res, error: null }), e => ({ data: null, error: e })),
                    userProfile?.aiMemoryEnabled !== false ? getAIMemories().then(res => ({ data: res, error: null }), e => ({ data: null, error: e })) : Promise.resolve({ data: [], error: null }),
                    supabase.from('execution_profiles').select('*').eq('user_id', user.id).maybeSingle().then(res => res, e => ({ data: null, error: e })),
                    supabase.from('execution_goals').select('*').eq('user_id', user.id).eq('status', 'active').then(res => res, e => ({ data: null, error: e })),
                    supabase.from('task_execution_scores').select('*').eq('user_id', user.id).then(res => res, e => ({ data: null, error: e })),
                    supabase.from('behavior_patterns').select('*').eq('user_id', user.id).eq('is_active', true).then(res => res, e => ({ data: null, error: e })),
                    supabase.from('daily_logs').select('date, sleep_hours, water_ml_total, mood_rating, weight_kg, reflection, raw_transcript').eq('user_id', user.id).gte('date', sinceKey).order('date', { ascending: true }).then(res => res, e => ({ data: null, error: e })),
                    supabase.from('content_vault').select('*').eq('user_id', user.id).eq('status', 'unread').then(res => res, e => ({ data: null, error: e }))
                ]);

                // Dashboard / Daily Logs
                if (!dailyLogRes.error) {
                    const data = dailyLogRes.data || {};
                    currentAppState.dashboard = {
                        waterMl: data.water_ml_total || 0,
                        sleepHrs: data.sleep_hours || 0,
                        weightKg: data.weight_kg,
                        mood: data.mood_rating,
                        energy: data.energy_rating,
                        journal: data.reflection,
                        recent: recentDailyLogsRes?.data || []
                    };
                    contextStatus['Dashboard'].loaded = true;
                } else {
                    currentAppState.dashboard = { waterMl: 0, sleepHrs: 0 };
                    contextStatus['Dashboard'].error = dailyLogRes.error.message || String(dailyLogRes.error);
                }

                // Planner
                if (!tasksRes.error && tasksRes.data) {
                    const today = new Date().toLocaleDateString('en-CA');
                    currentAppState.planner = {
                        overdue: tasksRes.data.filter(t => t.date && t.date < today),
                        today: tasksRes.data.filter(t => t.date === today),
                        upcoming: tasksRes.data.filter(t => t.date && t.date > today)
                    };
                    contextStatus['Planner'].loaded = true;
                } else if (tasksRes.error) {
                    contextStatus['Planner'].error = tasksRes.error.message || String(tasksRes.error);
                }

                // Execution OS V3 Extensions
                if (!execProfileRes.error && execProfileRes.data) {
                    currentAppState.executionProfile = execProfileRes.data;
                    contextStatus['ExecProfile'].loaded = true;
                } else {
                    contextStatus['ExecProfile'].error = execProfileRes.error?.message;
                }

                if (!execGoalsRes.error && execGoalsRes.data) {
                    currentAppState.macroGoals = execGoalsRes.data;
                    contextStatus['ExecGoals'].loaded = true;
                } else {
                    contextStatus['ExecGoals'].error = execGoalsRes.error?.message;
                }

                if (!taskScoresRes.error && taskScoresRes.data) {
                    currentAppState.taskScores = taskScoresRes.data;
                    contextStatus['TaskScores'].loaded = true;
                } else {
                    contextStatus['TaskScores'].error = taskScoresRes.error?.message;
                }

                if (!behaviorsRes.error && behaviorsRes.data) {
                    currentAppState.behaviorPatterns = behaviorsRes.data;
                    contextStatus['Behaviors'].loaded = true;
                } else {
                    contextStatus['Behaviors'].error = behaviorsRes.error?.message;
                }
                
                if (!vaultRes.error && vaultRes.data) {
                    currentAppState.contentVault = vaultRes.data;
                    contextStatus['Vault'].loaded = true;
                } else {
                    contextStatus['Vault'].error = vaultRes.error?.message;
                }


                // Habits
                if (!habitsRes.error && habitsRes.data) {
                    currentAppState.habits = habitsRes.data;
                    contextStatus['Habits'].loaded = true;
                } else if (habitsRes.error) {
                    contextStatus['Habits'].error = habitsRes.error.message || String(habitsRes.error);
                }

                // Command Center
                if (!commandCenterRes.error && commandCenterRes.data) {
                    currentAppState.commandCenter = commandCenterRes.data;
                    contextStatus['CommandCenter'].loaded = true;
                } else if (commandCenterRes.error) {
                    contextStatus['CommandCenter'].error = commandCenterRes.error.message || String(commandCenterRes.error);
                }

                // Workout
                if (!workoutRes.error && !recentWorkoutsRes.error) {
                    currentAppState.workout = {
                        today: workoutRes.data || null,
                        recent: recentWorkoutsRes.data || []
                    };
                    contextStatus['Workout'].loaded = true;
                } else {
                    contextStatus['Workout'].error = (workoutRes.error?.message || recentWorkoutsRes.error?.message) || 'Workout fetch failed';
                }

                // Nutrition
                if (!mealsRes.error && !recentMealsRes.error) {
                    const mealsData = mealsRes.data || [];
                    const nutritionKcal = mealsData.reduce((acc: number, m: any) => acc + (m.calories || 0), 0);
                    const nutritionFiber = mealsData.reduce((acc: number, m: any) => acc + (m.fiber || 0), 0);
                    currentAppState.nutrition = {
                        todayKcal: nutritionKcal,
                        todayFiber: nutritionFiber,
                        meals: mealsData.map((m: any) => ({ name: m.name, kcal: m.calories, protein: m.protein, fiber: m.fiber })),
                        recent: recentMealsRes.data || []
                    };
                    contextStatus['Nutrition'].loaded = true;
                } else {
                    contextStatus['Nutrition'].error = (mealsRes.error?.message || recentMealsRes.error?.message) || 'Nutrition fetch failed';
                }

                // Budget
                if (!budgetIncomeRes.error && !budgetExpensesRes.error) {
                    currentAppState.budget = {
                        income: budgetIncomeRes.data || 0,
                        expenses: budgetExpensesRes.data || 0,
                        monthlyBudget: userProfile?.monthlyBudget || 0
                    };
                    contextStatus['Budget'].loaded = true;
                } else {
                    contextStatus['Budget'].error = (budgetIncomeRes.error?.message || budgetExpensesRes.error?.message) || 'Budget fetch failed';
                }

                // AI Memory
                if (!memoryRes.error) {
                    aiMemories = memoryRes.data || [];
                    contextStatus['AIMemory'].loaded = true;
                } else {
                    contextStatus['AIMemory'].error = memoryRes.error.message || String(memoryRes.error);
                }
            }
            
            // Expose the contextStatus for debugging UI
            setContextStatus(contextStatus);

            const currentDateTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: q, requestId: reqId, userProfile, image: currentImage, history: apiHistory, appState: currentAppState, preferredLanguage: language, aiMemories, currentDateTime, devMode: isDevMode }),
            });

            const data = await res.json();

            if (data.result || data.functionCall) {
                let finalResponseText = data.result || "Done.";
                
                if (data.functionCall && user) {
                    const fn = data.functionCall.name;
                    const args = data.functionCall.args;
                    
                    if (finalResponseText === 'Done.') {
                        if (fn === 'save_workout_template') {
                            finalResponseText = "I've generated that workout plan for you! You can find it in your Workout library.";
                        } else if (fn === 'navigate_to') {
                            finalResponseText = "Navigating you there now.";
                        } else if (fn === 'log_workout' || fn === 'log_nutrition' || fn === 'log_sleep' || fn === 'log_water') {
                            finalResponseText = "Got it! I've logged that for you.";
                        } else if (fn === 'add_task') {
                            finalResponseText = "I've added that to your tasks.";
                        }
                    }
                    if (fn === 'add_task') {
                        const { data: newTask, error } = await supabase.from('tasks').insert({ 
                            user_id: user.id, 
                            date: dateKey, 
                            title: args.title || 'New Task',
                            full_title: args.fullTitle || args.title || 'New Task', 
                            description: args.description || '', 
                            completed: false,
                            due_date: args.dueDate || '',
                            due_time: args.dueTime || null
                        }).select().single();
                        
                        if (error) throw new Error(`Tool Execution Failed (add_task base): ${error.message}`);
                        
                        // Execution OS V3 Adapter: Append execution score if probabilty/cost provided
                        if (newTask && (args.executionProbability !== undefined || args.energyCost !== undefined)) {
                            const { error: adapterError } = await supabase.from('task_execution_scores').insert({
                                task_id: newTask.id,
                                user_id: user.id,
                                execution_probability: args.executionProbability ?? 50,
                                energy_cost: args.energyCost ?? 10
                            });
                            if (adapterError) {
                                console.warn("Task created, but execution_scores adapter failed:", adapterError.message);
                            }
                        }
                        
                        if (newTask && newTask.due_time) {
                        }
                        window.dispatchEvent(new Event('workout_os_tasks_updated'));
                    } else if (fn === 'add_goal') {
                        const { error } = await supabase.from('execution_goals').insert({
                            user_id: user.id,
                            title: args.title,
                            life_area: args.life_area || 'Personal',
                            target_date: args.target_date || null
                        });
                        if (error) throw new Error(`Tool Execution Failed (add_goal): ${error.message}`);
                        window.dispatchEvent(new Event('workout_os_refresh'));
                    } else if (fn === 'add_countdown') {
                        const { error } = await supabase.from('countdowns').insert({
                            user_id: user.id,
                            title: args.title || 'New Countdown',
                            target_date: args.targetDate || dateKey
                        });
                        if (error) throw new Error(`Tool Execution Failed (add_countdown): ${error.message}`);
                        window.dispatchEvent(new Event('workout_os_countdowns_updated'));
                    } else if (fn === 'add_reminder') {
                        const type = args.type || 'Custom';
                        const config = {
                            time: args.time || null,
                            repeat: args.repeat || false,
                            days: args.days || [],
                            snooze_duration: args.snooze_duration || 10,
                            smart_detection: args.smart_detection || false,
                            title: args.title || null
                        };
                        const { updateReminderPreference } = await import('@/services/reminderEngine');
                        await updateReminderPreference(type, true, config);
                        
                        if (args.time) {
                            const today = new Date().toLocaleDateString('en-CA');
                            const { error } = await supabase.from('command_center_items').insert({
                                user_id: user.id,
                                title: args.title || `Reminder: ${type}`,
                                description: `You asked me to remind you about ${type}.`,
                                category: 'Reminder',
                                priority: 'medium',
                                icon: 'bell',
                                source_module: 'Ava',
                                due_at: `${today}T${args.time}:00Z`
                            });
                            if (error) throw new Error(`Tool Execution Failed (add_reminder/command_center): ${error.message}`);
                        }
                        window.dispatchEvent(new Event('workout_os_refresh'));
                        window.dispatchEvent(new Event('workout_os_tasks_updated'));
                    } else if (fn === 'append_quick_note') {
                        const { data: profile, error: profileErr } = await supabase.from('profiles').select('target_config').eq('id', user.id).single();
                        if (profileErr && profileErr.code !== 'PGRST116') throw new Error(`Tool Execution Failed (append_quick_note/select): ${profileErr.message}`);
                        const currentConfig = profile?.target_config || {};
                        const currentNote = currentConfig.quickNotes?.[dateKey] || '';
                        const updatedConfig = {
                            ...currentConfig,
                            quickNotes: {
                                ...(currentConfig.quickNotes || {}),
                                [dateKey]: currentNote + '\\n' + (args.text || '')
                            }
                        };
                        const { error: updateErr } = await supabase.from('profiles').update({ target_config: updatedConfig }).eq('id', user.id);
                        if (updateErr) throw new Error(`Tool Execution Failed (append_quick_note/update): ${updateErr.message}`);

                    } else if (fn === 'navigate_to' && args.path) {
                        router.push(args.path);
                        setTimeout(() => setIsOpen(false), 1000);
                    } else if (fn === 'log_water') {
                        const { addWaterLog } = await import('@/app/diet/services/dietStorage');
                        await addWaterLog(dateKey, Number(args.amount) || 0, 'Ava AI');
                        window.dispatchEvent(new Event('workout_os_water_updated'));
                    } else if (fn === 'log_sleep') {
                        const sleepHours = Number(args.hours) || 0;

                        const sleepLogEntry = {
                            id: Date.now(),
                            amount: sleepHours,
                            type: 'Night Sleep',
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            details: {
                                bedtime: args.bedtime || null,
                                waketime: args.waketime || null,
                                quality: args.quality || 'good',
                                mood: args.mood || 'good',
                                energy: args.energy || 'medium',
                                stress: args.stress || 'low',
                                notes: args.notes || '',
                                dreams: args.dreams || '',
                                tags: args.tags ? args.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
                            }
                        };

                        const updatedSleepLogs = [sleepLogEntry];

                        const sleepRow: any = {
                            user_id: user.id,
                            date: dateKey,
                            sleep_hours: sleepHours,
                            sleep_logs: updatedSleepLogs,
                        };
                        if (args.bedtime) sleepRow.sleep_bedtime = args.bedtime.length === 5 ? `${args.bedtime}:00` : args.bedtime;
                        if (args.waketime) sleepRow.sleep_waketime = args.waketime.length === 5 ? `${args.waketime}:00` : args.waketime;

                        const { error } = await supabase
                            .from('daily_logs')
                            .upsert(sleepRow, { onConflict: 'user_id,date' });
                        if (error) throw new Error(`Tool Execution Failed (log_sleep): ${error.message}`);

                        window.dispatchEvent(new Event('storage'));
                        window.dispatchEvent(new Event('workout_os_sleep_updated'));
                    } else if (fn === 'log_nutrition') {
                        const meals = await getMealsForDate(dateKey);
                        meals.push({
                            id: Date.now().toString(),
                            name: args.mealName || 'AI Logged Meal',
                            category: args.category || 'Snacks',
                            portion: '1 serving',
                            calories: Number(args.calories) || 0,
                            protein: Number(args.protein) || 0,
                            carbs: Number(args.carbs) || 0,
                            fat: Number(args.fat) || 0,
                            sugar: 0,
                            fiber: 0,
                            icon: '🤖'
                        });
                        await saveMealsForDate(dateKey, meals);
                        window.dispatchEvent(new Event('storage'));
                        window.dispatchEvent(new Event('workout_os_diet_updated'));
                    } else if (fn === 'log_workout') {
                        const getMET = (activity: string, level: string) => {
                            const mets: any = { 'Stationary Bike': { 'Light': 3.0, 'Moderate': 5.5, 'Vigorous': 7.0 }, 'Running': { 'Light': 6.0, 'Moderate': 8.3, 'Vigorous': 11.0 }, 'Walking': { 'Light': 2.8, 'Moderate': 3.5, 'Vigorous': 5.0 }, 'Swimming': { 'Light': 5.0, 'Moderate': 7.0, 'Vigorous': 9.8 }, 'Rowing': { 'Light': 3.5, 'Moderate': 7.0, 'Vigorous': 8.5 }, 'Elliptical': { 'Light': 4.5, 'Moderate': 5.0, 'Vigorous': 7.0 }, 'Other': { 'Light': 3.0, 'Moderate': 5.0, 'Vigorous': 7.0 } };
                            return mets[activity]?.[level] || 5.0;
                        };
                        const activityType = args.activityType || 'Walking';
                        const intensity = args.intensity || 'Moderate';
                        const durationHrs = (Number(args.durationMinutes) || 30) / 60;
                        const weightKg = userProfile?.currentWeight || 75;
                        const estimatedCals = Math.round(getMET(activityType, intensity) * weightKg * durationHrs);

                        try {
                            await WorkoutLogger.logWorkout({
                                userId: user.id,
                                date: dateKey,
                                sessionType: activityType === 'Other' ? (args.customName || 'Custom Cardio') : activityType,
                                customName: activityType === 'Other' ? args.customName : null,
                                durationMinutes: Number(args.durationMinutes),
                                caloriesBurned: estimatedCals,
                                intensity: intensity,
                                exercises: [{
                                    type: 'metadata',
                                    metric_value: args.metricValue ? Number(args.metricValue) : null,
                                    metric_label: args.metricLabel ? args.metricLabel : null
                                }],
                                isOutdoor: activityType === 'Running' || activityType === 'Walking'
                            });

                            window.dispatchEvent(new Event('workout_os_recent_workouts_updated'));
                            window.dispatchEvent(new Event('workout_os_activity_updated'));
                            window.dispatchEvent(new Event('workout_os_refresh'));
                            window.dispatchEvent(new Event('storage'));
                        } catch (error: any) {
                            console.error("Ava Workout Logging Failed:", error);
                        }
} else if (fn === 'add_expense') {
                        await addTransaction({ date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), description: args.category || 'Expense', category: args.category || 'Other', amount: Number(args.amount) || 0, protein: null, costPerG: null, type: 'essential' }, 'expense');
                        window.dispatchEvent(new Event('workout_os_budget_updated'));
                    } else if (fn === 'add_income') {
                        await addTransaction({ date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), description: args.source || 'Income', source: args.source || 'Other', amount: Number(args.amount) || 0, type: 'one-time' }, 'income');
                        window.dispatchEvent(new Event('workout_os_budget_updated'));
                    } else if (fn === 'save_to_vault') {
                        const vaultUrl = (args.url || '').trim();
                        if (!vaultUrl) throw new Error('No URL provided to save to vault.');
                        // Auto-fetch title if not provided
                        let vaultTitle = (args.title || '').trim();
                        if (!vaultTitle) {
                            try {
                                const metaRes = await fetch(`/api/metadata?url=${encodeURIComponent(vaultUrl)}`);
                                const metaJson = await metaRes.json();
                                vaultTitle = metaJson.title || vaultUrl;
                            } catch { vaultTitle = vaultUrl; }
                        }
                        const { error: vaultError } = await supabase.from('content_vault').insert({
                            user_id: user.id,
                            url: vaultUrl,
                            title: vaultTitle,
                            status: 'unread',
                        });
                        if (vaultError) throw new Error(`Failed to save to vault: ${vaultError.message}`);
                        window.dispatchEvent(new Event('workout_os_vault_updated'));
                        finalResponseText = `Saved to your Content Vault! "${vaultTitle}" is ready to read whenever you are.`;
                    } else if (fn === 'save_ai_memory') {
                        const { error } = await supabase.from('ai_memories').insert({
                            user_id: user.id,
                            category: args.category,
                            memory_text: args.memory_text
                        });
                        if (error) throw new Error(`Tool Execution Failed: ${error.message}`);
                    } else if (fn === 'log_behavior_pattern') {
                        const { error } = await supabase.from('behavior_patterns').insert({
                            user_id: user.id,
                            pattern_description: args.pattern_description,
                            confidence_score: args.confidence_score ?? 50,
                            source: 'ai_analyst'
                        });
                        if (error) console.warn("Failed to log behavior pattern:", error.message);
                    } else if (fn === 'save_workout_template') {
                        // Validate AI output before saving
                        const templateName = (args.name || '').trim();
                        const exercises = Array.isArray(args.exercises) ? args.exercises : [];

                        if (!templateName) throw new Error('Ava generated a workout without a name. Please regenerate.');
                        if (exercises.length === 0) throw new Error('Ava generated an empty exercise list. Please regenerate.');

                        // Validate each exercise
                        const validatedExercises = exercises.map((ex: any, idx: number) => {
                            if (!ex.name || typeof ex.name !== 'string' || !ex.name.trim()) {
                                throw new Error(`Exercise at position ${idx + 1} is missing a name.`);
                            }
                            if (!ex.sets || typeof ex.sets !== 'string' || !ex.sets.trim()) {
                                throw new Error(`Exercise "${ex.name}" is missing sets/reps.`);
                            }
                            return {
                                name: ex.name.trim(),
                                sets: ex.sets.trim(),
                                notes: ex.notes ? ex.notes.trim() : undefined,
                                youtubeUrl: '',
                                order: typeof ex.order === 'number' ? ex.order : idx,
                            };
                        });

                        // Dispatch event to show the AvaWorkoutPreview modal in the workout page
                        window.dispatchEvent(new CustomEvent('workout_os_ava_workout_generated', {
                            detail: {
                                name: templateName,
                                description: (args.description || '').trim() || undefined,
                                exercises: validatedExercises,
                            }
                        }));
                        
                        setTimeout(() => {
                            router.push('/workout');
                            setIsOpen(false);
                        }, 1500);
                    }
                }

                const avaMsg: ChatMessage = {
                    id: `a-${Date.now()}`,
                    sender: 'ava',
                    text: finalResponseText,
                    timestamp: formatTime(new Date()),
                    requestId: data.requestId,
                };
                setMessages(prev => [...prev, avaMsg]);
                setApiHistory(prev => [...prev, { role: 'user', text: q }, { role: 'model', text: finalResponseText }]);
                setChips(deriveChips(finalResponseText));
                triggerSuccess();

                if (finalResponseText && finalResponseText.length < 200) {
                    if (isConversationModeRef.current) {
                        const utterance = new SpeechSynthesisUtterance(finalResponseText.replace(/[#*•]/g, ''));
                        utterance.lang = 'en-IN';
                        const voices = window.speechSynthesis.getVoices();
                        const inVoice = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en'));
                        if (inVoice) utterance.voice = inVoice;
                        utterance.onend = () => {
                            if (isConversationModeRef.current && !isListeningRef.current) {
                                toggleListening(true);
                            }
                        };
                        window.speechSynthesis.speak(utterance);
                    }
                }
            } else {
                const errObj = new Error(data.error || 'No response');
                (errObj as any).requestId = data.requestId;
                (errObj as any).devDetails = typeof data.devDetails === 'string' ? JSON.parse(data.devDetails) : data.devDetails;
                throw errObj;
            }
        } catch (err: any) {
            console.error('AI Request Error:', err);
            const isDevErr = isDevMode && err.devDetails;
            const fallbackMsg = "The AI network is currently experiencing high load or your API keys are invalid. Please try again in a few seconds.";
            
            const errMsg: ChatMessage = {
                id: `e-${Date.now()}`,
                sender: 'ava',
                text: isDevErr ? `⚠️ [Dev Mode] ${err.message}` : `⚠️ ${fallbackMsg}`,
                timestamp: formatTime(new Date()),
                isError: true,
                requestId: err.requestId || 'UNKNOWN',
                ...(err.devDetails && { devDetails: err.devDetails })
            } as any;
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setLoading(false);
            isSendingRef.current = false;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, userProfile, apiHistory, selectedImage]);

    const toggleListening = (forceStart?: boolean) => {
        window.speechSynthesis.cancel();
        if (isListening && !forceStart) {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            setIsListening(false);
            return;
        }
        if (isListening && forceStart) return;
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) { alert('Speech recognition is not supported in this browser.'); return; }
        
        if (recognitionRef.current) {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.abort();
        }
        
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';
        const existing = promptRef.current ? promptRef.current + ' ' : '';
        let finalSessionText = '';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            if (!isListeningRef.current) return;

            let currentSessionFinal = '';
            let currentSessionInterim = '';
            for (let i = 0; i < event.results.length; i++) {
                const chunk = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    currentSessionFinal += chunk + ' ';
                } else {
                    currentSessionInterim += chunk;
                }
            }

            const full = (existing + currentSessionFinal + currentSessionInterim).trim();
            setPrompt(full);

            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                if (!isListeningRef.current) return;
                setIsListening(false);
                if (recognitionRef.current) recognitionRef.current.stop();
                const finalFull = (existing + currentSessionFinal).trim() || full;
                if (finalFull) handleSend(finalFull);
            }, 3500);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const { compressImage } = await import('@/utils/imageCompression');
                const compressedDataUrl = await compressImage(file, 800, 800, 0.7);
                setSelectedImage(compressedDataUrl);
            } catch (err) {
                console.warn('Failed to compress image, trying fallback reader:', err);
                try {
                    const reader = new FileReader();
                    reader.onloadend = () => setSelectedImage(reader.result as string);
                    reader.onerror = () => alert("Error: Failed to read image file from your device.");
                    reader.readAsDataURL(file);
                } catch (readErr: any) {
                    alert("Error: Camera or gallery read failed: " + readErr.message);
                }
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    const hasMessages = messages.length > 0;

    return (
        <>

            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex flex-col bg-surface-container-lowest/80 backdrop-blur-3xl animate-in fade-in duration-200">

                    <div className="flex items-center justify-between px-5 pt-14 pb-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <AvaLogo size={24} className="rounded-full overflow-hidden" />
                            <span className="text-on-surface font-semibold text-[17px] tracking-tight ml-1">Ava</span>
                            {isDevMode && (
                                <button 
                                    onClick={() => setShowDebugDashboard(true)}
                                    className="px-2 py-0.5 ml-2 rounded bg-surface-container-high border border-surface-variant text-[10px] uppercase font-bold tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                                >
                                    AI Debug
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {hasMessages && (
                                <button
                                    onClick={clearChat}
                                    aria-label="Clear conversation"
                                    title="Clear conversation"
                                    className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 space-y-5 scrollbar-hide">

                        {!hasMessages && (
                            <div className="flex flex-col items-center justify-center h-full min-h-[30vh] text-center px-4 animate-in fade-in duration-300">
                                <h1 className="text-2xl sm:text-3xl font-bold text-on-surface leading-snug">
                                    {t('copilot.greeting', { name: displayName })}
                                </h1>
                                <p className="text-on-surface-variant text-sm mt-3 font-medium">{t('copilot.subGreeting')}</p>

                                <div className="mt-6 w-full max-w-sm grid grid-cols-2 gap-2.5">
                                    {[
                                        { emoji: '🍽️', label: t('copilot.logMeal'), prompt: 'log my meal' },
                                        { emoji: '😴', label: t('copilot.logSleep'), prompt: 'log my sleep' },
                                        { emoji: '💧', label: t('copilot.logWater'), prompt: 'log water intake' },
                                        { emoji: '📓', label: t('copilot.endOfDay'), prompt: 'log my end of day reflection' },
                                        { emoji: '💪', label: t('copilot.workoutPlan'), prompt: 'give me a workout plan for today' },
                                        { emoji: '✅', label: 'Add a task', prompt: 'Add a new task to my planner' },
                                        { emoji: '📊', label: t('copilot.myProgress'), prompt: 'show me my progress this week' },
                                        { emoji: '📸', label: t('copilot.progressPic'), prompt: 'I want to log a progress picture' },
                                    ].map(({ emoji, label, prompt: p }) => (
                                        <button
                                            key={label}
                                            onClick={() => {
                                                triggerTap();
                                                handleSend(p);
                                            }}
                                            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-left text-sm font-semibold text-on-surface-variant hover:text-on-surface bg-surface-container border border-surface-variant hover:bg-surface-container-high transition-all active:scale-95 shadow-sm"
                                        >
                                            <span className="text-xl">{emoji}</span>
                                            <span>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-200`}>
                                {msg.sender === 'ava' ? (
                                    msg.isError && isDevMode ? (
                                        <div className="flex items-start gap-3 max-w-[95%] w-full">
                                            <AvaLogo size={28} className="rounded-full overflow-hidden shrink-0 mt-0.5" />
                                            <div className="bg-surface-container-low border border-red-500/30 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm w-full font-mono text-xs">
                                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                                                    <span className="text-red-400 font-bold uppercase tracking-wider">Request Failed</span>
                                                    <span className="text-white/40">{msg.requestId || 'UNKNOWN'}</span>
                                                </div>
                                                <div className="text-white/70 mb-1">Reason:</div>
                                                <div className="text-red-300 font-bold mb-3">{msg.text.replace('⚠️ ', '')}</div>
                                                
                                                {(msg as any).devDetails?.stack && (
                                                    <div className="mt-2 p-2 bg-red-950/40 rounded text-red-200/70 overflow-x-auto whitespace-pre">
                                                        {(msg as any).devDetails.stack}
                                                    </div>
                                                )}

                                                <div className="mt-4 flex gap-2">
                                                    <button onClick={() => handleSend(promptRef.current)} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors">Retry Request</button>
                                                    <a href={`/admin?request_id=${msg.requestId}`} target="_blank" rel="noreferrer" className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 rounded transition-colors flex items-center gap-1">Open Telemetry Logs <SlidersHorizontal size={12}/></a>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-3 w-full max-w-full">
                                            <div className="shrink-0 mt-0.5">
                                                <AvaLogo size={28} className="rounded-full overflow-hidden" />
                                            </div>
                                            <div className="flex flex-col gap-1 w-full">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-on-surface">Ava</span>
                                                    <span className="text-[10px] text-on-surface-variant">{msg.timestamp}</span>
                                                    {msg.requestId && isDevMode && <span className="text-[10px] text-purple-400 font-mono ml-auto">{msg.requestId}</span>}
                                                </div>
                                                <div className={`rounded-2xl rounded-tl-sm px-4 py-3 text-[15px] leading-relaxed ${msg.text.startsWith('⚠️') ? 'text-red-400 border border-red-500/30 bg-red-500/5' : 'text-on-surface bg-surface-container-low border border-white/5 backdrop-blur-xl'}`}>
                                                    <div className="prose dark:prose-invert max-w-none
                                                        prose-headings:text-on-surface prose-headings:font-bold prose-headings:text-xs prose-headings:uppercase prose-headings:tracking-wider prose-headings:mt-3 prose-headings:mb-1
                                                        prose-p:text-on-surface prose-p:leading-relaxed prose-p:my-1
                                                        prose-li:text-on-surface prose-li:my-0.5
                                                        prose-strong:text-on-surface prose-strong:font-bold
                                                        prose-hr:border-surface-variant prose-hr:my-3">
                                                        {msg.text.startsWith('⚠️') ? msg.text : <ReactMarkdown>{msg.text}</ReactMarkdown>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex flex-col items-end gap-1 w-full max-w-[85%] sm:max-w-[75%]">
                                        <div className="bg-[#0a84ff] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap shadow-sm">
                                            {msg.imageUrl && (
                                                <div className="relative rounded-2xl overflow-hidden border border-white/10 mb-1">
                                                    <img src={msg.imageUrl} alt="Uploaded preview" className="w-48 h-auto object-cover" />
                                                </div>
                                            )}
                                            <div className="break-words whitespace-pre-wrap font-medium">
                                                {msg.text}
                                            </div>
                                            <div className="text-[10px] text-white/30 mr-1 mt-1 text-right">{msg.timestamp}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-200">
                                <AvaLogo size={28} className="rounded-full overflow-hidden shrink-0 mt-0.5" />
                                <div className="bg-surface-container-low border border-white/5 backdrop-blur-xl rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 h-11">
                                    <span className="ava-typing-dot" style={{ animationDelay: '0ms' }} />
                                    <span className="ava-typing-dot" style={{ animationDelay: '180ms' }} />
                                    <span className="ava-typing-dot" style={{ animationDelay: '360ms' }} />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {chips.length > 0 && !loading && (
                        <div className="flex gap-2 px-4 sm:px-6 py-2 overflow-x-auto scrollbar-hide shrink-0 animate-in slide-in-from-bottom-4 duration-300">
                            {chips.map((chip) => (
                                <button
                                    key={chip}
                                    onClick={() => handleSend(chip)}
                                    className="ava-chip shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-on-surface-variant bg-surface-container border border-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors whitespace-nowrap shadow-sm"
                                >
                                    {chip.toLowerCase().includes('save') ? <BookmarkPlus size={12} className="text-on-surface-variant" /> :
                                     chip.toLowerCase().includes('make') || chip.toLowerCase().includes('add') || chip.toLowerCase().includes('log') ? <Sparkles size={12} className="text-on-surface-variant" /> :
                                     <Settings2 size={12} className="text-on-surface-variant" />}
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="shrink-0 px-4 sm:px-6 pb-6 pt-2">
                        <div className="flex items-end gap-2 bg-surface-container-lowest border border-white/10 rounded-full pl-3 pr-2 py-1.5 focus-within:border-white/30 transition-all backdrop-blur-3xl shadow-sm">
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                ref={cameraInputRef}
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => cameraInputRef.current?.click()}
                                className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors shrink-0 mb-0.5"
                                aria-label="Take Photo"
                            >
                                <Camera size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors shrink-0 mb-0.5 -ml-2"
                                aria-label="Upload from Gallery"
                            >
                                <ImageIcon size={20} />
                            </button>

                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={prompt}
                                onChange={handleInput}
                                onKeyDown={(e) => { 
                                    if (e.key === 'Enter' && !e.shiftKey) { 
                                        e.preventDefault(); 
                                        handleSend(); 
                                    } 
                                }}
                                placeholder={selectedImage ? t('copilot.imageReady') : "Type a message..."}
                                className="flex-1 max-h-[250px] bg-transparent py-2.5 text-sm text-on-surface font-medium focus:outline-none resize-none placeholder:text-on-surface-variant overflow-y-auto"
                            />

                            {selectedImage && (
                                <div className="relative shrink-0 mb-1">
                                    <img src={selectedImage} alt="preview" className="w-8 h-8 rounded-lg object-cover opacity-80" />
                                    <button onClick={() => setSelectedImage(null)} className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
                                        <X size={8} className="text-white" />
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => handleSend()}
                                disabled={(!prompt.trim() && !selectedImage) || loading}
                                className="w-8 h-8 rounded-full bg-[#0a84ff] text-white flex items-center justify-center disabled:opacity-30 transition-colors shrink-0 mb-0.5"
                                aria-label="Send message"
                            >
                                <Send size={14} className="ml-0.5" />
                            </button>
                        </div>

                        {/* Bottom row: controls + mic */}
                        <div className="flex items-center justify-between mt-3 px-2">
                            <button 
                                onClick={() => setIsConversationMode(!isConversationMode)}
                                className={`p-2 transition-colors flex items-center justify-center rounded-full ${isConversationMode ? 'text-white bg-white/10 shadow-[0_0_12px_rgba(168,85,247,0.4)]' : 'text-white/40 hover:text-white/70'}`} 
                                aria-label="Conversation Mode"
                                title="Toggle Conversation Mode"
                            >
                                {isConversationMode ? <MessageSquare size={20} /> : <VolumeX size={20} />}
                            </button>

                            <button
                                onClick={() => toggleListening()}
                                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                                className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${isListening ? 'bg-[#0a84ff] shadow-lg' : 'bg-surface-container-high border border-white/5'}`}
                            >
                                <div className="relative z-10">
                                    {isListening
                                        ? <Mic size={20} className="text-white" />
                                        : <AvaLogo size={24} className="opacity-80" />}
                                </div>
                                {/* Pulse rings when listening */}
                                {isListening && (
                                    <>
                                        <span className="absolute inset-0 rounded-full border border-[#0a84ff]/40 animate-ping" />
                                        <span className="absolute inset-[-4px] rounded-full border border-[#0a84ff]/20 animate-ping [animation-delay:0.5s]" />
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => toggleListening()}
                                aria-label="Voice input"
                                className={`p-2 transition-colors ${isListening ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                            >
                                <Mic size={20} />
                            </button>
                        </div>

                        {/* Listening status indicator */}
                        {isListening && (
                            <p className="text-center text-xs text-on-surface-variant font-medium mt-2 animate-pulse">
                                {t('copilot.listening')}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

