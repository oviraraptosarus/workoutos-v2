'use client';

import React, { useState } from 'react';
import { X, Sparkles, Mic, Plus, Check, ArrowRight, Wand2 } from 'lucide-react';
import { MealItem, MealCategory } from '../types';

interface GeminiMealAIModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddMeals: (meals: Omit<MealItem, 'id'>[]) => void;
}

interface ParsedFood {
    name: string;
    category: MealCategory;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    icon: string;
}

const COMMON_DICTIONARY: Record<string, { category: MealCategory; cal: number; p: number; c: number; f: number; sugar: number; icon: string; portion: string }> = {
    egg: { category: 'Breakfast', cal: 70, p: 6, c: 0.5, f: 5, sugar: 0, icon: '🥚', portion: '1 egg' },
    eggs: { category: 'Breakfast', cal: 140, p: 12, c: 1, f: 9, sugar: 0, icon: '🥚', portion: '2 eggs' },
    toast: { category: 'Breakfast', cal: 110, p: 4, c: 20, f: 1, sugar: 2, icon: '🍞', portion: '1 slice' },
    bread: { category: 'Breakfast', cal: 120, p: 4, c: 22, f: 1.5, sugar: 2, icon: '🍞', portion: '1 slice' },
    coffee: { category: 'Breakfast', cal: 15, p: 0, c: 1, f: 0, sugar: 0, icon: '☕', portion: '1 cup' },
    avocado: { category: 'Breakfast', cal: 160, p: 2, c: 9, f: 15, sugar: 0.5, icon: '🥑', portion: '1/2 avocado' },
    chicken: { category: 'Lunch', cal: 240, p: 46, c: 0, f: 5, sugar: 0, icon: '🍗', portion: '150g' },
    rice: { category: 'Lunch', cal: 205, p: 4, c: 45, f: 0.5, sugar: 0.1, icon: '🥣', portion: '1 cup' },
    salmon: { category: 'Dinner', cal: 350, p: 34, c: 0, f: 22, sugar: 0, icon: '🐟', portion: '180g' },
    broccoli: { category: 'Dinner', cal: 50, p: 4, c: 10, f: 0.5, sugar: 2, icon: '🥦', portion: '1 cup' },
    salad: { category: 'Lunch', cal: 180, p: 5, c: 12, f: 12, sugar: 4, icon: '🥗', portion: '1 bowl' },
    oatmeal: { category: 'Breakfast', cal: 220, p: 7, c: 38, f: 3.5, sugar: 2, icon: '🥣', portion: '1 bowl' },
    oats: { category: 'Breakfast', cal: 220, p: 7, c: 38, f: 3.5, sugar: 2, icon: '🥣', portion: '1 bowl' },
    shake: { category: 'Snacks', cal: 180, p: 26, c: 6, f: 3, sugar: 2, icon: '🥤', portion: '1 scoop' },
    protein: { category: 'Snacks', cal: 180, p: 26, c: 6, f: 3, sugar: 2, icon: '🥤', portion: '1 scoop' },
    apple: { category: 'Snacks', cal: 95, p: 0.5, c: 25, f: 0.3, sugar: 19, icon: '🍎', portion: '1 medium' },
    banana: { category: 'Snacks', cal: 105, p: 1.3, c: 27, f: 0.3, sugar: 14, icon: '🍌', portion: '1 medium' },
    yogurt: { category: 'Breakfast', cal: 130, p: 18, c: 8, f: 0.5, sugar: 6, icon: '🥣', portion: '1 cup' },
};

export default function GeminiMealAIModal({
    isOpen,
    onClose,
    onAddMeals,
}: GeminiMealAIModalProps) {
    const [promptText, setPromptText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [parsedFoods, setParsedFoods] = useState<ParsedFood[]>([]);
    const [isListening, setIsListening] = useState(false);

    if (!isOpen) return null;

    const handleVoiceInput = () => {
        setIsListening(true);
        setTimeout(() => {
            setPromptText('2 scrambled eggs with avocado toast and black coffee');
            setIsListening(false);
        }, 1800);
    };

    const handleAnalyze = () => {
        if (!promptText.trim()) return;
        setIsAnalyzing(true);

        setTimeout(() => {
            const tokens = promptText.toLowerCase().split(/[,;.\n]+/);
            const results: ParsedFood[] = [];

            tokens.forEach((token) => {
                const trimmed = token.trim();
                if (!trimmed) return;

                let matched = false;
                for (const [key, val] of Object.entries(COMMON_DICTIONARY)) {
                    if (trimmed.includes(key)) {
                        // Check multiplier numbers (e.g. "2 eggs" -> multiplier 2)
                        const numMatch = trimmed.match(/(\d+)/);
                        const multiplier = numMatch ? Math.min(5, Math.max(1, Number(numMatch[1]))) : 1;

                        const nameCapitalized = trimmed
                            .split(' ')
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(' ');

                        results.push({
                            name: nameCapitalized,
                            category: val.category,
                            portion: multiplier > 1 ? `${multiplier}x serving` : val.portion,
                            calories: val.cal * multiplier,
                            protein: Math.round(val.p * multiplier),
                            carbs: Math.round(val.c * multiplier),
                            fat: Math.round(val.f * multiplier),
                            sugar: Math.round(val.sugar * multiplier),
                            icon: val.icon,
                        });
                        matched = true;
                        break;
                    }
                }

                if (!matched) {
                    // Fallback generic parser for unlisted foods
                    const nameCap = trimmed
                        .split(' ')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ');

                    results.push({
                        name: nameCap,
                        category: 'Lunch',
                        portion: '1 serving',
                        calories: 220,
                        protein: 15,
                        carbs: 20,
                        fat: 8,
                        sugar: 3,
                        icon: '🥗',
                    });
                }
            });

            setParsedFoods(results);
            setIsAnalyzing(false);
        }, 800);
    };

    const handleConfirmLog = () => {
        if (parsedFoods.length > 0) {
            onAddMeals(
                parsedFoods.map((f) => ({
                    category: f.category,
                    name: f.name,
                    portion: f.portion,
                    calories: f.calories,
                    protein: f.protein,
                    carbs: f.carbs,
                    fat: f.fat,
                    sugar: f.sugar,
                    bites: Math.round(f.calories / 50),
                    icon: f.icon,
                }))
            );
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card-white/95 backdrop-blur-md rounded-3xl w-full max-w-lg shadow-[0_20px_60px_0_rgba(0,0,0,0.25)] border border-surface-variant overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-surface-variant bg-surface-container-low">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-on-surface drop-shadow-sm">
                                AI Natural Meal Logger
                            </h2>
                            <p className="text-[11px] font-bold text-emerald-700">
                                Speak or type your meal in plain English
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

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto">
                    
                    {/* Prompt Box */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-on-surface-variant uppercase tracking-wider">
                                Describe What You Ate
                            </label>
                            <button
                                type="button"
                                onClick={handleVoiceInput}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                                    isListening
                                        ? 'bg-white text-white border-white/20 animate-pulse'
                                        : 'bg-white/5 text-emerald-700 border-white/10 hover:bg-emerald-100'
                                }`}
                            >
                                <Mic size={13} /> {isListening ? 'Listening...' : 'Voice Input'}
                            </button>
                        </div>

                        <div className="relative">
                            <textarea
                                rows={3}
                                value={promptText}
                                onChange={(e) => setPromptText(e.target.value)}
                                placeholder='e.g. "I had 2 eggs with avocado toast and a black coffee for breakfast"'
                                className="w-full bg-surface-container-low border border-stone-200 rounded-2xl p-4 text-xs font-bold text-on-surface focus:outline-none focus:border-white/20 focus:bg-card-white transition-all placeholder:text-on-surface-variant resize-none shadow-inner"
                            />
                        </div>

                        <div className="flex justify-between items-center pt-1">
                            <span className="text-[10px] text-on-surface-variant font-bold">
                                Try typing: "200g chicken breast, 1 cup brown rice, broccoli"
                            </span>
                            <button
                                type="button"
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !promptText.trim()}
                                className="bg-white hover:bg-zinc-200 disabled:bg-surface-container-high text-black font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all btn-press"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Wand2 size={14} className="animate-spin" /> Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={14} /> Parse Meal
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Parsed Preview Results */}
                    {parsedFoods.length > 0 && (
                        <div className="space-y-3 pt-3 border-t border-surface-variant animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-on-surface-variant uppercase tracking-wider">
                                    Parsed Ingredients ({parsedFoods.length})
                                </span>
                                <span className="text-[10px] text-white font-bold">
                                    Total: {parsedFoods.reduce((a, b) => a + b.calories, 0)} kcal
                                </span>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {parsedFoods.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 rounded-2xl bg-card-white border border-stone-200 shadow-sm text-xs"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-lg">{item.icon}</span>
                                            <div>
                                                <div className="font-bold text-on-surface dark:text-white">{item.name}</div>
                                                <div className="text-[10px] text-on-surface-variant font-medium">
                                                    [{item.category}] • {item.portion}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-on-surface dark:text-white">{item.calories} kcal</div>
                                            <div className="text-[10px] text-emerald-700 font-bold">
                                                P:{item.protein}g C:{item.carbs}g F:{item.fat}g
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleConfirmLog}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg btn-press"
                            >
                                <Check size={16} strokeWidth={3} /> Log All {parsedFoods.length} Items to Daily Tracker
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
