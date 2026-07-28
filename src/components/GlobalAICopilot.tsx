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

const QUICK_PROMPTS = [
    { label: 'Log Water', text: 'Log 500ml of water' },
    { label: 'Log Sleep', text: 'I slept for 8 hours' },
    { label: 'Log Meal', text: 'I had 600 calories for lunch' },
    { label: 'Add Expense', text: 'I spent ₹1500 on groceries' }
];

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
    const [messages, setMessages] = useState<Message[]>([]);
    
    // Initialize welcome message only once
    useEffect(() => {
        setMessages([
            {
                id: '1',
                sender: 'gemini',
                text: `👋 Hey ${userProfile?.fullName ? userProfile.fullName.split(' ')[0] : 'there'}! I'm Nova, your AI Copilot. Ask me anything, tell me to log a workout, or jot down a quick note!`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
    }, [userProfile?.fullName]);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    };

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
        recognition.lang = 'en-IN'; // Optimized for Indian English

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            setPrompt(transcript);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
            }
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
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
        if (!queryText) {
            setPrompt('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        }
        setSelectedImage(null);
        setLoading(true);

        try {
            const currentHistory = [...messages, userMsg].map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                text: m.text,
                imageUrl: m.imageUrl
            }));

            // Auto-scroll effect
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

            const dateKey = selectedDate || new Date().toISOString().split('T')[0];
            
            const { data: { user } } = await supabase.auth.getUser();
            let dbState: any = {};
            if (user) {
                const { data } = await supabase.from('daily_logs').select('water_ml, sleep_hours').eq('user_id', user.id).eq('date', dateKey).single();
                if (data) {
                    dbState = { waterMl: data.water_ml, sleepHrs: data.sleep_hours };
                }
                const meals = await getMealsForDate(dateKey);
                dbState.nutritionKcal = meals.reduce((acc: number, m: any) => acc + (m.calories || 0), 0);
            }

            const currentAppState = {
                date: dateKey,
                waterMl: dbState.waterMl || 0,
                sleepHrs: dbState.sleepHrs || 0,
                nutritionKcal: dbState.nutritionKcal || 0,
                tasks: JSON.parse(localStorage.getItem('workout_os_tasks') || '[]'),
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
                        const tasks = JSON.parse(localStorage.getItem('workout_os_tasks') || '[]');
                        tasks.push({
                            id: Date.now().toString(),
                            title: args.title || 'New Task',
                            completed: false,
                            dueDate: dateKey
                        });
                        localStorage.setItem('workout_os_tasks', JSON.stringify(tasks));
                        window.dispatchEvent(new Event('workout_os_tasks_updated'));
                    } else if (fn === 'append_quick_note') {
                        const currentNote = localStorage.getItem(`workout_os_quick_note_${dateKey}`) || '';
                        localStorage.setItem(`workout_os_quick_note_${dateKey}`, currentNote + '\n' + (args.text || ''));
                        window.dispatchEvent(new StorageEvent('storage', { key: `workout_os_quick_note_${dateKey}` }));
                    } else if (fn === 'navigate_to') {
                        if (args.path) {
                            router.push(args.path);
                            setIsOpen(false);
                        }
                    } else if (fn === 'log_water') {
                        const added = Number(args.amount) || 0;
                        const newWater = currentAppState.waterMl + added;
                        if (user) {
                            const { data: existing } = await supabase.from('daily_logs').select('id').eq('user_id', user.id).eq('date', dateKey).single();
                            if (existing) {
                                await supabase.from('daily_logs').update({ water_ml: newWater }).eq('id', existing.id);
                            } else {
                                await supabase.from('daily_logs').insert({ user_id: user.id, date: dateKey, water_ml: newWater });
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

                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    sender: 'gemini',
                    text: data.result,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    source: data.source
                };
                setMessages((prev) => [...prev, aiMsg]);
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
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-28 left-5 sm:bottom-6 sm:left-8 z-[60] p-4 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center animate-in zoom-in-50"
                >
                    <Sparkles size={24} className="animate-pulse" />
                </button>
            )}

            {/* Modal Overlay & Card */}
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-md transition-opacity duration-300">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 w-full max-w-3xl sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[700px] animate-in slide-in-from-bottom duration-300">
                        
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100/50 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-gray-900 dark:text-white drop-shadow-sm flex items-center gap-2">
                                        Nova AI
                                    </h3>
                                    <p className="text-[11px] text-gray-500 font-bold dark:text-gray-400">Always-on Copilot</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-full bg-gray-100/50 hover:bg-gray-200/50 dark:bg-slate-800 text-gray-500 transition-colors shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Quick Prompts */}
                        <div className="px-4 py-3 border-b border-gray-100/50 dark:border-slate-800 overflow-x-auto scrollbar-hide flex gap-2">
                            {QUICK_PROMPTS.map((qp, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(qp.text)}
                                    disabled={loading}
                                    className="flex-shrink-0 text-xs font-bold bg-white/50 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full border border-gray-200/50 dark:border-slate-700 shadow-sm transition-all"
                                >
                                    {qp.label}
                                </button>
                            ))}
                        </div>

                        {/* Chat Window */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                            {msg.sender === 'user' ? 'You' : 'Nova'}
                                        </span>
                                        <span className="text-[10px] text-gray-400/70 font-semibold">{msg.timestamp}</span>
                                    </div>

                                    <div
                                        className={`max-w-[90%] sm:max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed shadow-sm ${
                                            msg.sender === 'user'
                                                ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-sm font-medium border border-blue-400/20'
                                                : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-slate-700 rounded-tl-sm font-medium shadow-md'
                                        }`}
                                    >
                                        {msg.imageUrl && (
                                            <img src={msg.imageUrl} alt="Uploaded" className="w-full max-w-xs rounded-xl mb-3 object-cover shadow-sm" />
                                        )}
                                        {msg.sender === 'gemini' ? (
                                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:rounded-xl">
                                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex items-center gap-3 text-sm text-blue-600 font-bold bg-blue-50/50 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 px-5 py-4 rounded-3xl w-fit animate-pulse shadow-sm">
                                    <Sparkles size={16} className="animate-spin" />
                                    <span>Nova is thinking...</span>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area - Sticky at bottom */}
                        <div className="p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-t border-gray-100 dark:border-slate-800 relative z-10">
                            {selectedImage && (
                                <div className="absolute -top-16 left-4 right-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-2 shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-3">
                                        <img src={selectedImage} alt="Preview" className="w-12 h-12 object-cover rounded-xl border border-gray-100 dark:border-slate-700" />
                                        <span className="text-xs text-gray-600 dark:text-gray-300 font-bold">Image ready for analysis</span>
                                    </div>
                                    <button onClick={() => setSelectedImage(null)} className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full text-gray-600 dark:text-gray-300 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend();
                                }}
                                className="flex items-end gap-2"
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
                                    className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400 flex items-center justify-center transition-colors border border-transparent shadow-sm shrink-0 mb-0.5"
                                >
                                    <Camera size={20} />
                                </button>
                                
                                <div className="flex-1 relative rounded-3xl bg-gray-100/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 overflow-hidden shadow-inner flex items-center min-h-[52px]">
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
                                        placeholder={selectedImage ? "Add details (optional)..." : "Message Nova..."}
                                        className="w-full max-h-[150px] bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-white font-medium focus:outline-none resize-none placeholder:text-gray-500"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm border shrink-0 mb-0.5 ${isListening ? 'bg-rose-500 text-white border-rose-600 animate-pulse scale-105' : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400 border-transparent'}`}
                                >
                                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>
                                <button
                                    type="submit"
                                    disabled={(!prompt.trim() && !selectedImage) || loading}
                                    className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-md border border-white/20 shrink-0 mb-0.5"
                                >
                                    <Send size={20} className={(!prompt.trim() && !selectedImage) ? "opacity-50" : ""} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
