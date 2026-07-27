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

export const getIncome = (): IncomeItem[] => {
    return [];
};

export const saveIncome = (items: IncomeItem[]) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workout_os_budget_updated'));
    }
};

export const getExpenses = (): ExpenseItem[] => {
    return [];
};

export const saveExpenses = (items: ExpenseItem[]) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workout_os_budget_updated'));
    }
};
