import { supabase } from '@/lib/supabaseClient';

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

export const getIncome = async (): Promise<IncomeItem[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    // Fallback if we don't have an income table, use expenses with a specific category for now
    // Actually, in CLAUDE.md schema, there is NO income table, just 'expenses'.
    // We can assume income is just saved in expenses with amount as negative or a specific category.
    // But since the previous schema used a local array for income, let's keep it local for now, or just return empty.
    // Wait, let's just use localStorage for income since it's not in the Supabase schema provided!
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

export const getExpenses = async (): Promise<ExpenseItem[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase.from('expenses').select('*').eq('user_id', user.id);
    return data?.map(d => ({
        id: d.id,
        date: d.date,
        description: d.description,
        category: d.category,
        amount: Number(d.amount),
        protein: d.protein_g ? Number(d.protein_g) : null,
        costPerG: d.protein_g ? (Number(d.amount) / Number(d.protein_g)) : null,
        type: 'necessity'
    })) || [];
};

export const saveExpenses = async (items: ExpenseItem[]): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Supabase replace all expenses strategy
    await supabase.from('expenses').delete().eq('user_id', user.id);
    if (items.length > 0) {
        const payload = items.map(m => ({
            id: m.id.length > 20 ? m.id : undefined,
            user_id: user.id,
            date: m.date,
            description: m.description,
            category: m.category,
            amount: m.amount,
            protein_g: m.protein
        }));
        await supabase.from('expenses').insert(payload);
    }

    if (typeof window !== 'undefined') {
        const totalSpent = items.reduce((sum, item) => sum + item.amount, 0);
        localStorage.setItem('workout_os_budget_spent', totalSpent.toString());
        window.dispatchEvent(new Event('workout_os_budget_updated'));
    }
};
