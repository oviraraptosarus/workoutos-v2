// Service layer for workout_templates CRUD - single source of truth

import { supabase } from '@/lib/supabase/client';

export interface WorkoutExercise {
    name: string;
    sets: string;         // e.g. "3 sets x 10 reps" or "3 sets x 45s"
    notes?: string;
    youtubeUrl?: string;
    order: number;
}

export interface WorkoutTemplate {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    exercises: WorkoutExercise[];
    created_at: string;
    updated_at: string;
}

export type WorkoutTemplateInsert = {
    name: string;
    description?: string;
    exercises: WorkoutExercise[];
};

export const WorkoutTemplateService = {
    async getAll(userId: string): Promise<WorkoutTemplate[]> {
        const { data, error } = await supabase
            .from('workout_templates')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw new Error(`Failed to load workout templates: ${error.message}`);
        return (data || []) as WorkoutTemplate[];
    },

    async create(userId: string, template: WorkoutTemplateInsert): Promise<WorkoutTemplate> {
        const { data, error } = await supabase
            .from('workout_templates')
            .insert({ user_id: userId, ...template })
            .select()
            .single();
        if (error) throw new Error(`Failed to create workout template: ${error.message}`);
        return data as WorkoutTemplate;
    },

    async update(id: string, updates: Partial<WorkoutTemplateInsert>): Promise<WorkoutTemplate> {
        const { data, error } = await supabase
            .from('workout_templates')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw new Error(`Failed to update workout template: ${error.message}`);
        return data as WorkoutTemplate;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('workout_templates')
            .delete()
            .eq('id', id);
        if (error) throw new Error(`Failed to delete workout template: ${error.message}`);
    },

    async duplicate(template: WorkoutTemplate, userId: string): Promise<WorkoutTemplate> {
        return WorkoutTemplateService.create(userId, {
            name: `${template.name} Copy`,
            description: template.description,
            exercises: template.exercises,
        });
    },

    /** Convert a WorkoutTemplate into the preset format expected by ActiveSplitCard */
    toPreset(template: WorkoutTemplate) {
        const sortedExercises = [...template.exercises].sort((a, b) => a.order - b.order);
        const estimatedMin = Math.max(20, sortedExercises.length * 7);
        return {
            id: template.id,
            title: template.name,
            subtitle: template.description || `${sortedExercises.length} exercises`,
            iconType: 'dumbbell',
            duration: `~${estimatedMin} min`,
            intensity: 'Custom',
            color: 'bg-primary/10 text-primary',
            exercises: sortedExercises.map(ex => ({
                name: ex.name,
                sets: ex.sets,
                youtubeUrl: ex.youtubeUrl || '',
                completed: false,
            })),
        };
    },
};
