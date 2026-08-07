import { supabase } from '@/lib/supabase/client';

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

export const getIncome = async (month?: string): Promise<IncomeItem[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    let query = supabase.from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('transaction_type', 'income')
        .order('created_at', { ascending: false });

    if (month) {
        query = query.gte('date', `${month}-01`).lte('date', `${month}-31`);
    }

    const { data } = await query;
        
    return data?.map(d => ({
        id: d.id,
        date: d.date,
        description: d.description,
        source: d.category,
        amount: Number(d.amount),
        type: 'one-off'
    })) || [];
};

export const getExpenses = async (month?: string): Promise<ExpenseItem[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase.from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('transaction_type', 'expense')
        .order('created_at', { ascending: false });

    if (month) {
        query = query.gte('date', `${month}-01`).lte('date', `${month}-31`);
    }

    const { data } = await query;
        
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

export const addTransaction = async (
    item: Omit<IncomeItem, 'id'> | Omit<ExpenseItem, 'id'>, 
    type: 'income' | 'expense'
): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Normalize the date to YYYY-MM-DD in LOCAL time. Callers historically passed
    // yearless strings like "Jul 31", which `new Date()` interprets as year 2001;
    // guard against that by falling back to today whenever the parsed year looks wrong.
    const toLocalKey = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const today = new Date();
    let dateStr = toLocalKey(today);
    if (item.date) {
        // Already ISO (YYYY-MM-DD)? Trust it.
        if (/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
            dateStr = item.date;
        } else {
            const parsed = new Date(item.date);
            // Reject NaN and the classic yearless-string → 2001 fallback.
            if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2015) {
                dateStr = toLocalKey(parsed);
            }
        }
    }

    const payload = {
        user_id: user.id,
        date: dateStr,
        description: item.description,
        category: type === 'income' ? (item as Omit<IncomeItem, 'id'>).source : (item as Omit<ExpenseItem, 'id'>).category,
        amount: item.amount,
        protein_g: type === 'expense' ? ((item as Omit<ExpenseItem, 'id'>).protein || null) : null,
        transaction_type: type
    };

    await supabase.from('expenses').insert(payload);

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workout_os_budget_updated'));
    }
};

export const deleteTransaction = async (id: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('expenses').delete().eq('id', id).eq('user_id', user.id);

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workout_os_budget_updated'));
    }
};
