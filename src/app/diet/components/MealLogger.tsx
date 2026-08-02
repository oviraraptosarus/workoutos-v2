'use client';

import React, { useState } from 'react';
import { Sun, SunDim, Moon, Apple, Plus, Edit3, Trash2, ChevronDown, ChevronUp, Copy, Check, Search, Share2, ChefHat, Sparkles } from 'lucide-react';
import { MealItem, MealCategory } from '../types';

interface MealLoggerProps {
    meals: MealItem[];
    onAddMealClick: (category: MealCategory) => void;
    onEditMealClick: (meal: MealItem) => void;
    onDeleteMeal: (id: string) => void;
    onCopyYesterdayMeals?: () => void;
    onExportSummaryText?: () => void;
    onOpenRecipeModal?: () => void;
    onOpenAIMealModal?: () => void;
}

interface CategoryConfig {
    name: MealCategory;
    icon: React.ReactNode;
    color: string;
}

const CATEGORIES: CategoryConfig[] = [
    { name: 'Breakfast', icon: <Sun className="w-5 h-5 text-white" />, color: 'text-white bg-white/5' },
    { name: 'Lunch', icon: <SunDim className="w-5 h-5 text-white" />, color: 'text-white bg-white/5' },
    { name: 'Dinner', icon: <Moon className="w-5 h-5 text-white" />, color: 'text-white bg-white/5' },
    { name: 'Snacks', icon: <Apple className="w-5 h-5 text-white" />, color: 'text-white bg-white/5' },
];

export default function MealLogger({
    meals,
    onAddMealClick,
    onEditMealClick,
    onDeleteMeal,
    onCopyYesterdayMeals,
    onExportSummaryText,
    onOpenRecipeModal,
    onOpenAIMealModal,
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
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Daily Meal Log</span>
                
                <div className="flex flex-wrap items-center gap-2">
                    {/* Log Filter Input */}
                    <div className="relative flex-1 sm:flex-initial">
                        <Search size={14} className="absolute left-2.5 top-2.5 text-on-surface-variant dark:text-on-surface-variant" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter logged foods..."
                            className="bg-surface-container border border-surface-variant rounded-full pl-8 pr-3 py-1 text-xs font-bold text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-card-white focus:border-white/10 shadow-sm w-full sm:w-40"
                        />
                    </div>

                    {onOpenRecipeModal && (
                        <button
                            onClick={onOpenRecipeModal}
                            className="flex items-center gap-1.5 bg-white/5 hover:bg-amber-100 text-amber-900 px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-white/10 shadow-sm btn-press"
                            title="Saved Recipe & Meal Combos"
                        >
                            <ChefHat size={14} className="text-white" /> Saved Recipes
                        </button>
                    )}

                    {onExportSummaryText && (
                        <button
                            onClick={handleExportClick}
                            className="flex items-center gap-1.5 bg-white/5 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-white/10/80 shadow-sm btn-press"
                            title="Copy Day's Summary to Clipboard"
                        >
                            {summaryCopied ? (
                                <>
                                    <Check size={13} className="text-white" /> Copied!
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
                            className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface dark:text-on-surface px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-surface-variant dark:border-surface-variant shadow-sm btn-press"
                        >
                            {copiedNotice ? (
                                <>
                                    <Check size={14} className="text-white" /> Copied!
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
                        className="bg-card-white border border-surface-variant border-surface-variant rounded-3xl p-5 shadow-sm transition-all overflow-hidden"
                    >
                        {/* Section Header */}
                        <div className="flex items-center justify-between">
                            <div
                                onClick={() => toggleCollapse(name)}
                                className="flex items-center gap-3 cursor-pointer select-none group"
                            >
                                <div className={`p-2 rounded-2xl border border-surface-variant shadow-sm transition-transform group-hover:scale-105 ${color}`}>
                                    {icon}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                                            {name}
                                        </h3>
                                        {isCollapsed ? <ChevronDown size={16} className="text-on-surface-variant dark:text-on-surface-variant" /> : <ChevronUp size={16} className="text-on-surface-variant dark:text-on-surface-variant" />}
                                    </div>
                                    <span className="text-[11px] font-bold text-on-surface-variant dark:text-on-surface-variant">
                                        {categoryMeals.length} item{categoryMeals.length === 1 ? '' : 's'} • {totalCategoryCalories} kcal
                                    </span>
                                </div>
                            </div>

                            {/* Section Subtotal & Add Button */}
                            <div className="flex items-center gap-3">
                                {totalCategoryBites > 0 && (
                                    <span className="text-xs font-bold text-activity-blue tracking-wider">
                                        {totalCategoryBites} BITES
                                    </span>
                                )}

                                {name === 'Snacks' && onOpenAIMealModal && (
                                    <button
                                        onClick={onOpenAIMealModal}
                                        className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap"
                                        title="AI Voice & Natural Language Meal Logger"
                                    >
                                        <Sparkles size={14} className="shrink-0" /> <span className="hidden sm:inline">AI Log</span>
                                    </button>
                                )}

                                <button
                                    id={name === 'Breakfast' ? 'tour-add-food' : undefined}
                                    onClick={() => onAddMealClick(name)}
                                    className="p-1.5 rounded-full hover:bg-white/5 text-emerald-700 hover:text-emerald-800 transition-colors btn-press relative z-[110]"
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
                                            className="group flex items-center justify-between p-3 rounded-2xl bg-surface-container-low hover:bg-card-white/90 border border-surface-variant shadow-sm hover:shadow-md transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-surface-container/80 border border-stone-200/60 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
                                                    {item.icon || '🥗'}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-on-surface drop-shadow-sm group-hover:text-emerald-700 transition-colors">
                                                        {item.name}
                                                    </h4>
                                                    <p className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider mt-0.5">
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
                                                    className="p-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-white transition-colors btn-press"
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
                                                    className="p-1.5 rounded-xl hover:bg-white/5 text-on-surface-variant hover:text-white transition-colors btn-press"
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
                                        className="p-3 text-center rounded-2xl border border-dashed border-surface-variant text-xs font-bold text-on-surface-variant hover:border-white/20 hover:text-white transition-all cursor-pointer bg-card-white/20"
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
