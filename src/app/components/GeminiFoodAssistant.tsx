'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Key, CheckCircle2, ChevronRight, X, Flame, Utensils, Zap, HelpCircle, Mic, MicOff, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDate } from '@/contexts/DateContext';
import { useRouter } from 'next/navigation';
import { getExpenses, getIncome, addTransaction } from '@/app/budget-tracker/services/budgetStorage';
import { getMealsForDate, saveMealsForDate } from '@/app/diet/services/dietStorage';
import { supabase } from '@/lib/supabase/client';

interface Message {
    id: string;
    sender: 'user' | 'gemini';
    text: string;
    timestamp: string;
    source?: string;
    imageUrl?: string;
}

const QUICK_PROMPTS = [
    { label: 'Log Water', text: 'Log 500ml of water' },
    { label: 'Log Sleep', text: 'I slept for 8 hours' },
    { label: 'Log Meal', text: 'I had 600 calories for lunch' },
    { label: 'Add Expense', text: 'I spent $15 on groceries' }
];

export default function GeminiFoodAssistant() {
    const { userProfile } = useAuth();
    const { selectedDate } = useDate();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'gemini',
            text: `👋 Hey ${userProfile?.fullName ? userProfile.fullName.split(' ')[0] : 'there'}! I'm Nova, your AI Copilot. Ask me anything, tell me to log a workout, or jot down a quick note!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Your browser does not support speech recognition. Try Chrome or Safari.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            setPrompt(transcript);
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
                console.error('Failed to compress image:', err);
                // Fallback to uncompressed
                const reader = new FileReader();
                reader.onloadend = () => setSelectedImage(reader.result as string);
                reader.readAsDataURL(file);
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSend = async (queryText?: string) => {
        const q = queryText || prompt;
        if (!q.trim() && !selectedImage) return;

        const currentImage = selectedImage;
        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: q,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            imageUrl: currentImage || undefined
        };

        setMessages((prev) => [...prev, userMsg]);
        if (!queryText) setPrompt('');
        setSelectedImage(null);
        setLoading(true);

        try {
            const currentHistory = [...messages, userMsg].map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                text: m.text,
                imageUrl: m.imageUrl
            }));

            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

            const dateKey = selectedDate || new Date().toISOString().split('T')[0];
            
            const { data: { user } } = await supabase.auth.getUser();
            let dbState: any = {};
            if (user) {
                const { data } = await supabase.from('daily_logs').select('water_ml_total, sleep_hours').eq('user_id', user.id).eq('date', dateKey).maybeSingle();
                if (data) {
                    dbState = { waterMl: data.water_ml_total, sleepHrs: data.sleep_hours };
                }
                const meals = await getMealsForDate(dateKey);
                dbState.nutritionKcal = meals.reduce((acc: number, m: any) => acc + (m.calories || 0), 0);
            }

            const currentAppState = {
                date: dateKey,
                waterMl: dbState.waterMl || 0,
                sleepHrs: dbState.sleepHrs || 0,
                nutritionKcal: dbState.nutritionKcal || 0,
                tasks: [], // tasks fetched from DB not needed in minimal context
                quickNotes: (userProfile?.targetConfig as any)?.quickNotes?.[dateKey] || '',
                budgetIncome: await getIncome(),
                budgetExpenses: await getExpenses()
            };

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: q,
                    userProfile,
                    image: currentImage,
                    history: currentHistory,
                    appState: currentAppState
                })
            });

            const data = await res.json();
            if (data.result || data.functionCall) {
                // Handle local app side-effects from AI function calls
                if (data.functionCall) {
                    const fn = data.functionCall.name;
                    const args = data.functionCall.args;
                    
                    if (fn === 'add_task') {
                        if (!user?.id) throw new Error('User not found');
                        await supabase.from('tasks').insert({
                            user_id: user.id, 
                            date: dateKey,
                            title: args.title || 'New Task',
                            full_title: args.fullTitle || args.title || 'New Task',
                            description: args.description || '',
                            completed: false,
                            due_date: args.dueDate || '',
                            due_time: args.dueTime || null,
                            priority: args.priority || 'none',
                            reminder_time: args.reminderTime || null
                        });
                        window.dispatchEvent(new Event('workout_os_tasks_updated'));

                        window.dispatchEvent(new CustomEvent('workout_os_highlight', { detail: { target: 'tasks' } }));
                    } else if (fn === 'append_quick_note') {
                        if (!user?.id) throw new Error('User not found');
                        const { data: profile } = await supabase.from('profiles').select('target_config').eq('id', user?.id).single();
                        const currentConfig = profile?.target_config || {};
                        const currentNote = currentConfig.quickNotes?.[dateKey] || '';
                        const updatedConfig = {
                            ...currentConfig,
                            quickNotes: {
                                ...(currentConfig.quickNotes || {}),
                                [dateKey]: currentNote + '\\n' + (args.text || '')
                            }
                        };
                        await supabase.from('profiles').update({ target_config: updatedConfig }).eq('id', user.id);

                    } else if (fn === 'navigate_to') {
                        if (args.path) {
                            router.push(args.path);
                            setIsOpen(false);
                        }
                    } else if (fn === 'log_water') {
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
                            const { data: existing } = await supabase.from('daily_logs').select('id').eq('user_id', user.id).eq('date', dateKey).maybeSingle();
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
                        window.dispatchEvent(new CustomEvent('workout_os_highlight', { detail: { target: 'budget_expense' } }));
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
                        window.dispatchEvent(new CustomEvent('workout_os_highlight', { detail: { target: 'budget_income' } }));
                    }
                }

                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    sender: 'gemini',
                    text: data.result,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    source: data.source
                };
                setMessages((prev) => [...prev, aiMsg]);
                setTimeout(() => {
                    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                throw new Error(data.error || 'No response');
            }
        } catch (err: any) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'gemini',
                text: `⚠️ Error: ${err.message || "Couldn't fetch response right now. Please try again!"}`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Google-Style Nova AI Search Bar */}
            <div className="relative group max-w-2xl mx-auto mb-6">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 rounded-full blur-sm opacity-50 group-hover:opacity-80 transition duration-300" />
                
                <div 
                    onClick={() => setIsOpen(true)}
                    className="relative bg-card-white border border-surface-variant rounded-full h-14 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-text transition-all flex items-center pl-4 pr-2"
                >
                    <div className="flex items-center gap-2 sm:gap-3 w-full">
                        <div className="flex-shrink-0 text-white">
                            <Sparkles size={22} className="animate-pulse" />
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 truncate">
                                    Nova AI Copilot
                                </span>
                            </div>
                            <div className="text-sm font-medium text-on-surface-variant truncate">
                                Ask anything or log a workout...
                            </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors btn-press">
                                <Mic size={18} />
                            </div>
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors btn-press">
                                <Camera size={18} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* iOS Apple Sheet Popup Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/20 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-card-white border border-surface-variant border-surface-variant w-full max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-lg overflow-hidden flex flex-col h-[75vh] sm:h-[550px]">
                        
                        {/* iOS Sheet Handlebar & Top Bar */}
                        <div className="px-6 py-4 border-b border-surface-variant flex items-center justify-between bg-card-white/20 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-400 to-purple-400 flex items-center justify-center text-white shadow-sm border border-surface-variant ">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-on-surface drop-shadow-sm flex items-center gap-2">
                                        Nova AI Copilot
                                    </h3>
                                    <p className="text-[11px] text-on-surface-variant font-bold">Tailored to goal: <span className="text-white font-bold">{userProfile?.fitnessGoal}</span></p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-full bg-surface-container-low border border-surface-variant hover:bg-surface-container text-on-surface-variant transition-colors shadow-sm"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Quick Action Pills Bar */}
                        <div className="px-4 py-2.5 bg-card-white/30 border-b border-surface-variant overflow-x-auto scrollbar-hide flex gap-2">
                            {QUICK_PROMPTS.map((qp, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(qp.text)}
                                    disabled={loading}
                                    className="flex-shrink-0 text-xs font-bold bg-surface-container-low hover:bg-card-white/70 text-on-surface-variant hover:text-on-surface px-3 py-1.5 rounded-full border border-surface-variant shadow-sm transition-all btn-press"
                                >
                                    {qp.label}
                                </button>
                            ))}
                        </div>

                        {/* Chat History List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className="flex items-center gap-1.5 mb-1 px-1">
                                        <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                                            {msg.sender === 'user' ? 'You' : 'Nova'}
                                        </span>
                                        <span className="text-[10px] text-on-surface-variant font-semibold">{msg.timestamp}</span>
                                    </div>

                                    <div
                                        className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                                            msg.sender === 'user'
                                                ? 'bg-white/90 text-white rounded-tr-xs font-bold border border-white/20 backdrop-blur-md'
                                                : 'bg-surface-container text-on-surface border border-surface-variant rounded-tl-xs font-medium whitespace-pre-wrap shadow-inner'
                                        }`}
                                    >
                                        {msg.imageUrl && (
                                            <img src={msg.imageUrl} alt="Uploaded food" className="w-full max-w-xs rounded-xl mb-2 object-cover border border-white/30" />
                                        )}
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex items-center gap-2 text-xs text-blue-700 font-bold bg-white/5/50 border border-white/10/50 px-4 py-3 rounded-2xl w-fit animate-pulse shadow-sm">
                                    <Sparkles size={14} className="animate-spin" />
                                    <span>Nova is analyzing your query...</span>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-surface-container-low border-t border-surface-variant shadow-[0_-4px_12px_rgba(0,0,0,0.02)] relative">
                            {selectedImage && (
                                <div className="absolute -top-16 left-4 right-4 bg-card-white border border-surface-variant rounded-xl p-2 shadow-lg flex items-center justify-between animate-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-3">
                                        <img src={selectedImage} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-surface-variant " />
                                        <span className="text-xs text-on-surface-variant font-bold">Image ready for analysis</span>
                                    </div>
                                    <button onClick={() => setSelectedImage(null)} className="p-1.5 bg-surface-container hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend();
                                }}
                                className="flex items-center gap-2"
                            >
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
                                    className="w-11 h-11 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors shadow-sm border border-surface-variant shrink-0"
                                >
                                    <Camera size={18} />
                                </button>
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={selectedImage ? "Add details (optional)..." : "Can I eat 2 donuts before leg day?"}
                                    className="flex-1 bg-surface-container border border-surface-variant rounded-2xl px-4 py-3 text-xs text-on-surface font-bold focus:outline-none focus:bg-card-white/90 focus:border-white/20 placeholder:text-on-surface-variant shadow-inner"
                                />
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors shadow-sm border shrink-0 ${isListening ? 'bg-white text-black border-white/20 animate-pulse' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-surface-variant '}`}
                                >
                                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                </button>
                                <button
                                    type="submit"
                                    disabled={(!prompt.trim() && !selectedImage) || loading}
                                    className="w-11 h-11 rounded-2xl bg-white/90 hover:bg-white disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-sm border border-white/20 btn-press shrink-0"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
