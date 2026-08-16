import { supabase } from '@/lib/supabase/client';

export interface AIMemory {
    id: string;
    user_id: string;
    category: string;
    memory_text: string;
    confidence_score: number;
    created_at: string;
    updated_at: string;
}

export async function getAIMemories(): Promise<AIMemory[]> {
    const { data, error } = await supabase
        .from('ai_memories')
        .select('*')
        .order('category', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching AI memories:', error);
        return [];
    }

    return data as AIMemory[];
}

export async function addAIMemory(category: string, memory_text: string, confidence_score: number = 1.0): Promise<AIMemory | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return null;

    const { data, error } = await supabase
        .from('ai_memories')
        .insert({
            user_id: userData.user.id,
            category,
            memory_text,
            confidence_score
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding AI memory:', error);
        return null;
    }

    return data as AIMemory;
}

export async function updateAIMemory(id: string, memory_text: string, confidence_score: number = 1.0): Promise<boolean> {
    const { error } = await supabase
        .from('ai_memories')
        .update({
            memory_text,
            confidence_score,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating AI memory:', error);
        return false;
    }

    return true;
}

export async function deleteAIMemory(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('ai_memories')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting AI memory:', error);
        return false;
    }

    return true;
}
