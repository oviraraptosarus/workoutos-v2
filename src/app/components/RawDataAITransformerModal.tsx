'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Mic, Check, Wand2, ArrowRight, Utensils, Droplet, Dumbbell, FileText } from 'lucide-react';
import { MealItem, MealCategory } from '../diet/types';

interface RawDataAITransformerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyDietMeals?: (meals: Omit<MealItem, 'id'>[]) => void;
    onApplyWater?: (waterMl: number) => void;
    onApplyBudget?: (items: { type: 'income' | 'expense'; amount: number; description: string; category: string }[]) => void;
}

interface ParsedResult {
    meals: {
        category: MealCategory;
        name: string;
        portion: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        sugar: number;
        icon: string;
    }[];
    waterMl: number;
    workoutNote?: string;
    quickNote?: string;
    budget?: { type: 'income' | 'expense'; amount: number; description: string; category: string }[];
}

export default function RawDataAITransformerModal({
    isOpen,
    onClose,
    onApplyDietMeals,
    onApplyWater,
    onApplyBudget,
}: RawDataAITransformerModalProps) {
    const [mounted, setMounted] = useState(false);
    const [rawText, setRawText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [appliedNotice, setAppliedNotice] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleVoiceDictation = () => {
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
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setRawText((prev) => prev ? prev + ' ' + finalTranscript : finalTranscript);
            }
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    const handleTransformRawData = () => {
        if (!rawText.trim()) return;
        setIsProcessing(true);

        setTimeout(() => {
            const textLower = rawText.toLowerCase();
            const result: ParsedResult = {
                meals: [],
                waterMl: 0,
                budget: [],
            };

            // 1. Parse Water
            const waterMatches = textLower.match(/(\d+)\s*(ml|l|liter|liters|glass|glasses|bottle|bottles)/gi);
            if (waterMatches) {
                waterMatches.forEach((w) => {
                    if (w.includes('l') || w.includes('liter')) {
                        const num = parseFloat(w.replace(/[^0-9.]/g, ''));
                        if (num) result.waterMl += Math.round(num * 1000);
                    } else if (w.includes('glass') || w.includes('bottle')) {
                        const num = parseInt(w.replace(/[^0-9]/g, '')) || 1;
                        result.waterMl += num * 250;
                    } else {
                        const num = parseInt(w.replace(/[^0-9]/g, ''));
                        if (num) result.waterMl += num;
                    }
                });
            }

            // 2. Parse Foods / Meals
            const sentences = rawText.split(/[,;.\n]+/);
            sentences.forEach((sentence) => {
                const sLower = sentence.toLowerCase().trim();
                if (!sLower) return;

                if (sLower.includes('egg') || sLower.includes('toast') || sLower.includes('breakfast')) {
                    result.meals.push({
                        category: 'Breakfast',
                        name: sLower.includes('egg') ? 'Eggs & Sourdough Toast' : 'Breakfast Items',
                        portion: '1 serving',
                        calories: sLower.includes('egg') ? 260 : 200,
                        protein: 16,
                        carbs: 24,
                        fat: 10,
                        sugar: 2,
                        icon: '🥚',
                    });
                } else if (sLower.includes('chicken') || sLower.includes('rice') || sLower.includes('bowl') || sLower.includes('lunch')) {
                    result.meals.push({
                        category: 'Lunch',
                        name: sLower.includes('chicken') ? 'Grilled Chicken Quinoa Bowl' : 'Lunch Meal',
                        portion: '1 bowl',
                        calories: 450,
                        protein: 38,
                        carbs: 42,
                        fat: 12,
                        sugar: 3,
                        icon: '🥗',
                    });
                } else if (sLower.includes('bar') || sLower.includes('protein bar') || sLower.includes('snack') || sLower.includes('apple')) {
                    result.meals.push({
                        category: 'Snacks',
                        name: sLower.includes('bar') ? 'Protein Snack Bar' : 'Snack Item',
                        portion: '1 piece',
                        calories: 200,
                        protein: 20,
                        carbs: 18,
                        fat: 6,
                        sugar: 4,
                        icon: '🍎',
                    });
                } else if (sLower.includes('steak') || sLower.includes('salmon') || sLower.includes('dinner') || sLower.includes('curry')) {
                    result.meals.push({
                        category: 'Dinner',
                        name: sLower.includes('salmon') ? 'Salmon & Roasted Veggies' : 'Dinner Meal',
                        portion: '1 plate',
                        calories: 480,
                        protein: 36,
                        carbs: 22,
                        fat: 18,
                        sugar: 3,
                        icon: '🥦',
                    });
                } else if (sLower.includes('run') || sLower.includes('workout') || sLower.includes('gym') || sLower.includes('treadmill')) {
                    result.workoutNote = sentence.trim();
                } else if (sLower.includes('spent') || sLower.includes('bought') || sLower.includes('paid')) {
                    // Simple budget extraction: spent/bought [amount] on [item]
                    const amountMatch = sLower.match(/(?:spent|bought|paid)?\s*(?:rs|inr|₹|\$)?\s*(\d+(?:\.\d+)?)/);
                    if (amountMatch) {
                        result.budget = result.budget || [];
                        result.budget.push({
                            type: 'expense',
                            amount: parseFloat(amountMatch[1]),
                            description: sentence.trim(),
                            category: sLower.includes('grocery') ? 'Groceries' : sLower.includes('protein') ? 'Supplements' : 'Other'
                        });
                    }
                } else if (sLower.includes('earned') || sLower.includes('got paid') || sLower.includes('salary')) {
                    const amountMatch = sLower.match(/(?:earned|got paid|salary)?\s*(?:rs|inr|₹|\$)?\s*(\d+(?:\.\d+)?)/);
                    if (amountMatch) {
                        result.budget = result.budget || [];
                        result.budget.push({
                            type: 'income',
                            amount: parseFloat(amountMatch[1]),
                            description: sentence.trim(),
                            category: 'Income'
                        });
                    }
                } else if (!sLower.includes('water') && !sLower.includes('ml')) {
                    result.quickNote = sentence.trim();
                }
            });

            setParsedResult(result);
            setIsProcessing(false);
        }, 900);
    };

    const handleAutoApplyAll = () => {
        if (!parsedResult) return;

        // Apply Meals
        if (parsedResult.meals.length > 0 && onApplyDietMeals) {
            onApplyDietMeals(
                parsedResult.meals.map((m) => ({
                    ...m,
                    bites: Math.round(m.calories / 50),
                }))
            );
        }

        // Apply Water
        if (parsedResult.waterMl > 0 && onApplyWater) {
            onApplyWater(parsedResult.waterMl);
        }

        // Apply Quick Note to localStorage
        if (parsedResult.workoutNote || parsedResult.quickNote) {
            try {
                const existingNote = localStorage.getItem('workout_os_quick_note_v1') || '';
                const append = [parsedResult.workoutNote, parsedResult.quickNote].filter(Boolean).join('\n• ');
                localStorage.setItem('workout_os_quick_note_v1', existingNote ? `${existingNote}\n• ${append}` : `• ${append}`);
            } catch (e) {
                console.error(e);
            }
        }

        // Apply Budget
        if (parsedResult.budget && parsedResult.budget.length > 0 && onApplyBudget) {
            onApplyBudget(parsedResult.budget);
        }

        setAppliedNotice(true);
        setTimeout(() => {
            setAppliedNotice(false);
            onClose();
        }, 1200);
    };

    const modalContent = (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-card-white/95 backdrop-blur-md rounded-2xl w-full max-w-xl shadow-[0_25px_70px_0_rgba(0,0,0,0.3)] border border-surface-variant overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-surface-variant bg-surface-container-low">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                            <Wand2 size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-on-surface drop-shadow-sm">
                                Raw Data AI Transformer
                            </h2>
                            <p className="text-[11px] font-bold text-cyan-800">
                                Dump raw text/voice notes & AI auto-sorts all logs
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface-variant transition-colors btn-press"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-5 space-y-5 overflow-y-auto">
                    
                    {/* Raw Text Scratchpad Area */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                Unstructured Raw Dump Scratchpad
                            </label>
                            <button
                                type="button"
                                onClick={handleVoiceDictation}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                                    isListening
                                        ? 'bg-white text-white border-white/20 animate-pulse'
                                        : 'bg-white/5 text-cyan-700 border-white/10 hover:bg-cyan-100'
                                }`}
                            >
                                <Mic size={13} /> {isListening ? 'Listening...' : 'Voice Dictate'}
                            </button>
                        </div>

                        <textarea
                            rows={4}
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder='Type or paste anything raw, e.g. "had 2 eggs n toast 8am, 500ml water, bought whey protein for 1500, earned 500 freelance, 1L water"'
                            className="w-full bg-surface-container-low border border-surface-variant rounded-2xl p-4 text-xs font-bold text-on-surface focus:outline-none focus:border-white/20 focus:bg-card-white transition-all placeholder:text-on-surface-variant resize-none shadow-inner"
                        />

                        <div className="flex justify-between items-center pt-1">
                            <span className="text-[10px] text-on-surface-variant font-bold">
                                No formatting needed! AI handles diet, water, workout & notes.
                            </span>
                            <button
                                type="button"
                                onClick={handleTransformRawData}
                                disabled={isProcessing || !rawText.trim()}
                                className="bg-white hover:bg-zinc-200 disabled:bg-surface-container-high text-black font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all btn-press"
                            >
                                {isProcessing ? (
                                    <>
                                        <Wand2 size={14} className="animate-spin" /> AI Sorting Data...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={14} /> Transform & Sort Raw Data
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Parsed Categorized Results */}
                    {parsedResult && (
                        <div className="space-y-4 pt-3 border-t border-surface-variant animate-in fade-in">
                            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                                Auto-Categorized Logs Preview
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Food / Meals Card */}
                                <div className="p-3.5 rounded-2xl bg-white/5/60 border border-white/10/60 shadow-sm space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                                        <Utensils size={14} className="text-white" />
                                        <span>Diet Logs ({parsedResult.meals.length})</span>
                                    </div>
                                    {parsedResult.meals.length > 0 ? (
                                        parsedResult.meals.map((m, i) => (
                                            <div key={i} className="text-[11px] font-bold text-on-surface-variant bg-card-white/70 p-2 rounded-xl border border-white/10">
                                                {m.icon} [{m.category}] {m.name} • <span className="text-emerald-700">{m.calories} kcal</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-[10px] text-on-surface-variant font-bold">No food items detected</div>
                                    )}
                                </div>

                                {/* Water Card */}
                                <div className="p-3.5 rounded-2xl bg-white/5/60 border border-white/10/60 shadow-sm space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                                        <Droplet size={14} className="text-white" />
                                        <span>Hydration Log</span>
                                    </div>
                                    {parsedResult.waterMl > 0 ? (
                                        <div className="text-[11px] font-bold text-blue-900 bg-card-white/70 p-2 rounded-xl border border-white/10">
                                            +{parsedResult.waterMl} ml water logged
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-on-surface-variant font-bold">No water intake detected</div>
                                    )}
                                </div>
                            </div>

                            {/* Workout & Quick Notes Card */}
                            {(parsedResult.workoutNote || parsedResult.quickNote || (parsedResult.budget && parsedResult.budget.length > 0)) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                    <div className="p-3.5 rounded-2xl bg-white/5/60 border border-white/10/60 shadow-sm space-y-1.5 text-xs font-bold text-purple-900">
                                        <div className="flex items-center gap-1.5 font-bold text-purple-800">
                                            <Dumbbell size={14} className="text-white" />
                                            <span>Workout & Notes Logs</span>
                                        </div>
                                        {parsedResult.workoutNote && (
                                            <div className="bg-card-white/70 p-2 rounded-xl text-[11px]">🏃 {parsedResult.workoutNote}</div>
                                        )}
                                        {parsedResult.quickNote && (
                                            <div className="bg-card-white/70 p-2 rounded-xl text-[11px]">📝 {parsedResult.quickNote}</div>
                                        )}
                                        {!parsedResult.workoutNote && !parsedResult.quickNote && (
                                            <div className="text-[10px] text-on-surface-variant font-bold">No notes detected</div>
                                        )}
                                    </div>
                                    
                                    <div className="p-3.5 rounded-2xl bg-white/5/60 border border-white/10/60 shadow-sm space-y-1.5 text-xs font-bold text-amber-900">
                                        <div className="flex items-center gap-1.5 font-bold text-amber-800">
                                            <FileText size={14} className="text-white" />
                                            <span>Budget Logs</span>
                                        </div>
                                        {parsedResult.budget && parsedResult.budget.length > 0 ? (
                                            parsedResult.budget.map((b, i) => (
                                                <div key={i} className="bg-card-white/70 p-2 rounded-xl text-[11px]">
                                                    {b.type === 'income' ? '💰' : '💳'} {b.type === 'income' ? '+' : '-'}₹{b.amount} ({b.category})
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-[10px] text-on-surface-variant font-bold">No budget items detected</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Auto-Apply All Button */}
                            <button
                                type="button"
                                onClick={handleAutoApplyAll}
                                disabled={appliedNotice}
                                className={`w-full font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all btn-press ${
                                    appliedNotice
                                        ? 'bg-white text-black'
                                        : 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-black'
                                }`}
                            >
                                {appliedNotice ? (
                                    <>
                                        <Check size={16} strokeWidth={3} /> Applied All Logs Successfully!
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} /> Auto-Apply Everything to App Logs
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
