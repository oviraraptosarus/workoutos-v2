'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Mic, MicOff, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { useRouter } from 'next/navigation';
import { getExpenses, getIncome, addTransaction } from '@/app/budget-tracker/services/budgetStorage';
import { getMealsForDate, saveMealsForDate } from '@/app/diet/services/dietStorage';
import { supabase } from '@/lib/supabaseClient';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    sender: 'user' | 'gemini';
    text: string;
    timestamp: string;
    source?: string;
    imageUrl?: string;
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
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // We only keep track of the most recent interaction for the Siri-style UI
    const [activeQuery, setActiveQuery] = useState<string>('');
    const [activeResponse, setActiveResponse] = useState<string>('');
    
    // Hidden history for context to the API
    const [history, setHistory] = useState<{role: string, text: string}[]>([]);

    const recognitionRef = useRef<any>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Stop speech synthesis when closing
    useEffect(() => {
        if (!isOpen) {
            window.speechSynthesis.cancel();
            if (isListening && recognitionRef.current) {
                recognitionRef.current.stop();
                setIsListening(false);
            }
        } else {
            // Reset state when opening
            setActiveQuery('');
            setActiveResponse(`Hi ${userProfile?.fullName ? userProfile.fullName.split(' ')[0] : 'there'}. What can I help you with?`);
        }
    }, [isOpen, userProfile?.fullName]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    };

    const toggleListening = () => {
        window.speechSynthesis.cancel();

        if (isListening) {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Your browser does not support speech recognition. Try Chrome or Safari.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        const existingPrompt = prompt ? prompt + ' ' : '';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }
            const newPrompt = existingPrompt + currentTranscript;
            setPrompt(newPrompt);
            setActiveQuery(newPrompt); // Show immediately in the UI

            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                if (recognitionRef.current) recognitionRef.current.stop();
                setIsListening(false);
            }, 2000);
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

    const handleSend = async () => {
        window.speechSynthesis.cancel();
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        const q = prompt.trim();
        if (!q && !selectedImage) return;

        const currentImage = selectedImage;
        
        // Update UI
        setActiveQuery(q || "Analyzing image...");
        setActiveResponse('');
        setPrompt('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        setSelectedImage(null);
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
                    .eq('user_id', user.id)
                    .eq('date', dateKey)
                    .maybeSingle();
                if (data) dbState = {
                    waterMl: data.water_ml_total,
                    sleepHrs: data.sleep_hours,
                    bedtime: data.sleep_bedtime,
                    waketime: data.sleep_waketime,
                    weightKg: data.weight_kg,
                    mood: data.mood_rating,
                    energy: data.energy_rating,
                    hunger: data.hunger_rating,
                    caffeineMg: data.caffeine_mg,
                    steps: data.steps,
                };

                const meals = await getMealsForDate(dateKey);
                dbState.nutritionKcal = meals.reduce((acc: number, m: any) => acc + (m.calories || 0), 0);
                dbState.meals = meals.map((m: any) => ({
                    name: m.name, kcal: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat,
                }));

                const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', user.id).eq('date', dateKey);
                if (tasksData) dbTasks = tasksData;

                // 14-day trend so Ava can answer "how has my week been?" instead of
                // only seeing a single day.
                const since = new Date();
                since.setDate(since.getDate() - 13);
                const sinceKey = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, '0')}-${String(since.getDate()).padStart(2, '0')}`;
                const { data: trend } = await supabase
                    .from('daily_logs')
                    .select('date, sleep_hours, water_ml_total, weight_kg, mood_rating, energy_rating')
                    .eq('user_id', user.id)
                    .gte('date', sinceKey)
                    .order('date', { ascending: true });
                if (trend) recentDays = trend;

                const { data: wk } = await supabase
                    .from('workout_logs')
                    .select('session_type, exercises, completed')
                    .eq('user_id', user.id)
                    .eq('date', dateKey);
                if (wk?.length) workoutToday = wk;
            }

            const currentAppState = {
                date: dateKey,
                waterMl: dbState.waterMl || 0,
                waterGoalMl: userProfile?.waterGoalMl ?? null,
                sleepHrs: dbState.sleepHrs || 0,
                sleepGoal: userProfile?.sleepGoal ?? null,
                bedtime: dbState.bedtime ?? null,
                waketime: dbState.waketime ?? null,
                weightKg: dbState.weightKg ?? null,
                targetWeight: userProfile?.targetWeight ?? null,
                mood: dbState.mood ?? null,
                energy: dbState.energy ?? null,
                hunger: dbState.hunger ?? null,
                caffeineMg: dbState.caffeineMg ?? null,
                steps: dbState.steps ?? null,
                nutritionKcal: dbState.nutritionKcal || 0,
                calorieGoal: userProfile?.calorieGoal ?? null,
                meals: dbState.meals || [],
                workoutToday,
                tasks: dbTasks,
                last14Days: recentDays,
                quickNotes: localStorage.getItem(`workout_os_quick_note_${dateKey}`) || '',
                budgetIncome: await getIncome(),
                budgetExpenses: await getExpenses()
            };

            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: q,
                    userProfile,
                    image: currentImage,
                    history: history,
                    appState: currentAppState
                })
            });

            const data = await res.json();
            if (data.result || data.functionCall) {
                if (data.functionCall) {
                    const fn = data.functionCall.name;
                    const args = data.functionCall.args;
                    
                    if (fn === 'add_task' && user) {
                        await supabase.from('tasks').insert({ user_id: user.id, date: dateKey, title: args.title || 'New Task', description: '', completed: false });
                        window.dispatchEvent(new Event('workout_os_tasks_updated'));
                    } else if (fn === 'append_quick_note') {
                        const currentNote = localStorage.getItem(`workout_os_quick_note_${dateKey}`) || '';
                        localStorage.setItem(`workout_os_quick_note_${dateKey}`, currentNote + '\n' + (args.text || ''));
                        window.dispatchEvent(new StorageEvent('storage', { key: `workout_os_quick_note_${dateKey}` }));
                    } else if (fn === 'navigate_to' && args.path) {
                        router.push(args.path);
                        setTimeout(() => setIsOpen(false), 1000);
                    }
                    else if (fn === 'log_water') {
                        const added = Number(args.amount) || 0;
                        const newWater = currentAppState.waterMl + added;
                        if (user) {
                            const { data: existing } = await supabase.from('daily_logs').select('id').eq('user_id', user.id).eq('date', dateKey).maybeSingle();
                            if (existing) {
                                await supabase.from('daily_logs').update({ water_ml_total: newWater }).eq('id', existing.id);
                            } else {
                                await supabase.from('daily_logs').insert({ user_id: user.id, date: dateKey, water_ml_total: newWater });
                            }
                        }
                        window.dispatchEvent(new Event('storage'));
                    } else if (fn === 'log_sleep') {
                        const hours = Number(args.hours) || 0;
                        if (user) {
                            const { data: existing } = await supabase.from('daily_logs').select('id').eq('user_id', user.id).eq('date', dateKey).single();
                            if (existing) {
                                await supabase.from('daily_logs').update({ sleep_hours: hours }).eq('id', existing.id);
                            } else {
                                await supabase.from('daily_logs').insert({ user_id: user.id, date: dateKey, sleep_hours: hours });
                            }
                        }
                        window.dispatchEvent(new Event('storage'));
                    } else if (fn === 'log_nutrition') {
                        const meals = await getMealsForDate(dateKey);
                        meals.push({
                            id: Date.now().toString(),
                            name: args.food_name || args.mealName || 'AI Logged Meal',
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
                        const newExpense = {
                            id: Date.now().toString(),
                            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            description: args.category || 'Expense',
                            category: args.category || 'Other',
                            amount: Number(args.amount) || 0,
                            protein: null,
                            costPerG: null,
                            type: 'essential'
                        };
                        await addTransaction(newExpense, 'expense');
                        window.dispatchEvent(new Event('workout_os_budget_updated'));
                    } else if (fn === 'add_income') {
                        const newIncome = {
                            id: Date.now().toString(),
                            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            description: args.source || 'Income',
                            source: args.source || 'Other',
                            amount: Number(args.amount) || 0,
                            type: 'one-time'
                        };
                        await addTransaction(newIncome, 'income');
                        window.dispatchEvent(new Event('workout_os_budget_updated'));
                    }
                }

                setActiveResponse(data.result);
                setHistory(prev => [...prev, {role: 'user', text: q}, {role: 'model', text: data.result}]);
                
                // Speak the response natively if it's short
                if (data.result && data.result.length < 150) {
                    const utterance = new SpeechSynthesisUtterance(data.result);
                    utterance.lang = 'en-IN';
                    // Prefer a matching Indian-English voice when the platform ships one.
                    const inVoice = window.speechSynthesis.getVoices().find(v => v.lang === 'en-IN');
                    if (inVoice) utterance.voice = inVoice;
                    window.speechSynthesis.speak(utterance);
                }
            } else {
                throw new Error(data.error || 'No response');
            }
        } catch (err: any) {
            setActiveResponse(`⚠️ ${err.message || "I couldn't process that right now."}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Minimalist AI Command Trigger */}
            {!isOpen && (
                <div className="fixed bottom-28 left-5 sm:bottom-8 sm:left-8 z-[9998] flex pointer-events-none">
                    <button
                        onClick={() => setIsOpen(true)}
                        aria-label="Open Ava, the AI assistant"
                        className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-full bg-black/90 dark:bg-white/90 text-white dark:text-black shadow-[0_4px_12px_rgba(0,0,0,0.15),0_12px_32px_rgba(0,0,0,0.2)] active:scale-95 transition-transform duration-200"
                    >
                        <Sparkles size={16} />
                        <span className="font-label-md text-label-md tracking-wide">Ava</span>
                    </button>
                </div>
            )}

            {/* Siri-Style Full Screen Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-between p-6 sm:p-12 bg-black/70 backdrop-blur-3xl animate-in fade-in duration-300">
                    
                    {/* Top Right Close Button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-12 right-6 sm:top-12 sm:right-12 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
                    >
                        <X size={24} />
                    </button>

                    {/* Content Area - Top/Center Aligned */}
                    <div className="flex-1 w-full max-w-3xl flex flex-col items-center pt-32 pb-8 space-y-8 overflow-y-auto scrollbar-hide text-center">
                        {/* Active Query */}
                        {activeQuery && (
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white/90 leading-tight animate-in slide-in-from-bottom-4">
                                {activeQuery}
                            </h2>
                        )}

                        {/* Active Response */}
                        {loading ? (
                            <div className="text-xl text-white/50 animate-pulse font-medium mt-4">
                                Hmm...
                            </div>
                        ) : activeResponse ? (
                            <div className="text-xl sm:text-2xl text-white/70 font-medium leading-relaxed max-w-2xl animate-in slide-in-from-bottom-4 delay-150 prose prose-invert prose-p:leading-relaxed">
                                <ReactMarkdown>{activeResponse}</ReactMarkdown>
                            </div>
                        ) : null}
                    </div>

                    {/* Bottom Area: Siri Wave & Input */}
                    <div className="w-full max-w-3xl flex flex-col items-center gap-8 relative z-20 pb-8">
                        
                        {/* Siri-style animated orb */}
                        <div className="relative w-64 h-32 flex items-center justify-center">
                            {(() => {
                                const active = isListening || loading;
                                return (
                                    <>
                                        {/* Layered gradient blooms — drift slowly at rest, surge when active */}
                                        <div
                                            className="absolute w-32 h-32 rounded-full mix-blend-screen blur-[42px] animate-blob"
                                            style={{
                                                background: 'radial-gradient(circle, #2997FF 0%, transparent 70%)',
                                                opacity: active ? 0.95 : 0.35,
                                                transition: 'opacity 500ms ease',
                                                animationDuration: active ? '4s' : '15s',
                                            }}
                                        />
                                        <div
                                            className="absolute w-32 h-32 rounded-full mix-blend-screen blur-[42px] animate-blob"
                                            style={{
                                                background: 'radial-gradient(circle, #7B2FBE 0%, transparent 70%)',
                                                opacity: active ? 0.9 : 0.3,
                                                transition: 'opacity 500ms ease',
                                                animationDuration: active ? '5s' : '17s',
                                                animationDelay: '1.5s',
                                            }}
                                        />
                                        <div
                                            className="absolute w-32 h-32 rounded-full mix-blend-screen blur-[42px] animate-blob"
                                            style={{
                                                background: 'radial-gradient(circle, #E040A0 0%, transparent 70%)',
                                                opacity: active ? 0.85 : 0.25,
                                                transition: 'opacity 500ms ease',
                                                animationDuration: active ? '6s' : '19s',
                                                animationDelay: '3s',
                                            }}
                                        />

                                        {/* Expanding ring pulse while listening */}
                                        {isListening && (
                                            <>
                                                <span className="absolute w-24 h-24 rounded-full border border-white/30 animate-siri-ring" />
                                                <span className="absolute w-24 h-24 rounded-full border border-white/20 animate-siri-ring [animation-delay:0.8s]" />
                                            </>
                                        )}

                                        {/* Waveform bars — the clearest "I'm listening" signal */}
                                        {active && (
                                            <div className="absolute inset-x-0 bottom-1 flex items-end justify-center gap-1 h-8" aria-hidden="true">
                                                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                                    <span
                                                        key={i}
                                                        className="w-1 rounded-full bg-white/80 animate-siri-bar"
                                                        style={{
                                                            animationDelay: `${i * 90}ms`,
                                                            animationDuration: loading ? '1.1s' : '0.7s',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            onClick={toggleListening}
                                            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                                            aria-pressed={isListening}
                                            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-transform duration-300 active:scale-90 ${isListening ? 'scale-110' : ''}`}
                                        >
                                            {isListening
                                                ? <Mic size={30} className="text-white drop-shadow-lg" />
                                                : <Sparkles size={30} className={`text-white ${loading ? 'animate-pulse' : 'opacity-85'}`} />}
                                        </button>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Stealth Input Form */}
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="w-full flex items-end gap-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-3xl p-2 pl-4 transition-colors focus-within:bg-white/15 focus-within:border-white/30 backdrop-blur-md shadow-2xl"
                        >
                            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
                            
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-white/60 hover:text-white transition-colors shrink-0 mb-0.5">
                                <Camera size={22} />
                            </button>
                            
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={prompt}
                                onChange={handleInput}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                                }}
                                placeholder={selectedImage ? "Image ready. Add a message..." : "Message Ava..."}
                                className="flex-1 max-h-[120px] bg-transparent py-3.5 text-base text-white font-medium focus:outline-none resize-none placeholder:text-white/40"
                            />

                            <button
                                type="submit"
                                disabled={(!prompt.trim() && !selectedImage) || loading}
                                className="w-12 h-12 rounded-2xl bg-white/20 hover:bg-white/30 disabled:opacity-20 text-white flex items-center justify-center transition-colors shrink-0 mb-0.5"
                            >
                                <Send size={20} className={(!prompt.trim() && !selectedImage) ? "opacity-30" : ""} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
