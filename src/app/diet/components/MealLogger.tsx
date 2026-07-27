'use client';

import React, { useState } from 'react';
import { Sun, SunDim, Moon, Apple, Plus, Edit3, Trash2, ChevronDown, ChevronUp, Copy, Check, Search, Share2, ChefHat } from 'lucide-react';
import { MealItem, MealCategory } from '../types';

interface MealLoggerProps {
    meals: MealItem[];
    onAddMealClick: (category: MealCategory) => void;
    onEditMealClick: (meal: MealItem) => void;
    onDeleteMeal: (id: string) => void;
    onCopyYesterdayMeals?: () => void;
    onExportSummaryText?: () => void;
    onOpenRecipeModal?: () => void;
}

interface CategoryConfig {
    name: MealCategory;
    icon: React.ReactNode;
    color: string;
}

const CATEGORIES: CategoryConfig[] = [
    { name: 'Breakfast', icon: <Sun className="w-5 h-5 text-amber-500" />, color: 'text-amber-600 bg-amber-50' },
    { name: 'Lunch', icon: <SunDim className="w-5 h-5 text-orange-500" />, color: 'text-orange-600 bg-orange-50' },
    { name: 'Dinner', icon: <Moon className="w-5 h-5 text-indigo-500" />, color: 'text-indigo-600 bg-indigo-50' },
    { name: 'Snacks', icon: <Apple className="w-5 h-5 text-emerald-500" />, color: 'text-emerald-600 bg-emerald-50' },
];

export default function MealLogger({
    meals,
    onAddMealClick,
    onEditMealClick,
    onDeleteMeal,
    onCopyYesterdayMeals,
    onExportSummaryText,
    onOpenRecipeModal,
}: MealLoggerProps) {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [copiedNotice, setCopiedNotice] = useState(false);
    const [summaryCopied, setSummaryCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleCollapse = (catName: string) => {
        setCollapsed((prev) => ({ ...prev, [catName]: !prev[catName] }));
    };

    const handleCopyYesterdayClick = () => {
        if (onCopyYesterdayMeals) {
            onCopyYesterdayMeals();
            setCopiedNotice(true);
            setTimeout(() => setCopiedNotice(false), 2500);
        }
    };

    const handleExportClick = () => {
        if (onExportSummaryText) {
            onExportSummaryText();
            setSummaryCopied(true);
            setTimeout(() => setSummaryCopied(false), 2500);
        }
    };

    const filteredMeals = searchQuery.trim()
        ? meals.filter(
              (m) =>
                  m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  m.portion.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : meals;

    return (
        <div className="space-y-4">
            
            {/* Top Toolbar / Filter & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Daily Meal Log</span>
                
                <div className="flex flex-wrap items-center gap-2">
                    {/* Log Filter Input */}
                    <div className="relative flex-1 sm:flex-initial">
                        <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter logged foods..."
                            className="bg-gray-100 border border-gray-200 rounded-full pl-8 pr-3 py-1 text-xs font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-cyan-300 shadow-sm w-full sm:w-40"
                        />
                    </div>

                    {onOpenRecipeModal && (
                        <button
                            onClick={onOpenRecipeModal}
                            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-amber-200 shadow-sm btn-press"
                            title="Saved Recipe & Meal Combos"
                        >
                            <ChefHat size={14} className="text-amber-600" /> Saved Recipes
                        </button>
                    )}

                    {onExportSummaryText && (
                        <button
                            onClick={handleExportClick}
                            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-emerald-200/80 shadow-sm btn-press"
                            title="Copy Day's Summary to Clipboard"
                        >
                            {summaryCopied ? (
                                <>
                                    <Check size={13} className="text-emerald-600" /> Copied!
                                </>
                            ) : (
                                <>
                                    <Share2 size={13} /> Copy Summary
                                </>
                            )}
                        </button>
                    )}

                    {onCopyYesterdayMeals && (
                        <button
                            onClick={handleCopyYesterdayClick}
                            className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-stone-200 shadow-sm btn-press"
                        >
                            {copiedNotice ? (
                                <>
                                    <Check size={14} className="text-emerald-600" /> Copied!
                                </>
                            ) : (
                                <>
                                    <Copy size={13} /> Copy Yesterday
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {CATEGORIES.map(({ name, icon, color }) => {
                const categoryMeals = filteredMeals.filter((m) => m.category === name);
                const isCollapsed = collapsed[name];

                const totalCategoryBites = categoryMeals.reduce((acc, curr) => acc + (curr.bites || Math.round(curr.calories / 50)), 0);
                const totalCategoryCalories = categoryMeals.reduce((acc, curr) => acc + curr.calories, 0);

                return (
                    <div
                        key={name}
                        className="bg-white border border-gray-100 border-gray-200 rounded-3xl p-5 shadow-sm transition-all overflow-hidden"
                    >
                        {/* Section Header */}
                        <div className="flex items-center justify-between">
                            <div
                                onClick={() => toggleCollapse(name)}
                                className="flex items-center gap-3 cursor-pointer select-none group"
                            >
                                <div className={`p-2 rounded-2xl border border-gray-200 shadow-sm transition-transform group-hover:scale-105 ${color}`}>
                                    {icon}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-black text-cyan-950 uppercase tracking-wider drop-shadow-sm">
                                            {name}
                                        </h3>
                                        {isCollapsed ? <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" /> : <ChevronUp size={16} className="text-gray-400 dark:text-gray-500" />}
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                                        {categoryMeals.length} item{categoryMeals.length === 1 ? '' : 's'} • {totalCategoryCalories} kcal
                                    </span>
                                </div>
                            </div>

                            {/* Section Subtotal & Add Button */}
                            <div className="flex items-center gap-3">
                                {totalCategoryBites > 0 && (
                                    <span className="text-xs font-black text-cyan-900 tracking-wider">
                                        {totalCategoryBites} BITES
                                    </span>
                                )}

                                <button
                                    id={name === 'Breakfast' ? 'tour-add-food' : undefined}
                                    onClick={() => onAddMealClick(name)}
                                    className="p-1.5 rounded-full hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 transition-colors btn-press relative z-[110]"
                                    title={`Add item to ${name}`}
                                >
                                    <Plus size={20} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* Meal Items List */}
                        {!isCollapsed && (
                            <div className="mt-4 space-y-2">
                                {categoryMeals.length > 0 ? (
                                    categoryMeals.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => onEditMealClick(item)}
                                            className="group flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-white dark:bg-slate-900/90 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-stone-100/80 border border-stone-200/60 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
                                                    {item.icon || '🥗'}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-gray-900 drop-shadow-sm group-hover:text-emerald-700 transition-colors">
                                                        {item.name}
                                                    </h4>
                                                    <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mt-0.5">
                                                        {item.bites ? `${item.bites} BITES` : `${item.calories} KCAL`} • {item.portion}
                                                        {item.carbs ? ` • ${item.carbs}g carbs` : ''}
                                                        {item.sugar ? ` • ${item.sugar}g sugar` : ''}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditMealClick(item);
                                                    }}
                                                    className="p-1.5 rounded-xl hover:bg-stone-100 text-gray-400 hover:text-emerald-600 transition-colors btn-press"
                                                    title="Modify nutrient contents"
                                                >
                                                    <Edit3 size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm(`Remove ${item.name}?`)) {
                                                            onDeleteMeal(item.id);
                                                        }
                                                    }}
                                                    className="p-1.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors btn-press"
                                                    title="Remove meal item"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div
                                        onClick={() => onAddMealClick(name)}
                                        className="p-3 text-center rounded-2xl border border-dashed border-gray-200 text-xs font-bold text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-all cursor-pointer bg-white dark:bg-slate-900/20"
                                    >
                                        + Tap to add food to {name.toLowerCase()}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
