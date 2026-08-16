'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Plus, Edit2, Sparkles, Search, Check } from 'lucide-react';
import { MealItem, MealCategory } from '../types';

interface EditFoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (meal: Omit<MealItem, 'id'> & { id?: string }) => void;
    onDelete?: (id: string) => void;
    initialData?: MealItem | null;
    defaultCategory?: MealCategory;
}

interface FoodPreset {
    name: string;
    category: MealCategory;
    portion: string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    sugar: number;
    fiber: number;
    icon: string;
}

const FOOD_PRESETS: FoodPreset[] = [
    { name: 'Grilled Chicken Breast', category: 'Lunch', portion: '150g', calories: 240, carbs: 0, protein: 46, fat: 5, sugar: 0, fiber: 0, icon: '🍗' },
    { name: 'Oatmeal & Honey', category: 'Breakfast', portion: '1 bowl', calories: 250, carbs: 45, protein: 8, fat: 4, sugar: 8, fiber: 5, icon: '🥣' },
    { name: 'Boiled Eggs', category: 'Breakfast', portion: '2 large', calories: 140, carbs: 1, protein: 12, fat: 9, sugar: 0, fiber: 0, icon: '🥚' },
    { name: 'Black Coffee / Espresso', category: 'Breakfast', portion: '1 cup', calories: 5, carbs: 0, protein: 0, fat: 0, sugar: 0, fiber: 0, icon: '☕' },
    { name: 'Avocado Toast', category: 'Breakfast', portion: '1 slice', calories: 210, carbs: 22, protein: 6, fat: 11, sugar: 2, fiber: 6, icon: '🍞' },
    { name: 'Salmon & Veggie Salad', category: 'Dinner', portion: '1 plate', calories: 420, carbs: 14, protein: 36, fat: 24, sugar: 4, fiber: 6, icon: '🥗' },
    { name: 'Whey Protein Shake', category: 'Snacks', portion: '1 scoop', calories: 150, carbs: 4, protein: 28, fat: 2, sugar: 1, fiber: 1, icon: '🥤' },
    { name: 'Honeycrisp Apple', category: 'Snacks', portion: '1 medium', calories: 95, carbs: 25, protein: 1, fat: 0, sugar: 19, fiber: 4, icon: '🍎' },
    { name: 'Plain Greek Yogurt', category: 'Snacks', portion: '1 cup', calories: 130, carbs: 8, protein: 22, fat: 0, sugar: 6, fiber: 0, icon: '🥣' },
    { name: 'Turkey & Cheese Sandwich', category: 'Lunch', portion: '1 sandwich', calories: 380, carbs: 36, protein: 26, fat: 14, sugar: 4, fiber: 4, icon: '🥪' },
    { name: 'Dal & Chapati', category: 'Lunch', portion: '2 chapati + 1 bowl dal', calories: 420, carbs: 68, protein: 16, fat: 8, sugar: 3, fiber: 10, icon: '🫓' },
    { name: 'Rice & Sabzi', category: 'Dinner', portion: '1 plate', calories: 380, carbs: 72, protein: 10, fat: 6, sugar: 2, fiber: 6, icon: '🍛' },
    { name: 'Paneer Bhurji', category: 'Dinner', portion: '150g', calories: 320, carbs: 8, protein: 22, fat: 22, sugar: 2, fiber: 1, icon: '🧀' },
    { name: 'Banana', category: 'Snacks', portion: '1 medium', calories: 105, carbs: 27, protein: 1, fat: 0, sugar: 14, fiber: 3, icon: '🍌' },
];

const EMOJI_OPTIONS = ['☕', '🍞', '🥚', '🥗', '🍗', '🍎', '🥪', '🥑', '🥣', '🥤', '🥞', '🍕', '🥩', '🍌', '🫓', '🍛', '🧀', '🥦', '🍜', '🍣'];

const MACRO_FIELDS = [
    { key: 'calories', label: 'Calories', unit: 'kcal', accent: '#0a84ff', placeholder: '250' },
    { key: 'protein', label: 'Protein', unit: 'g', accent: '#30d158', placeholder: '15' },
    { key: 'carbs', label: 'Carbs', unit: 'g', accent: '#ff9f0a', placeholder: '30' },
    { key: 'fat', label: 'Fat', unit: 'g', accent: '#ff453a', placeholder: '8' },
    { key: 'sugar', label: 'Sugar', unit: 'g', accent: '#bf5af2', placeholder: '4' },
    { key: 'fiber', label: 'Fiber', unit: 'g', accent: '#34c759', placeholder: '5' },
];

export default function EditFoodModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData,
    defaultCategory = 'Breakfast',
}: EditFoodModalProps) {
    const [mounted, setMounted] = useState(false);
    const [category, setCategory] = useState<MealCategory>(defaultCategory);
    const [name, setName] = useState('');
    const [portion, setPortion] = useState('');
    const [calories, setCalories] = useState<number | ''>('');
    const [carbs, setCarbs] = useState<number | ''>('');
    const [protein, setProtein] = useState<number | ''>('');
    const [fat, setFat] = useState<number | ''>('');
    const [sugar, setSugar] = useState<number | ''>('');
    const [fiber, setFiber] = useState<number | ''>('');
    const [bites, setBites] = useState<number | ''>(2);
    const [icon, setIcon] = useState('🥗');

    const [searchQuery, setSearchQuery] = useState('');
    const [showPresets, setShowPresets] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (initialData) {
            setCategory(initialData.category);
            setName(initialData.name);
            setPortion(initialData.portion || '');
            setCalories(initialData.calories || 0);
            setCarbs(initialData.carbs || 0);
            setProtein(initialData.protein || 0);
            setFat(initialData.fat || 0);
            setSugar(initialData.sugar || 0);
            setFiber(initialData.fiber || 0);
            setBites(initialData.bites ?? Math.round((initialData.calories || 0) / 50));
            setIcon(initialData.icon || '🥗');
        } else {
            setCategory(defaultCategory);
            setName('');
            setPortion('1 serving');
            setCalories('');
            setCarbs('');
            setProtein('');
            setFat('');
            setSugar('');
            setFiber('');
            setBites(2);
            setIcon(defaultCategory === 'Breakfast' ? '☕' : defaultCategory === 'Lunch' ? '🥗' : defaultCategory === 'Dinner' ? '🍗' : '🍎');
        }
        setSearchQuery('');
        setShowPresets(false);
    }, [initialData, defaultCategory, isOpen]);

    if (!isOpen || !mounted) return null;

    const applyPreset = (preset: FoodPreset) => {
        setName(preset.name);
        setCategory(preset.category);
        setPortion(preset.portion);
        setCalories(preset.calories);
        setCarbs(preset.carbs);
        setProtein(preset.protein);
        setFat(preset.fat);
        setSugar(preset.sugar);
        setFiber(preset.fiber);
        setBites(Math.round(preset.calories / 50));
        setIcon(preset.icon);
        setShowPresets(false);
        setSearchQuery('');
    };

    const filteredPresets = FOOD_PRESETS.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({
            ...(initialData?.id ? { id: initialData.id } : {}),
            category,
            name: name.trim(),
            portion: portion.trim() || '1 serving',
            calories: Number(calories) || 0,
            carbs: Number(carbs) || 0,
            protein: Number(protein) || 0,
            fat: Number(fat) || 0,
            sugar: Number(sugar) || 0,
            fiber: Number(fiber) || 0,
            bites: Number(bites) || Math.round((Number(calories) || 0) / 50),
            icon,
        });
        onClose();
    };

    const CATEGORY_CONFIG: Record<MealCategory, { emoji: string; color: string }> = {
        Breakfast: { emoji: '🌅', color: '#ffffff' },
        Lunch:     { emoji: '☀️', color: '#ffffff' },
        Dinner:    { emoji: '🌙', color: '#ffffff' },
        Snacks:    { emoji: '⚡', color: '#ffffff' },
    };

    const activeColor = '#ffffff';

    const macroValues: Record<string, number | ''> = { calories, protein, carbs, fat, sugar, fiber };
    const macroSetters: Record<string, (v: number | '') => void> = {
        calories: setCalories, protein: setProtein, carbs: setCarbs, fat: setFat, sugar: setSugar, fiber: setFiber,
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-2xl glass-card-premium"
                style={{ maxHeight: '92vh' }}
            >
                {/* Drag pill (mobile) */}
                <div className="flex justify-center pt-4 pb-2 sm:hidden">
                    <div className="w-12 h-1.5 rounded-full bg-on-surface/20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-black/20 border border-white/10 text-white"
                        >
                            {initialData ? <Edit2 size={18} /> : <Plus size={20} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-white leading-tight">
                                {initialData ? 'Edit Food Item' : 'Add Food Item'}
                            </h2>
                            <p className="font-label-sm text-[11px] text-white/50 mt-0.5">
                                {initialData ? 'Modify and save changes' : 'Log what you ate'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-black/20 hover:bg-black/40 text-white/70 hover:text-white active:scale-95 border border-white/10"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-6 pt-4 pb-3 relative border-b border-white/10">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                        <input
                            type="text"
                            value={searchQuery}
                            onFocus={() => setShowPresets(true)}
                            onChange={(e) => { setSearchQuery(e.target.value); setShowPresets(true); }}
                            placeholder="Search food presets…"
                            className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium outline-none transition-all bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:bg-black/40 focus:border-white/20"
                        />
                    </div>

                    {showPresets && (
                        <div className="absolute top-full left-6 right-6 mt-2 rounded-2xl overflow-hidden shadow-2xl z-20 max-h-48 overflow-y-auto bg-black/60 backdrop-blur-xl border border-white/10">
                            <div className="flex justify-between items-center px-4 py-2.5 border-b border-white/10 bg-black/40">
                                <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-white/50">Presets</span>
                                <button type="button" onClick={() => setShowPresets(false)} className="font-label-sm text-label-sm font-semibold text-white/70 hover:text-white uppercase tracking-wider">Close</button>
                            </div>
                            {filteredPresets.length > 0 ? filteredPresets.map((preset, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => applyPreset(preset)}
                                    className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b border-white/5 last:border-0 hover:bg-black/40"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center text-lg">
                                            {preset.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold tracking-tight text-white leading-tight">{preset.name}</p>
                                            <p className="font-label-sm text-[11px] text-white/50 mt-0.5">{preset.portion}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-black/40 text-white border border-white/10">
                                        {preset.calories} kcal
                                    </div>
                                </div>
                            )) : (
                                <div className="px-4 py-6 text-center text-xs font-medium text-on-surface-variant">
                                    No matches — fill in manually below
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Form body */}
                <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto flex-1">
                    <div className="px-6 py-5 space-y-5 flex-1">

                        {/* Category */}
                        <div>
                            <label className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-white/70 block mb-2">Category</label>
                            <div className="grid grid-cols-4 gap-2">
                                {(Object.entries(CATEGORY_CONFIG) as [MealCategory, { emoji: string; color: string }][]).map(([cat, cfg]) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`py-2.5 px-1 rounded-2xl text-xs font-semibold transition-all duration-300 flex flex-col items-center gap-1.5 border ${
                                            category === cat
                                                ? 'bg-[#0a84ff] text-white border-[#0a84ff] shadow-md shadow-[#0a84ff]/20'
                                                : 'bg-black/20 text-white/50 border-white/10 hover:bg-black/40 hover:text-white'
                                        }`}
                                    >
                                        <span className="text-lg opacity-90">{cfg.emoji}</span>
                                        <span>{cat}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Name + Icon */}
                        <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-3">
                                <label className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-white/70 block mb-2">Food Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Dal Chawal or Oats"
                                    className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none transition-all bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:bg-black/40 focus:border-white/20"
                                />
                            </div>
                            <div>
                                <label className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-white/70 block mb-2">Icon</label>
                                <select
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="w-full rounded-2xl px-2 py-3.5 text-xl text-center font-bold outline-none transition-all cursor-pointer bg-black/20 border border-white/10 text-white focus:bg-black/40 focus:border-white/20 appearance-none"
                                >
                                    {EMOJI_OPTIONS.map((emoji) => (
                                        <option key={emoji} value={emoji} className="bg-neutral-900 text-xl">{emoji}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Portion + Bites */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-white/70 block mb-2">Portion / Serving</label>
                                <input
                                    type="text"
                                    value={portion}
                                    onChange={(e) => setPortion(e.target.value)}
                                    placeholder="e.g. 1 cup"
                                    className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none transition-all bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:bg-black/40 focus:border-white/20"
                                />
                            </div>
                            <div>
                                <label className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-white/70 block mb-2">Bites / Points</label>
                                <input
                                    type="number"
                                    value={bites}
                                    onChange={(e) => setBites(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="2"
                                    className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none transition-all bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:bg-black/40 focus:border-white/20"
                                />
                            </div>
                        </div>

                        {/* Macros */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-white/70">Nutrient Breakdown</label>
                                <span className="font-label-sm text-label-sm font-semibold flex items-center gap-1 text-white/50 uppercase tracking-wider">
                                    <Sparkles size={12} className="text-[#0a84ff]" /> Auto-calculates
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {MACRO_FIELDS.slice(0, 2).map(({ key, label, unit, placeholder }) => (
                                    <div key={key}>
                                        <label className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-white block mb-1.5">
                                            {label} <span className="text-white/50">({unit})</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={macroValues[key]}
                                            onChange={(e) => macroSetters[key](e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder={placeholder}
                                            className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none transition-all bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:bg-black/40 focus:border-white/20"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {MACRO_FIELDS.slice(2).map(({ key, label, unit, placeholder }) => (
                                    <div key={key}>
                                        <label className="font-label-sm text-[10px] font-semibold uppercase tracking-wider text-white block mb-1.5">
                                            {label}
                                        </label>
                                        <input
                                            type="number"
                                            value={macroValues[key]}
                                            onChange={(e) => macroSetters[key](e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder={placeholder}
                                            className="w-full rounded-2xl px-3 py-3 text-sm font-semibold outline-none transition-all bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:bg-black/40 focus:border-white/20"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer / Submit */}
                    <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3 bg-black/20 backdrop-blur-xl shrink-0">
                        {initialData && onDelete ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Remove this item?')) { onDelete(initialData.id); onClose(); }
                                }}
                                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 active:scale-95"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        ) : <div />}

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-3 rounded-2xl text-sm font-semibold text-white/70 hover:text-white bg-black/20 hover:bg-black/40 border border-white/10 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!name.trim()}
                                className="px-6 py-3 rounded-2xl text-sm font-semibold bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white shadow-lg shadow-[#0a84ff]/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2 active:scale-95"
                            >
                                {initialData ? (
                                    <Check size={16} />
                                ) : (
                                    <Plus size={16} />
                                )}
                                {initialData ? 'Save Changes' : 'Add Food Item'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
