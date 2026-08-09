'use client';

import React, { useState } from 'react';
import { Sun, SunDim, Moon, Apple, Plus, Edit3, Trash2, ChevronDown, ChevronUp, Copy, Check, Search, Share2, ChefHat, Sparkles } from 'lucide-react';
import { MealItem, MealCategory } from '../types';
import { useLanguage } from '@/contexts/LanguageContext';

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
    { name: 'Breakfast', icon: <Sun className="w-5 h-5 text-on-surface" />, color: 'text-on-surface' },
    { name: 'Lunch', icon: <SunDim className="w-5 h-5 text-on-surface" />, color: 'text-on-surface' },
    { name: 'Dinner', icon: <Moon className="w-5 h-5 text-on-surface" />, color: 'text-on-surface' },
    { name: 'Snacks', icon: <Apple className="w-5 h-5 text-on-surface" />, color: 'text-on-surface' },
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
    const { t } = useLanguage();

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
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('diet.logger.title')}</span>
                
                <div className="flex flex-wrap items-center gap-2">
                    {/* Log Filter Input */}
                    <div className="relative w-full sm:w-auto sm:flex-initial mb-2 sm:mb-0">
                        <Search size={14} className="absolute left-2.5 top-2.5 text-on-surface-variant dark:text-on-surface-variant" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t("diet.logger.filter")}
                            className="bg-surface-container border border-surface-variant rounded-full pl-8 pr-3 py-1 text-xs font-bold text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-card-white focus:border-white/10 shadow-sm w-full sm:w-40"
                        />
                    </div>

                    {onOpenRecipeModal && (
                        <button
                            onClick={onOpenRecipeModal}
                            className="flex items-center gap-1.5 bg-white/5 hover:bg-amber-100 text-amber-900 px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-white/10 shadow-sm btn-press"
                            title={t("diet.logger.savedRecipes")}
                        >
                            <ChefHat size={14} className="text-white" /> Saved Recipes
                        </button>
                    )}

                    {onExportSummaryText && (
                        <button
                            onClick={handleExportClick}
                            className="flex items-center gap-1.5 bg-white/5 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-white/10/80 shadow-sm btn-press"
                            title={t("diet.logger.exportSummary")}
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

            {/* Meal Categories Timeline */}
            <div className="relative border-l border-black/10 dark:border-white/10 ml-4 space-y-8 pb-4">
                {CATEGORIES.map(({ name, icon, color }) => {
                    const categoryMeals = filteredMeals.filter((m) => m.category === name);
                    const isCollapsed = collapsed[name];

                    const totalCategoryBites = categoryMeals.reduce((acc, curr) => acc + (curr.bites || Math.round(curr.calories / 50)), 0);
                    const totalCategoryCalories = categoryMeals.reduce((acc, curr) => acc + curr.calories, 0);

                    return (
                        <div key={name} className="relative pl-6 sm:pl-8">
                            {/* Timeline Node */}
                            <div className="absolute -left-3 top-0 w-6 h-6 bg-background rounded-full border border-black/10 dark:border-white/20 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-on-surface/50" />
                            </div>

                            <div className="bg-surface-container/30 backdrop-blur-3xl border border-black/5 dark:border-white/5 rounded-3xl p-5 sm:p-6 shadow-[0_20px_40px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.2)] transition-all overflow-hidden relative group/cat">
                                
                                {/* Section Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                    <div
                                        onClick={() => toggleCollapse(name)}
                                        className="flex items-center gap-4 cursor-pointer select-none group"
                                    >
                                        <div className={`p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm transition-transform group-hover:scale-105 ${color}`}>
                                            {icon}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-semibold text-on-surface tracking-tight">
                                                    {name}
                                                </h3>
                                                {isCollapsed ? <ChevronDown size={16} className="text-on-surface-variant opacity-50" /> : <ChevronUp size={16} className="text-on-surface-variant opacity-50" />}
                                            </div>
                                            <span className="text-xs font-medium text-on-surface-variant">
                                                {categoryMeals.length} item{categoryMeals.length === 1 ? '' : 's'} • <strong className="text-on-surface">{totalCategoryCalories} kcal</strong>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Section Subtotal & Add Button */}
                                    <div className="flex items-center gap-3">
                                        {totalCategoryBites > 0 && (
                                            <span className="text-xs font-bold text-primary tracking-widest uppercase">
                                                {totalCategoryBites} BITES
                                            </span>
                                        )}

                                        {name === 'Snacks' && onOpenAIMealModal && (
                                            <button
                                                onClick={onOpenAIMealModal}
                                                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
                                                title="AI Voice & Natural Language Meal Logger"
                                            >
                                                <Sparkles size={14} className="shrink-0" /> <span className="hidden sm:inline">AI Log</span>
                                            </button>
                                        )}

                                        <button
                                            id={name === 'Breakfast' ? 'tour-add-food' : undefined}
                                            onClick={() => onAddMealClick(name)}
                                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-on-surface transition-all active:scale-95 z-10"
                                            title={`Add item to ${name}`}
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Meal Items List */}
                                {!isCollapsed && (
                                    <div className="space-y-2 mt-6">
                                        {categoryMeals.length > 0 ? (
                                            categoryMeals.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => onEditMealClick(item)}
                                                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-surface-container-low/50 hover:bg-surface-container border border-white/5 transition-all cursor-pointer gap-4"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                                                            {item.icon || '🥗'}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-on-surface tracking-tight group-hover:text-primary transition-colors">
                                                                {item.name}
                                                            </h4>
                                                            <p className="text-xs font-medium text-on-surface-variant mt-1">
                                                                <strong className="text-on-surface tabular-nums">{item.bites ? `${item.bites} BITES` : `${item.calories} KCAL`}</strong> • {item.portion}
                                                                {item.protein ? ` • ${item.protein}g protein` : ''}
                                                                {item.fiber ? ` • ${item.fiber}g fiber` : ''}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Action buttons */}
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEditMealClick(item);
                                                            }}
                                                            className="p-2 rounded-xl hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-colors"
                                                            title="Modify nutrient contents"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm(`Remove ${item.name}?`)) {
                                                                    onDeleteMeal(item.id);
                                                                }
                                                            }}
                                                            className="p-2 rounded-xl hover:bg-red-500/20 text-on-surface-variant hover:text-red-400 transition-colors"
                                                            title="Remove meal item"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div
                                                onClick={() => onAddMealClick(name)}
                                                className="p-4 text-center rounded-2xl border border-dashed border-white/10 text-xs font-medium text-on-surface-variant hover:border-white/20 hover:text-on-surface transition-all cursor-pointer bg-white/5"
                                            >
                                                Tap to log {name.toLowerCase()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
