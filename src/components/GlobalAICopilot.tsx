'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, X, Mic, Camera, SlidersHorizontal, BookmarkPlus, Settings2, Trash2, MessageSquare, VolumeX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { useRouter } from 'next/navigation';
import { getExpenses, getIncome, addTransaction } from '@/app/budget-tracker/services/budgetStorage';
import { getMealsForDate, saveMealsForDate } from '@/app/diet/services/dietStorage';
import { supabase } from '@/lib/supabaseClient';
import ReactMarkdown from 'react-markdown';


interface ChatMessage {
    id: string;
    sender: 'user' | 'ava';
    text: string;
    timestamp: string;
    imageUrl?: string;
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
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

    const recognitionRef = useRef<any>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
        const now = formatTime(new Date());

        const userMsg: ChatMessage = {
            id: `u-${Date.now()}`,
            sender: 'user',
            text: q || 'Analyzing image…',
            timestamp: now,
            imageUrl: currentImage ?? undefined,
        };

        setMessages(prev => [...prev, userMsg]);
        setPrompt('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        setSelectedImage(null);
        setChips([]);
        setLoading(true);

        try {
            const dateKey = selectedDate || new Date().toISOString().split('T')[0];
            const { data: { user } } = await supabase.auth.getUser();

            let dbState: any = {};
            let dbTasks: any[] = [];
            let recentDays: any[] = [];
            let workoutToday: any = null;

            if (user) {
                const { data } = await supabase
                    .from('daily_logs')
                    .select('water_ml_total, sleep_hours, sleep_bedtime, sleep_waketime, weight_kg, mood_rating, energy_rating, hunger_rating, caffeine_mg, steps')
                    .eq('user_id', user.id).eq('date', dateKey).maybeSingle();
                if (data) dbState = {
                    waterMl: data.water_ml_total, sleepHrs: data.sleep_hours,
                    bedtime: data.sleep_bedtime, waketime: data.sleep_waketime,
                    weightKg: data.weight_kg, mood: data.mood_rating,
                    energy: data.energy_rating, hunger: data.hunger_rating,
                    caffeineMg: data.caffeine_mg, steps: data.steps,
                };

                const meals = await getMealsForDate(dateKey);
                dbState.nutritionKcal = meals.reduce((acc: number, m: any) => acc + (m.calories || 0), 0);
                dbState.meals = meals.map((m: any) => ({ name: m.name, kcal: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat }));

                const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', user.id).eq('date', dateKey);
                if (tasksData) dbTasks = tasksData;

                const since = new Date();
                since.setDate(since.getDate() - 13);
                const sinceKey = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, '0')}-${String(since.getDate()).padStart(2, '0')}`;
                const { data: trend } = await supabase.from('daily_logs')
                    .select('date, sleep_hours, water_ml_total, weight_kg, mood_rating, energy_rating')
                    .eq('user_id', user.id).gte('date', sinceKey).order('date', { ascending: true });
                if (trend) recentDays = trend;

                const { data: wk } = await supabase.from('workout_logs')
                    .select('session_type, exercises, completed').eq('user_id', user.id).eq('date', dateKey);
                if (wk?.length) workoutToday = wk;
            }

            const currentAppState = {
                date: dateKey,
                waterMl: dbState.waterMl || 0, waterGoalMl: userProfile?.waterGoalMl ?? null,
                sleepHrs: dbState.sleepHrs || 0, sleepGoal: userProfile?.sleepGoal ?? null,
                bedtime: dbState.bedtime ?? null, waketime: dbState.waketime ?? null,
                weightKg: dbState.weightKg ?? null, targetWeight: userProfile?.targetWeight ?? null,
                mood: dbState.mood ?? null, energy: dbState.energy ?? null,
                hunger: dbState.hunger ?? null, caffeineMg: dbState.caffeineMg ?? null,
                steps: dbState.steps ?? null,
                nutritionKcal: dbState.nutritionKcal || 0, calorieGoal: userProfile?.calorieGoal ?? null,
                meals: dbState.meals || [], workoutToday, tasks: dbTasks, last14Days: recentDays,
                quickNotes: localStorage.getItem(`workout_os_quick_note_${dateKey}`) || '',
                budgetIncome: await getIncome(), budgetExpenses: await getExpenses(),
            };

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: q, userProfile, image: currentImage, history: apiHistory, appState: currentAppState }),
            });

            const data = await res.json();

            if (data.result || data.functionCall) {
                if (data.functionCall && user) {
                    const fn = data.functionCall.name;
                    const args = data.functionCall.args;
                    if (fn === 'add_task') {
                        await supabase.from('tasks').insert({ user_id: user.id, date: dateKey, title: args.title || 'New Task', description: '', completed: false });
                        window.dispatchEvent(new Event('workout_os_tasks_updated'));
                    } else if (fn === 'append_quick_note') {
                        const cur = localStorage.getItem(`workout_os_quick_note_${dateKey}`) || '';
                        localStorage.setItem(`workout_os_quick_note_${dateKey}`, cur + '\n' + (args.text || ''));
                        window.dispatchEvent(new StorageEvent('storage', { key: `workout_os_quick_note_${dateKey}` }));
                    } else if (fn === 'navigate_to' && args.path) {
                        router.push(args.path);
                        setTimeout(() => setIsOpen(false), 1000);
                    } else if (fn === 'log_water') {
                        const { addWaterLog } = await import('@/app/diet/services/dietStorage');
                        await addWaterLog(dateKey, Number(args.amount) || 0, 'Ava AI');
                        window.dispatchEvent(new Event('workout_os_water_updated'));
                    } else if (fn === 'log_sleep') {
                        const sleepHours = Number(args.hours) || 0;

                        // Build the detailed log entry (matches EnhancedSleepLogger format)
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

                        // Night sleep replaces the day's entry; nap would append
                        const updatedSleepLogs = [sleepLogEntry];

                        const sleepRow: any = {
                            user_id: user.id,
                            date: dateKey,
                            sleep_hours: sleepHours,
                            sleep_logs: updatedSleepLogs,
                        };
                        if (args.bedtime) sleepRow.sleep_bedtime = args.bedtime;
                        if (args.waketime) sleepRow.sleep_waketime = args.waketime;

                        await supabase
                            .from('daily_logs')
                            .upsert(sleepRow, { onConflict: 'user_id,date' });

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
                            icon: '🤖'
                        });
                        await saveMealsForDate(dateKey, meals);
                        window.dispatchEvent(new Event('storage'));
                        window.dispatchEvent(new Event('workout_os_diet_updated'));
                    } else if (fn === 'add_expense') {
                        await addTransaction({ date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), description: args.category || 'Expense', category: args.category || 'Other', amount: Number(args.amount) || 0, protein: null, costPerG: null, type: 'essential' }, 'expense');
                        window.dispatchEvent(new Event('workout_os_budget_updated'));
                    } else if (fn === 'add_income') {
                        await addTransaction({ date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), description: args.source || 'Income', source: args.source || 'Other', amount: Number(args.amount) || 0, type: 'one-time' }, 'income');
                        window.dispatchEvent(new Event('workout_os_budget_updated'));
                    }
                }

                const avaMsg: ChatMessage = {
                    id: `a-${Date.now()}`,
                    sender: 'ava',
                    text: data.result || 'Done.',
                    timestamp: formatTime(new Date()),
                };
                setMessages(prev => [...prev, avaMsg]);
                setApiHistory(prev => [...prev, { role: 'user', text: q }, { role: 'model', text: data.result || '' }]);
                setChips(deriveChips(data.result || ''));

                if (data.result && data.result.length < 200) {
                    if (isConversationModeRef.current) {
                        const utterance = new SpeechSynthesisUtterance(data.result.replace(/[#*•]/g, ''));
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
                throw new Error(data.error || 'No response');
            }
        } catch (err: any) {
            const errMsg: ChatMessage = {
                id: `e-${Date.now()}`,
                sender: 'ava',
                text: `⚠️ ${err.message || "I couldn't process that right now."}`,
                timestamp: formatTime(new Date()),
            };
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
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';
        const existing = promptRef.current ? promptRef.current + ' ' : '';
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
            const full = (existing + transcript).trim();
            setPrompt(full);
            // Auto-send after 3.5 seconds of silence
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                if (recognitionRef.current) recognitionRef.current.stop();
                setIsListening(false);
                // Auto-send the captured speech
                if (full) handleSend(full);
            }, 3500);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSelectedImage(reader.result as string);
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const hasMessages = messages.length > 0;

    return (
        <>
            {/* Floating Trigger Button */}
            {!isOpen && (
                <div className="fixed bottom-28 left-5 sm:bottom-8 sm:left-8 z-[9998] pointer-events-none">
                    <button
                        onClick={() => setIsOpen(true)}
                        aria-label="Open Ava, the AI assistant"
                        className="relative pointer-events-auto w-14 h-14 rounded-full shadow-[0_4px_24px_rgba(130,60,255,0.5)] active:scale-95 transition-transform duration-200 flex items-center justify-center overflow-hidden"
                    >
                        <div className="ava-orb-icon w-full h-full rounded-full" />
                    </button>
                </div>
            )}

            {/* Full-Screen Chat Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex flex-col bg-[#0d0d12]/95 backdrop-blur-2xl animate-in fade-in duration-200">

                    {/* Top Bar */}
                    <div className="flex items-center justify-between px-5 pt-14 pb-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="ava-orb-icon w-8 h-8 rounded-full shadow-[0_0_16px_rgba(130,60,255,0.7)]" />
                            <span className="text-white font-bold text-base tracking-tight">Ava</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Clear chat button — only show when there are messages */}
                            {hasMessages && (
                                <button
                                    onClick={clearChat}
                                    aria-label="Clear conversation"
                                    title="Clear conversation"
                                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-500/20 flex items-center justify-center text-white/50 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 space-y-5 scrollbar-hide">

                        {/* Welcome heading — only when no messages yet */}
                        {!hasMessages && (
                            <div className="flex flex-col items-center justify-center h-full min-h-[30vh] text-center px-4 animate-in fade-in duration-300">
                                <h1 className="text-2xl sm:text-3xl font-bold text-white/90 leading-snug">
                                    Hi {displayName}. What can<br />I help you with?
                                </h1>
                                <p className="text-white/40 text-sm mt-3 font-medium">Ask anything or tap a quick action below</p>

                                {/* Quick action grid */}
                                <div className="mt-6 w-full max-w-sm grid grid-cols-2 gap-2.5">
                                    {[
                                        { emoji: '🍽️', label: 'Log Meal', prompt: 'log my meal' },
                                        { emoji: '😴', label: 'Log Sleep', prompt: 'log my sleep' },
                                        { emoji: '💧', label: 'Log Water', prompt: 'log water intake' },
                                        { emoji: '📓', label: 'End of Day', prompt: 'log my end of day reflection' },
                                        { emoji: '💪', label: 'Workout Plan', prompt: 'give me a workout plan for today' },
                                        { emoji: '💸', label: 'Log Expense', prompt: 'log an expense' },
                                        { emoji: '📊', label: 'My Progress', prompt: 'show me my progress this week' },
                                        { emoji: '📸', label: 'Progress Pic', prompt: 'I want to log a progress picture' },
                                    ].map(({ emoji, label, prompt: p }) => (
                                        <button
                                            key={label}
                                            onClick={() => handleSend(p)}
                                            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-left text-sm font-semibold text-white/80 transition-all active:scale-95 hover:text-white"
                                            style={{
                                                background: 'rgba(255,255,255,0.07)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                                        >
                                            <span className="text-xl">{emoji}</span>
                                            <span>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-200`}>
                                {msg.sender === 'ava' && (
                                    <div className="flex items-start gap-2.5 max-w-[88%] sm:max-w-[80%]">
                                        <div className="shrink-0 mt-1">
                                            <div className="ava-orb-icon w-7 h-7 rounded-full shadow-[0_0_10px_rgba(130,60,255,0.6)]" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-purple-400">Ava</span>
                                                <span className="text-[10px] text-white/30">{msg.timestamp}</span>
                                            </div>
                                            <div className="ava-response-card rounded-2xl rounded-tl-sm p-4 text-sm text-white/85 leading-relaxed">
                                                <div className="prose prose-invert prose-sm max-w-none
                                                    prose-headings:text-purple-300 prose-headings:font-bold prose-headings:text-xs prose-headings:uppercase prose-headings:tracking-wider prose-headings:mt-3 prose-headings:mb-1
                                                    prose-p:text-white/80 prose-p:leading-relaxed prose-p:my-1
                                                    prose-li:text-white/80 prose-li:my-0.5
                                                    prose-strong:text-white prose-strong:font-semibold
                                                    prose-hr:border-white/10 prose-hr:my-3">
                                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {msg.sender === 'user' && (
                                    <div className="flex flex-col items-end gap-1 max-w-[80%] sm:max-w-[70%]">
                                        <div className="bg-[#2a2a38] rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white/90 leading-relaxed">
                                            {msg.imageUrl && (
                                                <img src={msg.imageUrl} alt="attached" className="w-40 rounded-xl mb-2 object-cover" />
                                            )}
                                            {msg.text}
                                        </div>
                                        <div className="flex items-center gap-1.5 pr-1">
                                            <span className="text-[10px] text-white/30">{msg.timestamp}</span>
                                            <svg width="14" height="10" viewBox="0 0 14 10" className="text-purple-400" fill="none">
                                                <path d="M1 5l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M5 5l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {loading && (
                            <div className="flex items-start gap-2.5 animate-in slide-in-from-bottom-2 duration-200">
                                <div className="ava-orb-icon w-7 h-7 rounded-full shrink-0 mt-1" />
                                <div className="ava-response-card rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                                    <span className="ava-typing-dot" style={{ animationDelay: '0ms' }} />
                                    <span className="ava-typing-dot" style={{ animationDelay: '180ms' }} />
                                    <span className="ava-typing-dot" style={{ animationDelay: '360ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick-Action Chips */}
                    {chips.length > 0 && !loading && (
                        <div className="flex gap-2 px-4 sm:px-6 py-2 overflow-x-auto scrollbar-hide shrink-0 animate-in slide-in-from-bottom-4 duration-300">
                            {chips.map((chip) => (
                                <button
                                    key={chip}
                                    onClick={() => handleSend(chip)}
                                    className="ava-chip shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white/80 border border-white/15 bg-white/5 hover:bg-white/10 transition-colors whitespace-nowrap"
                                >
                                    {chip.toLowerCase().includes('save') ? <BookmarkPlus size={12} className="text-purple-400" /> :
                                     chip.toLowerCase().includes('make') || chip.toLowerCase().includes('add') || chip.toLowerCase().includes('log') ? <Sparkles size={12} className="text-purple-400" /> :
                                     <Settings2 size={12} className="text-purple-400" />}
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Bar */}
                    <div className="shrink-0 px-4 sm:px-6 pb-6 pt-2">
                        <div className="flex items-end gap-3 bg-[#1e1e28] border border-white/10 rounded-2xl px-3 py-2 focus-within:border-purple-500/40 transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 text-white/40 hover:text-white/70 transition-colors shrink-0 mb-0.5"
                                aria-label="Attach image"
                            >
                                <Camera size={20} />
                            </button>

                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={prompt}
                                onChange={handleInput}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder={selectedImage ? 'Image ready. Add a message…' : 'Message Ava…'}
                                className="flex-1 max-h-[100px] bg-transparent py-2.5 text-sm text-white/85 font-medium focus:outline-none resize-none placeholder:text-white/30"
                            />

                            {selectedImage && (
                                <div className="relative shrink-0 mb-1">
                                    <img src={selectedImage} alt="preview" className="w-8 h-8 rounded-lg object-cover opacity-80" />
                                    <button onClick={() => setSelectedImage(null)} className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                                        <X size={8} className="text-white" />
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => handleSend()}
                                disabled={(!prompt.trim() && !selectedImage) || loading}
                                className="p-1.5 text-white/40 hover:text-purple-400 disabled:opacity-20 transition-colors shrink-0 mb-0.5"
                                aria-label="Send message"
                            >
                                <Send size={20} />
                            </button>
                        </div>

                        {/* Bottom row: controls + orb + mic */}
                        <div className="flex items-center justify-between mt-4 px-1">
                            <button 
                                onClick={() => setIsConversationMode(!isConversationMode)}
                                className={`p-2 transition-colors flex items-center justify-center rounded-full ${isConversationMode ? 'text-purple-400 bg-purple-500/10 shadow-[0_0_12px_rgba(168,85,247,0.4)]' : 'text-white/40 hover:text-white/70'}`} 
                                aria-label="Conversation Mode"
                                title="Toggle Conversation Mode"
                            >
                                {isConversationMode ? <MessageSquare size={20} /> : <VolumeX size={20} />}
                            </button>

                            {/* Glowing Siri-style orb */}
                            <button
                                onClick={toggleListening}
                                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                                className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 active:scale-90 ${isListening ? 'scale-110' : ''}`}
                            >
                                <div className={`absolute inset-0 rounded-full ava-orb-bg ${isListening || loading ? 'ava-orb-active' : ''}`} />
                                <div className="relative z-10">
                                    {isListening
                                        ? <Mic size={22} className="text-white drop-shadow-lg" />
                                        : <Sparkles size={22} className={`text-white ${loading ? 'animate-pulse' : ''}`} />}
                                </div>
                                {/* Pulse rings when listening */}
                                {isListening && (
                                    <>
                                        <span className="absolute inset-0 rounded-full border border-purple-400/40 animate-ping" />
                                        <span className="absolute inset-[-6px] rounded-full border border-purple-400/20 animate-ping [animation-delay:0.5s]" />
                                    </>
                                )}
                            </button>

                            <button
                                onClick={toggleListening}
                                aria-label="Voice input"
                                className={`p-2 transition-colors ${isListening ? 'text-purple-400' : 'text-white/40 hover:text-white/70'}`}
                            >
                                <Mic size={20} />
                            </button>
                        </div>

                        {/* Listening status indicator */}
                        {isListening && (
                            <p className="text-center text-xs text-purple-400/80 font-medium mt-2 animate-pulse">
                                Listening… speak now
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
