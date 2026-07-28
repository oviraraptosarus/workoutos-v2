export interface IncomeItem {
    id: string;
    date: string;
    description: string;
    source: string;
    amount: number;
    type: string;
}

export interface ExpenseItem {
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    protein: number | null;
    costPerG: number | null;
    type: string;
}

const INCOME_KEY = 'workout_os_budget_income';
const EXPENSES_KEY = 'workout_os_budget_expenses';

export const getIncome = (): IncomeItem[] => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(INCOME_KEY);
        if (saved) return JSON.parse(saved);
    }
    return [];
};

export const saveIncome = (items: IncomeItem[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(INCOME_KEY, JSON.stringify(items));
        window.dispatchEvent(new Event('workout_os_budget_updated'));
    }
};

export const getExpenses = (): ExpenseItem[] => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(EXPENSES_KEY);
        if (saved) return JSON.parse(saved);
    }
    return [];
};

export const saveExpenses = (items: ExpenseItem[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(EXPENSES_KEY, JSON.stringify(items));
        // Also update total spent for dashboard widget
        const totalSpent = items.reduce((sum, item) => sum + item.amount, 0);
        localStorage.setItem('workout_os_budget_spent', totalSpent.toString());
        window.dispatchEvent(new Event('workout_os_budget_updated'));
    }
};
