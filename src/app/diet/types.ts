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
    bites?: number;
    icon?: string;
}

export interface MacroGoals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
}
