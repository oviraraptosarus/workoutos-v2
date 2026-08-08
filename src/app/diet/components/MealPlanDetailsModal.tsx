'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Flame, ShoppingBag, Plus, Check } from 'lucide-react';
import { MealItem, MealCategory } from '../types';

interface MealPlanDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogMeal?: (meal: Omit<MealItem, 'id'>) => void;
}

interface RecipeItem {
    id: string;
    category: MealCategory;
    title: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    prepTime: string;
    icon: string;
    imageUrl: string;
    ingredients: string[];
    prepSteps: string[];
}

const FIVE_DAY_PLAN: Record<number, RecipeItem[]> = {
    1: [
        {
            id: 'd1-m1',
            category: 'Breakfast',
            title: 'Avocado & Poached Eggs on Toast',
            calories: 320,
            protein: 16,
            carbs: 26,
            fat: 18,
            prepTime: '10 mins',
            icon: '🥚',
            imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&auto=format&fit=crop&q=80',
            ingredients: ['2 sourdough slices', '1 ripe avocado', '2 free-range eggs', 'Pinch of red pepper flakes', 'Sea salt & black pepper'],
            prepSteps: ['Toast sourdough until golden', 'Mash avocado with lemon juice, salt, and pepper', 'Poach eggs for 3 mins in simmering water', 'Spread avocado, top with eggs & chili flakes'],
        },
        {
            id: 'd1-m2',
            category: 'Lunch',
            title: 'Quinoa & Edamame Power Bowl',
            calories: 440,
            protein: 26,
            carbs: 52,
            fat: 14,
            prepTime: '15 mins',
            icon: '🥗',
            imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
            ingredients: ['1 cup cooked quinoa', '1/2 cup shelled edamame', '1/2 cup cherry tomatoes', '1/4 cup shredded red cabbage', '2 tbsp sesame dressing'],
            prepSteps: ['Fluff cooked quinoa into a deep bowl', 'Arrange edamame, cherry tomatoes, and cabbage on top', 'Drizzle with sesame tahini dressing and toss'],
        },
        {
            id: 'd1-m3',
            category: 'Dinner',
            title: 'Garlic Broccoli & Tofu Curry',
            calories: 380,
            protein: 22,
            carbs: 34,
            fat: 16,
            prepTime: '20 mins',
            icon: '🥦',
            imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80',
            ingredients: ['1 head broccoli floret', '200g firm tofu cubes', '1 cup coconut milk curry sauce', '1/2 tsp turmeric & ginger', 'Jasmin rice for serving'],
            prepSteps: ['Sear tofu cubes in pan until crispy', 'Steam broccoli for 4 mins', 'Simmer curry sauce with turmeric & ginger, fold in tofu & broccoli'],
        },
        {
            id: 'd1-m4',
            category: 'Snacks',
            title: 'Dark Chocolate Protein Oat Bites',
            calories: 180,
            protein: 10,
            carbs: 22,
            fat: 6,
            prepTime: '5 mins',
            icon: '🍎',
            imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&auto=format&fit=crop&q=80',
            ingredients: ['1 cup rolled oats', '2 tbsp almond butter', '1 scoop chocolate whey', '1 tbsp chia seeds'],
            prepSteps: ['Mix ingredients in bowl', 'Roll into 1-inch balls and refrigerate for 20 mins'],
        },
    ],
    2: [
        {
            id: 'd2-m1',
            category: 'Breakfast',
            title: 'Greek Yogurt & Berry Granola Bowl',
            calories: 290,
            protein: 24,
            carbs: 32,
            fat: 6,
            prepTime: '5 mins',
            icon: '🥣',
            imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&auto=format&fit=crop&q=80',
            ingredients: ['1 cup plain Greek yogurt', '1/2 cup fresh blueberries & raspberries', '1/4 cup low-sugar granola', '1 tsp honey'],
            prepSteps: ['Spoon yogurt into bowl', 'Top with berries, granola, and drizzled honey'],
        },
        {
            id: 'd2-m2',
            category: 'Lunch',
            title: 'Mediterranean Chickpea & Salad Wrap',
            calories: 410,
            protein: 18,
            carbs: 56,
            fat: 12,
            prepTime: '10 mins',
            icon: '🥪',
            imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&auto=format&fit=crop&q=80',
            ingredients: ['1 whole wheat tortilla', '1/2 cup rinsed chickpeas', 'Cucumber & diced tomatoes', '2 tbsp hummus', 'Feta cheese crumble'],
            prepSteps: ['Spread hummus on tortilla', 'Layer chickpeas, veggies, and feta', 'Wrap tightly and cut in half'],
        },
        {
            id: 'd2-m3',
            category: 'Dinner',
            title: 'Grilled Salmon with Asparagus',
            calories: 460,
            protein: 36,
            carbs: 18,
            fat: 24,
            prepTime: '18 mins',
            icon: '🐟',
            imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&auto=format&fit=crop&q=80',
            ingredients: ['180g salmon fillet', '1 bunch fresh asparagus', '1 tbsp olive oil', 'Lemon slice & dill'],
            prepSteps: ['Season salmon fillet with lemon & herbs', 'Pan-sear salmon for 4 mins per side', 'Sauté asparagus in olive oil until tender'],
        },
        {
            id: 'd2-m4',
            category: 'Snacks',
            title: 'Apple Slices & Almond Butter',
            calories: 190,
            protein: 5,
            carbs: 24,
            fat: 10,
            prepTime: '3 mins',
            icon: '🍎',
            imageUrl: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&auto=format&fit=crop&q=80',
            ingredients: ['1 honeycrisp apple', '2 tbsp natural almond butter'],
            prepSteps: ['Slice apple into wedges', 'Serve alongside almond butter dip'],
        },
    ],
    3: [
        {
            id: 'd3-m1',
            category: 'Breakfast',
            title: 'Protein Banana Pancakes',
            calories: 350,
            protein: 28,
            carbs: 42,
            fat: 8,
            prepTime: '12 mins',
            icon: '🥞',
            imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&auto=format&fit=crop&q=80',
            ingredients: ['1 ripe banana', '2 eggs', '1 scoop vanilla protein powder', '1/4 cup oats'],
            prepSteps: ['Blend all ingredients into batter', 'Cook on medium heat pan for 2 mins per side'],
        },
        {
            id: 'd3-m2',
            category: 'Lunch',
            title: 'Grilled Chicken Caesar Salad',
            calories: 430,
            protein: 42,
            carbs: 14,
            fat: 22,
            prepTime: '12 mins',
            icon: '🥗',
            imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=80',
            ingredients: ['150g grilled chicken breast', '2 cups romaine lettuce', '2 tbsp light Caesar dressing', 'Parmesan shavings'],
            prepSteps: ['Chop lettuce and slice warm chicken breast', 'Toss with dressing and parmesan'],
        },
        {
            id: 'd3-m3',
            category: 'Dinner',
            title: 'Turkey Burger with Sweet Potato Fries',
            calories: 490,
            protein: 38,
            carbs: 48,
            fat: 16,
            prepTime: '25 mins',
            icon: '🍔',
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
            ingredients: ['150g lean turkey patty', '1 brioche bun', '1 sweet potato cut into fries', 'Lettuce & tomato'],
            prepSteps: ['Bake sweet potato fries at 200°C for 20 mins', 'Grill turkey patty for 5 mins per side', 'Assemble burger with veggies'],
        },
        {
            id: 'd3-m4',
            category: 'Snacks',
            title: 'Mixed Berries Smoothie',
            calories: 160,
            protein: 8,
            carbs: 30,
            fat: 2,
            prepTime: '3 mins',
            icon: '🥤',
            imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&auto=format&fit=crop&q=80',
            ingredients: ['1 cup frozen berries', '1 cup almond milk', '1/2 cup Greek yogurt'],
            prepSteps: ['Combine ingredients in blender', 'Blend until smooth and creamy'],
        },
    ],
    4: [
        {
            id: 'd4-m1',
            category: 'Breakfast',
            title: 'Spinach & Feta Omelette',
            calories: 310,
            protein: 22,
            carbs: 6,
            fat: 22,
            prepTime: '8 mins',
            icon: '🍳',
            imageUrl: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400&auto=format&fit=crop&q=80',
            ingredients: ['3 large eggs', '1 cup fresh baby spinach', '30g crumbled feta', '1 tsp olive oil'],
            prepSteps: ['Whisk eggs in a bowl', 'Sauté spinach until wilted, pour in eggs, fold with feta'],
        },
        {
            id: 'd4-m2',
            category: 'Lunch',
            title: 'Tuna & Avocado Buddha Bowl',
            calories: 420,
            protein: 34,
            carbs: 28,
            fat: 18,
            prepTime: '10 mins',
            icon: '🥣',
            imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80',
            ingredients: ['1 can albacore tuna', '1/2 sliced avocado', '1/2 cup brown rice', 'Cucumber & sesame seeds'],
            prepSteps: ['Fluff brown rice into bowl', 'Top with tuna, avocado, cucumber, and sesame seeds'],
        },
        {
            id: 'd4-m3',
            category: 'Dinner',
            title: 'Lean Beef Stir-Fry with Noodles',
            calories: 520,
            protein: 40,
            carbs: 54,
            fat: 16,
            prepTime: '20 mins',
            icon: '🥩',
            imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&auto=format&fit=crop&q=80',
            ingredients: ['150g beef sirloin strips', '1 cup ramen or udon noodles', 'Snap peas & bell peppers', 'Low sodium soy sauce'],
            prepSteps: ['Stir-fry beef strips in wok for 3 mins', 'Add veggies and noodles, toss with soy sauce'],
        },
        {
            id: 'd4-m4',
            category: 'Snacks',
            title: 'Cottage Cheese & Pineapple',
            calories: 170,
            protein: 18,
            carbs: 18,
            fat: 3,
            prepTime: '2 mins',
            icon: '🍍',
            imageUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&auto=format&fit=crop&q=80',
            ingredients: ['3/4 cup low fat cottage cheese', '1/2 cup fresh pineapple chunks'],
            prepSteps: ['Combine cottage cheese and pineapple in bowl'],
        },
    ],
    5: [
        {
            id: 'd5-m1',
            category: 'Breakfast',
            title: 'Overnight Chia Seed Pudding',
            calories: 270,
            protein: 10,
            carbs: 34,
            fat: 11,
            prepTime: 'Overnight',
            icon: '🍧',
            imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&auto=format&fit=crop&q=80',
            ingredients: ['3 tbsp chia seeds', '1 cup almond milk', '1/2 tsp vanilla extract', 'Fresh mango slices'],
            prepSteps: ['Stir chia seeds into almond milk & vanilla', 'Refrigerate overnight, top with mango'],
        },
        {
            id: 'd5-m2',
            category: 'Lunch',
            title: 'Roasted Veggie & Hummus Bowl',
            calories: 390,
            protein: 14,
            carbs: 52,
            fat: 15,
            prepTime: '15 mins',
            icon: '🥗',
            imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=80',
            ingredients: ['1 cup roasted zucchini & peppers', '1/2 cup farro or quinoa', '3 tbsp garlic hummus'],
            prepSteps: ['Combine grain and warm roasted veggies', 'Top with garlic hummus dollop'],
        },
        {
            id: 'd5-m3',
            category: 'Dinner',
            title: 'Baked Lemon Herb Chicken Breast',
            calories: 410,
            protein: 44,
            carbs: 22,
            fat: 14,
            prepTime: '25 mins',
            icon: '🍗',
            imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&auto=format&fit=crop&q=80',
            ingredients: ['180g chicken breast', '1/2 cup roasted baby potatoes', '1 tbsp rosemary & lemon juice'],
            prepSteps: ['Marinate chicken in lemon juice & rosemary', 'Bake at 190°C for 22 mins alongside baby potatoes'],
        },
        {
            id: 'd5-m4',
            category: 'Snacks',
            title: 'Handful of Mixed Almonds & Walnuts',
            calories: 200,
            protein: 6,
            carbs: 6,
            fat: 18,
            prepTime: '1 min',
            icon: '🥜',
            imageUrl: 'https://images.unsplash.com/photo-1509358271058-acd02cc93858?w=400&auto=format&fit=crop&q=80',
            ingredients: ['15 raw almonds', '5 walnut halves'],
            prepSteps: ['Enjoy raw or dry roasted'],
        },
    ],
};

export default function MealPlanDetailsModal({
    isOpen,
    onClose,
    onLogMeal,
}: MealPlanDetailsModalProps) {
    const { t } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number>(1);
    const [loggedRecipeIds, setLoggedRecipeIds] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const recipes = FIVE_DAY_PLAN[selectedDay] || FIVE_DAY_PLAN[1];

    const handleQuickLog = (recipe: RecipeItem) => {
        if (onLogMeal) {
            onLogMeal({
                category: recipe.category,
                name: recipe.title,
                portion: '1 serving',
                calories: recipe.calories,
                protein: recipe.protein,
                carbs: recipe.carbs,
                fat: 1,
                sugar: 4,
                fiber: 0,
                bites: Math.round(recipe.calories / 50),
                icon: recipe.icon,
            });
            setLoggedRecipeIds((prev) => ({ ...prev, [recipe.id]: true }));
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-card-white/95 backdrop-blur-md rounded-2xl w-full max-w-2xl shadow-[0_25px_70px_0_rgba(0,0,0,0.3)] border border-surface-variant overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-surface-variant bg-surface-container dark:bg-surface-container-high">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-2xl bg-white/10 text-white flex items-center justify-center font-bold">
                            <ShoppingBag size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-on-surface drop-shadow-sm">
                                5-Day Getting Started Plan
                            </h2>
                            <p className="text-xs font-bold text-on-surface-variant dark:text-on-surface-variant dark:text-on-surface-variant">
                                Complete nutrition breakdown, ingredients & prep guides
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface-variant transition-colors btn-press"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Day Navigation Tabs */}
                <div className="px-6 py-3 bg-surface-container-low/80 border-b border-stone-200/60 flex items-center justify-between overflow-x-auto gap-2">
                    {[1, 2, 3, 4, 5].map((dayNum) => (
                        <button
                            key={dayNum}
                            onClick={() => setSelectedDay(dayNum)}
                            className={`flex-1 py-2 px-4 rounded-2xl text-xs font-bold transition-all border ${
                                selectedDay === dayNum
                                    ? 'bg-white text-black border-white/20 shadow-md scale-[1.02]'
                                    : 'bg-card-white text-on-surface-variant border-surface-variant hover:bg-surface-container'
                            }`}
                        >
                            Day {dayNum}
                        </button>
                    ))}
                </div>

                {/* Recipes List Body */}
                <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {recipes.map((recipe) => {
                        const isLogged = loggedRecipeIds[recipe.id];

                        return (
                            <div
                                key={recipe.id}
                                className="bg-card-white border border-surface-variant border-surface-variant rounded-2xl p-5 shadow-sm hover:shadow-md transition-all bg-card-white/70 relative overflow-hidden"
                            >
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Image Thumbnail */}
                                    <div className="relative w-full sm:w-36 h-36 rounded-2xl overflow-hidden border border-surface-variant shadow-sm flex-shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={recipe.imageUrl}
                                            alt={recipe.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 left-2 bg-card-white/90 backdrop-blur-sm px-2 py-1 rounded-xl text-xs font-bold text-on-surface shadow-sm flex items-center gap-1">
                                            <span>{recipe.icon}</span>
                                            <span>{recipe.category}</span>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-base font-bold text-on-surface drop-shadow-sm">
                                                    {recipe.title}
                                                </h3>
                                                {onLogMeal && (
                                                    <button
                                                        onClick={() => handleQuickLog(recipe)}
                                                        disabled={isLogged}
                                                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all border btn-press ${
                                                            isLogged
                                                                ? 'bg-emerald-100 text-emerald-800 border-white/10'
                                                                : 'bg-white hover:bg-zinc-200 text-black border-white/20 shadow-sm'
                                                        }`}
                                                    >
                                                        {isLogged ? (
                                                            <>
                                                                <Check size={14} /> Logged
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus size={14} /> Log to Today
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Macro Badges */}
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <span className="bg-surface-container text-stone-800 text-[11px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                                                    <Flame size={12} className="text-white" /> {recipe.calories} kcal
                                                </span>
                                                <span className="bg-white/5 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                                                    P: {recipe.protein}g
                                                </span>
                                                <span className="bg-white/5 text-orange-700 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                                                    C: {recipe.carbs}g
                                                </span>
                                                <span className="bg-white/5 text-rose-700 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                                                    F: {recipe.fat}g
                                                </span>
                                                <span className="text-[11px] text-on-surface-variant font-bold flex items-center gap-1 ml-auto">
                                                    <Clock size={12} /> {recipe.prepTime}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Ingredients & Instructions preview */}
                                        <div className="mt-3 pt-3 border-t border-surface-variant grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <h4 className="font-bold text-on-surface-variant uppercase tracking-wider text-[10px] mb-1">Ingredients</h4>
                                                <ul className="list-disc list-inside text-on-surface-variant space-y-0.5 font-medium">
                                                    {recipe.ingredients.slice(0, 3).map((ing, i) => (
                                                        <li key={i}>{ing}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-on-surface-variant uppercase tracking-wider text-[10px] mb-1">Prep Steps</h4>
                                                <ol className="list-decimal list-inside text-on-surface-variant space-y-0.5 font-medium">
                                                    {recipe.prepSteps.slice(0, 2).map((step, i) => (
                                                        <li key={i}>{step}</li>
                                                    ))}
                                                </ol>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
