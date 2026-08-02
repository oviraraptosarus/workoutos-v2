'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Plus, Edit2, Sparkles, Search } from 'lucide-react';
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
    icon: string;
}

const FOOD_PRESETS: FoodPreset[] = [
    { name: 'Grilled Chicken Breast', category: 'Lunch', portion: '150g', calories: 240, carbs: 0, protein: 46, fat: 5, sugar: 0, icon: '🍗' },
    { name: 'Oatmeal & Honey', category: 'Breakfast', portion: '1 bowl', calories: 250, carbs: 45, protein: 8, fat: 4, sugar: 8, icon: '🥣' },
    { name: 'Boiled Eggs', category: 'Breakfast', portion: '2 large', calories: 140, carbs: 1, protein: 12, fat: 9, sugar: 0, icon: '🥚' },
    { name: 'Black Coffee / Espresso', category: 'Breakfast', portion: '1 cup', calories: 5, carbs: 0, protein: 0, fat: 0, sugar: 0, icon: '☕' },
    { name: 'Avocado Toast', category: 'Breakfast', portion: '1 slice', calories: 210, carbs: 22, protein: 6, fat: 11, sugar: 2, icon: '🍞' },
    { name: 'Salmon & Veggie Salad', category: 'Dinner', portion: '1 plate', calories: 420, carbs: 14, protein: 36, fat: 24, sugar: 4, icon: '🥗' },
    { name: 'Whey Protein Shake', category: 'Snacks', portion: '1 scoop', calories: 150, carbs: 4, protein: 28, fat: 2, sugar: 1, icon: '🥤' },
    { name: 'Honeycrisp Apple', category: 'Snacks', portion: '1 medium', calories: 95, carbs: 25, protein: 1, fat: 0, sugar: 19, icon: '🍎' },
    { name: 'Plain Greek Yogurt', category: 'Snacks', portion: '1 cup', calories: 130, carbs: 8, protein: 22, fat: 0, sugar: 6, icon: '🥣' },
    { name: 'Turkey & Cheese Sandwich', category: 'Lunch', portion: '1 sandwich', calories: 380, carbs: 36, protein: 26, fat: 14, sugar: 4, icon: '🥪' },
    { name: 'Dal & Chapati', category: 'Lunch', portion: '2 chapati + 1 bowl dal', calories: 420, carbs: 68, protein: 16, fat: 8, sugar: 3, icon: '🫓' },
    { name: 'Rice & Sabzi', category: 'Dinner', portion: '1 plate', calories: 380, carbs: 72, protein: 10, fat: 6, sugar: 2, icon: '🍛' },
    { name: 'Paneer Bhurji', category: 'Dinner', portion: '150g', calories: 320, carbs: 8, protein: 22, fat: 22, sugar: 2, icon: '🧀' },
    { name: 'Banana', category: 'Snacks', portion: '1 medium', calories: 105, carbs: 27, protein: 1, fat: 0, sugar: 14, icon: '🍌' },
];

const EMOJI_OPTIONS = ['☕', '🍞', '🥚', '🥗', '🍗', '🍎', '🥪', '🥑', '🥣', '🥤', '🥞', '🍕', '🥩', '🍌', '🫓', '🍛', '🧀', '🥦', '🍜', '🍣'];

const MACRO_FIELDS = [
    { key: 'calories', label: 'Calories', unit: 'kcal', accent: '#0a84ff', placeholder: '250' },
    { key: 'protein', label: 'Protein', unit: 'g', accent: '#30d158', placeholder: '15' },
    { key: 'carbs', label: 'Carbs', unit: 'g', accent: '#ff9f0a', placeholder: '30' },
    { key: 'fat', label: 'Fat', unit: 'g', accent: '#ff453a', placeholder: '8' },
    { key: 'sugar', label: 'Sugar', unit: 'g', accent: '#bf5af2', placeholder: '4' },
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
            bites: Number(bites) || Math.round((Number(calories) || 0) / 50),
            icon,
        });
        onClose();
    };

    const CATEGORY_CONFIG: Record<MealCategory, { emoji: string; color: string }> = {
        Breakfast: { emoji: '🌅', color: '#ff9f0a' },
        Lunch:     { emoji: '☀️', color: '#30d158' },
        Dinner:    { emoji: '🌙', color: '#0a84ff' },
        Snacks:    { emoji: '⚡', color: '#bf5af2' },
    };

    const activeColor = CATEGORY_CONFIG[category]?.color ?? '#0a84ff';

    const macroValues: Record<string, number | ''> = { calories, protein, carbs, fat, sugar };
    const macroSetters: Record<string, (v: number | '') => void> = {
        calories: setCalories, protein: setProtein, carbs: setCarbs, fat: setFat, sugar: setSugar,
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300"
                style={{ background: 'rgb(28,28,30)', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '92vh' }}
            >
                {/* Drag pill (mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-2xl flex items-center justify-center text-base font-bold"
                            style={{ background: `${activeColor}22`, color: activeColor }}
                        >
                            {initialData ? <Edit2 size={16} /> : <Plus size={18} />}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white leading-tight">
                                {initialData ? 'Edit Food Item' : 'Add Food Item'}
                            </h2>
                            <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                {initialData ? 'Modify and save changes' : 'Log what you ate'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-5 pt-3 pb-2 relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                        <input
                            type="text"
                            value={searchQuery}
                            onFocus={() => setShowPresets(true)}
                            onChange={(e) => { setSearchQuery(e.target.value); setShowPresets(true); }}
                            placeholder="Search food presets…"
                            className="w-full rounded-xl pl-8 pr-4 py-2.5 text-sm font-medium outline-none transition-all"
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                            }}
                        />
                    </div>

                    {showPresets && (
                        <div
                            className="mt-2 rounded-2xl overflow-hidden shadow-2xl z-20 max-h-44 overflow-y-auto"
                            style={{ background: 'rgb(36,36,38)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <div className="flex justify-between items-center px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <span className="text-[10px] font-bold tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>FOOD PRESETS</span>
                                <button type="button" onClick={() => setShowPresets(false)} className="text-[11px] font-bold" style={{ color: activeColor }}>Close</button>
                            </div>
                            {filteredPresets.length > 0 ? filteredPresets.map((preset, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => applyPreset(preset)}
                                    className="flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors"
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-lg">{preset.icon}</span>
                                        <div>
                                            <p className="text-sm font-bold text-white leading-tight">{preset.name}</p>
                                            <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{preset.portion}</p>
                                        </div>
                                    </div>
                                    <div className="text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{ background: `${activeColor}22`, color: activeColor }}>
                                        {preset.calories} kcal
                                    </div>
                                </div>
                            )) : (
                                <div className="px-3 py-4 text-center text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    No matches — fill in manually below
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Form body */}
                <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto flex-1">
                    <div className="px-5 py-4 space-y-4 flex-1">

                        {/* Category */}
                        <div>
                            <label className="block text-[11px] font-bold tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>CATEGORY</label>
                            <div className="grid grid-cols-4 gap-2">
                                {(Object.entries(CATEGORY_CONFIG) as [MealCategory, { emoji: string; color: string }][]).map(([cat, cfg]) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className="py-2 px-1 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col items-center gap-0.5"
                                        style={
                                            category === cat
                                                ? { background: `${cfg.color}22`, color: cfg.color, border: `1.5px solid ${cfg.color}55` }
                                                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1.5px solid rgba(255,255,255,0.08)' }
                                        }
                                    >
                                        <span className="text-base">{cfg.emoji}</span>
                                        <span>{cat}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Name + Icon */}
                        <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-3">
                                <label className="block text-[11px] font-bold tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>FOOD NAME *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Dal Chawal or Oats"
                                    className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all"
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                    }}
                                    onFocus={e => (e.currentTarget.style.borderColor = activeColor + '80')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>ICON</label>
                                <select
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="w-full rounded-xl px-2 py-2.5 text-lg text-center font-bold outline-none transition-all cursor-pointer"
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                    }}
                                >
                                    {EMOJI_OPTIONS.map((emoji) => (
                                        <option key={emoji} value={emoji}>{emoji}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Portion + Bites */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>PORTION / SERVING</label>
                                <input
                                    type="text"
                                    value={portion}
                                    onChange={(e) => setPortion(e.target.value)}
                                    placeholder="e.g. 1 cup or 200g"
                                    className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                    onFocus={e => (e.currentTarget.style.borderColor = activeColor + '80')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>BITES / POINTS</label>
                                <input
                                    type="number"
                                    value={bites}
                                    onChange={(e) => setBites(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="2"
                                    className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                    onFocus={e => (e.currentTarget.style.borderColor = activeColor + '80')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                                />
                            </div>
                        </div>

                        {/* Macros */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[11px] font-bold tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>NUTRIENT BREAKDOWN</label>
                                <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: activeColor }}>
                                    <Sparkles size={10} /> Auto-calculates totals
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                                {MACRO_FIELDS.slice(0, 2).map(({ key, label, unit, accent, placeholder }) => (
                                    <div key={key}>
                                        <label className="block text-[11px] font-bold mb-1" style={{ color: accent }}>
                                            {label} ({unit})
                                        </label>
                                        <input
                                            type="number"
                                            value={macroValues[key]}
                                            onChange={(e) => macroSetters[key](e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder={placeholder}
                                            className="w-full rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-all"
                                            style={{
                                                background: `${accent}12`,
                                                border: `1px solid ${accent}30`,
                                                color: 'white',
                                            }}
                                            onFocus={e => (e.currentTarget.style.borderColor = accent + '70')}
                                            onBlur={e => (e.currentTarget.style.borderColor = accent + '30')}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {MACRO_FIELDS.slice(2).map(({ key, label, unit, accent, placeholder }) => (
                                    <div key={key}>
                                        <label className="block text-[11px] font-bold mb-1" style={{ color: accent }}>
                                            {label} ({unit})
                                        </label>
                                        <input
                                            type="number"
                                            value={macroValues[key]}
                                            onChange={(e) => macroSetters[key](e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder={placeholder}
                                            className="w-full rounded-xl px-2.5 py-2.5 text-sm font-bold outline-none transition-all"
                                            style={{
                                                background: `${accent}12`,
                                                border: `1px solid ${accent}30`,
                                                color: 'white',
                                            }}
                                            onFocus={e => (e.currentTarget.style.borderColor = accent + '70')}
                                            onBlur={e => (e.currentTarget.style.borderColor = accent + '30')}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer actions */}
                    <div
                        className="flex items-center justify-between gap-3 px-5 py-4"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgb(28,28,30)' }}
                    >
                        {initialData && onDelete ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Remove this item?')) { onDelete(initialData.id); onClose(); }
                                }}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                                style={{ background: 'rgba(255,69,58,0.12)', color: '#ff453a', border: '1px solid rgba(255,69,58,0.25)' }}
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        ) : <div />}

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold transition-colors"
                                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all active:scale-95"
                                style={{ background: activeColor, boxShadow: `0 4px 16px ${activeColor}44` }}
                            >
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
