'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, BookOpen, Check, ChefHat, Sparkles } from 'lucide-react';
import { MealItem, MealCategory } from '../types';

interface RecipeGroupBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogRecipe: (meals: Omit<MealItem, 'id'>[]) => void;
}

interface SavedRecipe {
    id: string;
    title: string;
    category: MealCategory;
    icon: string;
    items: {
        name: string;
        portion: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        sugar: number;
        fiber: number;
    }[];
}

const DEFAULT_RECIPES: SavedRecipe[] = [
    {
        id: 'rec-1',
        title: 'Post-Workout Anabolic Shake',
        category: 'Snacks',
        icon: '🥤',
        items: [
            { name: 'Vanilla Whey Protein', portion: '1 scoop', calories: 120, protein: 25, carbs: 2, fat: 1, sugar: 1, fiber: 0 },
            { name: 'Almond Milk', portion: '1 cup', calories: 40, protein: 1, carbs: 1, fat: 3, sugar: 0, fiber: 0 },
            { name: 'Peanut Butter', portion: '1 tbsp', calories: 95, protein: 4, carbs: 3, fat: 8, sugar: 1, fiber: 1 },
            { name: 'Banana', portion: '1 medium', calories: 105, protein: 1, carbs: 27, fat: 0, sugar: 14, fiber: 3 },
        ],
    },
    {
        id: 'rec-2',
        title: 'High-Protein Breakfast Combo',
        category: 'Breakfast',
        icon: '🥚',
        items: [
            { name: 'Scrambled Eggs', portion: '3 eggs', calories: 210, protein: 18, carbs: 1, fat: 15, sugar: 0, fiber: 0 },
            { name: 'Sourdough Toast', portion: '2 slices', calories: 220, protein: 8, carbs: 42, fat: 2, sugar: 4, fiber: 2 },
            { name: 'Black Coffee', portion: '1 mug', calories: 5, protein: 0, carbs: 1, fat: 0, sugar: 0, fiber: 0 },
        ],
    },
];

const RECIPES_STORAGE_KEY = 'workout_os_saved_recipes_v1';

export default function RecipeGroupBuilderModal({
    isOpen,
    onClose,
    onLogRecipe,
}: RecipeGroupBuilderModalProps) {
    const [recipes, setRecipes] = useState<SavedRecipe[]>(DEFAULT_RECIPES);
    const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    // New Recipe Form State
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState<MealCategory>('Breakfast');
    const [newIcon, setNewIcon] = useState('🥗');
    const [recipeItems, setRecipeItems] = useState<SavedRecipe['items']>([
        { name: '', portion: '1 serving', calories: 150, protein: 10, carbs: 15, fat: 5, sugar: 2, fiber: 0 },
    ]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(RECIPES_STORAGE_KEY);
            if (saved) {
                setRecipes(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load saved recipes', e);
        }
    }, []);

    if (!isOpen) return null;

    const saveRecipesToStorage = (updated: SavedRecipe[]) => {
        setRecipes(updated);
        try {
            localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save recipes', e);
        }
    };

    const handleLogSingleRecipe = (recipe: SavedRecipe) => {
        onLogRecipe(
            recipe.items.map((item) => ({
                category: recipe.category,
                name: item.name,
                portion: item.portion,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                sugar: item.sugar,
                fiber: 0,
                bites: Math.round(item.calories / 50),
                icon: recipe.icon,
            }))
        );
        onClose();
    };

    const handleSaveNewRecipe = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || recipeItems.length === 0) return;

        const created: SavedRecipe = {
            id: Date.now().toString(),
            title: newTitle.trim(),
            category: newCategory,
            icon: newIcon,
            items: recipeItems.filter((i) => i.name.trim() !== ''),
        };

        saveRecipesToStorage([...recipes, created]);
        setIsCreatingNew(false);
        setNewTitle('');
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card-white/95 backdrop-blur-md rounded-2xl w-full max-w-xl shadow-[0_20px_60px_0_rgba(0,0,0,0.25)] border border-surface-variant overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-surface-variant bg-surface-container-low">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-2xl bg-white/10 text-white flex items-center justify-center font-bold text-sm">
                            <ChefHat size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-on-surface drop-shadow-sm">
                                Saved Recipe & Meal Combos
                            </h2>
                            <p className="text-[11px] font-bold text-on-surface-variant dark:text-on-surface-variant dark:text-on-surface-variant">
                                Log multi-ingredient meals in 1 click
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

                {/* Content Area */}
                <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                    
                    {!isCreatingNew ? (
                        <>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                    Your Saved Recipes ({recipes.length})
                                </span>
                                <button
                                    onClick={() => setIsCreatingNew(true)}
                                    className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-white/5 hover:bg-emerald-100 px-3 py-1.5 rounded-full border border-white/10 shadow-sm transition-all btn-press"
                                >
                                    <Plus size={14} /> Create Recipe
                                </button>
                            </div>

                            <div className="space-y-3">
                                {recipes.map((recipe) => {
                                    const totalCal = recipe.items.reduce((a, b) => a + b.calories, 0);
                                    const totalP = recipe.items.reduce((a, b) => a + b.protein, 0);

                                    return (
                                        <div
                                            key={recipe.id}
                                            className="p-4 rounded-2xl bg-surface-container-low border border-stone-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{recipe.icon}</span>
                                                <div>
                                                    <h3 className="text-sm font-bold text-on-surface drop-shadow-sm">
                                                        {recipe.title}
                                                    </h3>
                                                    <p className="text-[11px] font-bold text-on-surface-variant dark:text-on-surface-variant">
                                                        {recipe.items.length} ingredients • {totalCal} kcal ({totalP}g Protein)
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleLogSingleRecipe(recipe)}
                                                    className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-all btn-press flex items-center gap-1"
                                                >
                                                    <Check size={14} /> Log Recipe
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const updated = recipes.filter((r) => r.id !== recipe.id);
                                                        saveRecipesToStorage(updated);
                                                    }}
                                                    className="p-2 text-on-surface-variant hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                                                    title="Delete recipe"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        /* New Recipe Form */
                        <form onSubmit={handleSaveNewRecipe} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                                    Recipe Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="e.g. My Morning Protein Smoothie"
                                    className="w-full bg-surface-container-low border border-stone-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-on-surface dark:text-white"
                                />
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingNew(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container dark:bg-surface-container-high"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="bg-white hover:bg-zinc-200 text-black font-bold px-5 py-2 rounded-xl text-xs shadow-md"
                                >
                                    Save Recipe
                                </button>
                            </div>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
}
