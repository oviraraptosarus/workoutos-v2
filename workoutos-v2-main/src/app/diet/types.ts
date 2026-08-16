export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export interface MealItem {
    id: string;
    category: MealCategory;
    name: string;
    portion: string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    sugar: number;
    fiber: number;
    bites?: number;
    icon?: string;
    ingredients?: MealIngredient[];
}

export interface MealIngredient {
    name: string;
    quantity?: string;
    calories: number;
}

export interface MacroGoals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    fiber: number;
}
