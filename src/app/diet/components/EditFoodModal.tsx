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
];

const EMOJI_OPTIONS = ['☕', '🍞', '🥚', '🥗', '🍗', '🍎', '🥪', '🥑', '🥣', '🥤', '🥞', '🍕', '🥩', '🍌'];

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
    const [calories, setCalories] = useState<number | ''>(0);
    const [carbs, setCarbs] = useState<number | ''>(0);
    const [protein, setProtein] = useState<number | ''>(0);
    const [fat, setFat] = useState<number | ''>(0);
    const [sugar, setSugar] = useState<number | ''>(0);
    const [bites, setBites] = useState<number | ''>(2);
    const [icon, setIcon] = useState('🥗');

    const [searchQuery, setSearchQuery] = useState('');
    const [showPresets, setShowPresets] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    const modalContent = (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-card-white/95 backdrop-blur-md rounded-3xl w-full max-w-lg shadow-[0_25px_70px_0_rgba(0,0,0,0.3)] border border-surface-variant overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-surface-variant bg-surface-container-low dark:bg-surface-container-high">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
                            {initialData ? <Edit2 size={16} /> : <Plus size={18} />}
                        </div>
                        <h2 className="text-lg font-black text-on-surface drop-shadow-sm">
                            {initialData ? 'Modify Meal Item' : 'Add Food Item'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface-variant transition-colors btn-press"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Quick Food Preset Search */}
                <div className="px-6 pt-4 pb-2 bg-emerald-50/40 border-b border-emerald-100/60 relative">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-3 text-emerald-600" />
                        <input
                            type="text"
                            value={searchQuery}
                            onFocus={() => setShowPresets(true)}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowPresets(true);
                            }}
                            placeholder="🔍 Quick Search Food Presets (e.g. Chicken, Oats, Eggs)..."
                            className="w-full bg-card-white border border-emerald-200 rounded-2xl pl-9 pr-4 py-2 text-xs font-bold text-on-surface focus:outline-none focus:border-emerald-500 shadow-sm"
                        />
                    </div>

                    {/* Presets Dropdown */}
                    {showPresets && (
                        <div className="mt-2 bg-card-white border border-emerald-200 rounded-2xl p-2 shadow-lg max-h-48 overflow-y-auto z-20 space-y-1">
                            <div className="flex justify-between items-center px-2 py-1 text-[10px] font-black text-on-surface-variant uppercase">
                                <span>Common Food Presets</span>
                                <button
                                    type="button"
                                    onClick={() => setShowPresets(false)}
                                    className="text-emerald-600 hover:underline"
                                >
                                    Close
                                </button>
                            </div>
                            {filteredPresets.length > 0 ? (
                                filteredPresets.map((preset, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => applyPreset(preset)}
                                        className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 text-xs cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{preset.icon}</span>
                                            <div>
                                                <span className="font-bold text-on-surface dark:text-white">{preset.name}</span>
                                                <span className="text-[10px] text-on-surface-variant font-medium ml-2">({preset.portion})</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-lg">
                                            {preset.calories} kcal • {preset.protein}g P
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-2 text-center text-xs text-on-surface-variant font-bold">
                                    No matching presets found. Type custom food below!
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    
                    {/* Category Selector */}
                    <div>
                        <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-2">Category</label>
                        <div className="grid grid-cols-4 gap-2">
                            {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as MealCategory[]).map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border ${
                                        category === cat
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                                            : 'bg-surface-container-low text-on-surface-variant border-surface-variant hover:bg-surface-container'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Food Name & Icon */}
                    <div className="grid grid-cols-4 gap-3">
                        <div className="col-span-3">
                            <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-1">Food Name *</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Avocado Toast or Coffee"
                                className="w-full bg-surface-container-low border border-stone-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-on-surface focus:outline-none focus:border-emerald-500 focus:bg-card-white transition-all placeholder:text-on-surface-variant dark:text-on-surface-variant"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-1">Icon</label>
                            <select
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="w-full bg-surface-container-low border border-stone-200 rounded-2xl px-3 py-2.5 text-lg text-center font-bold text-on-surface focus:outline-none focus:border-emerald-500 focus:bg-card-white transition-all cursor-pointer"
                            >
                                {EMOJI_OPTIONS.map((emoji) => (
                                    <option key={emoji} value={emoji}>
                                        {emoji}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Serving Portion & Bites */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-1">Portion / Serving</label>
                            <input
                                type="text"
                                value={portion}
                                onChange={(e) => setPortion(e.target.value)}
                                placeholder="e.g. 1 cup or 2 medium"
                                className="w-full bg-surface-container-low border border-stone-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-on-surface focus:outline-none focus:border-emerald-500 focus:bg-card-white transition-all placeholder:text-on-surface-variant dark:text-on-surface-variant"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-1">Bites / Points</label>
                            <input
                                type="number"
                                value={bites}
                                onChange={(e) => setBites(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="2"
                                className="w-full bg-surface-container-low border border-stone-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-on-surface focus:outline-none focus:border-emerald-500 focus:bg-card-white transition-all placeholder:text-on-surface-variant dark:text-on-surface-variant"
                            />
                        </div>
                    </div>

                    {/* Nutrients Header */}
                    <div className="pt-2 border-t border-surface-variant ">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-on-surface-variant uppercase tracking-wider">Nutrient Breakdown</span>
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                <Sparkles size={12} /> Auto-calculates totals
                            </span>
                        </div>

                        {/* Calories & Carbs */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Calories (kcal)</label>
                                <input
                                    type="number"
                                    value={calories}
                                    onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="250"
                                    className="w-full bg-surface-container-low border border-stone-200 rounded-2xl px-4 py-2.5 text-sm font-black text-on-surface focus:outline-none focus:border-emerald-500 focus:bg-card-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-orange-600 mb-1">Carbs (g)</label>
                                <input
                                    type="number"
                                    value={carbs}
                                    onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="30"
                                    className="w-full bg-orange-50/50 border border-orange-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-orange-950 focus:outline-none focus:border-orange-500 focus:bg-card-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Protein, Fat, Sugar */}
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-[11px] font-bold text-blue-600 mb-1">Protein (g)</label>
                                <input
                                    type="number"
                                    value={protein}
                                    onChange={(e) => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="15"
                                    className="w-full bg-blue-50/50 border border-blue-200 rounded-2xl px-3 py-2 text-xs font-bold text-blue-950 focus:outline-none focus:border-blue-500 focus:bg-card-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-rose-600 mb-1">Fat (g)</label>
                                <input
                                    type="number"
                                    value={fat}
                                    onChange={(e) => setFat(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="8"
                                    className="w-full bg-rose-50/50 border border-rose-200 rounded-2xl px-3 py-2 text-xs font-bold text-rose-950 focus:outline-none focus:border-rose-500 focus:bg-card-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-amber-600 mb-1">Sugar (g)</label>
                                <input
                                    type="number"
                                    value={sugar}
                                    onChange={(e) => setSugar(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="4"
                                    className="w-full bg-amber-50/50 border border-amber-200 rounded-2xl px-3 py-2 text-xs font-bold text-amber-950 focus:outline-none focus:border-amber-500 focus:bg-card-white transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex items-center justify-between gap-3 border-t border-surface-variant ">
                        {initialData && onDelete ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Are you sure you want to remove this meal item?')) {
                                        onDelete(initialData.id);
                                        onClose();
                                    }
                                }}
                                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors btn-press"
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                        ) : <div />}

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-3 rounded-2xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors btn-press"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-md transition-all btn-press"
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
