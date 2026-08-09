import { supabase } from '@/lib/supabase/client';


export class WorkoutLogger {
    /**
     * Unified workout logging for both human UI and AI tools.
     * Maps the incoming payload precisely to the actual database schema.
     */
    static async logWorkout(params: {
        userId: string,
        date: string,
        sessionType: string,
        customName?: string | null,
        durationMinutes: number,
        caloriesBurned: number,
        intensity?: string,
        exercises: any[],
        isOutdoor?: boolean
    }) {
        // Fallback implementation: Because the schema might still be missing columns 
        // (if the user hasn't run the migration yet), we ensure we map the fields to exercises JSONB 
        // as a safe fallback, just like Ava did, while also providing the top-level columns.
        
        // Enhance the first exercise metadata or prepend a metadata block
        const safeExercises = [...params.exercises];
        const metadataBlock = {
            type: 'metadata',
            custom_name: params.customName || null,
            duration: `${params.durationMinutes} min`,
            volume: `${params.caloriesBurned} kcal burned`,
            duration_minutes: params.durationMinutes,
            calories_burned: params.caloriesBurned,
            intensity: params.intensity || 'Moderate',
            notes: 'Logged via Unified WorkoutLogger'
        };

        if (safeExercises.length > 0 && safeExercises[0].type === 'metadata') {
            safeExercises[0] = { ...metadataBlock, ...safeExercises[0] };
        } else {
            safeExercises.unshift(metadataBlock);
        }

        const payload = {
            user_id: params.userId,
            date: params.date,
            session_type: params.sessionType,
            is_outdoor: params.isOutdoor || false,
            completed: true,
            exercises: safeExercises,
            
            // These will fail if the migration hasn't been run yet, but the user is about to run it.
            // If it fails, we throw so the UI can catch it!
            duration_minutes: params.durationMinutes,
            calories_burned: params.caloriesBurned,
            custom_name: params.customName || null,
            intensity: params.intensity || 'Moderate'
        };

        const { data, error } = await supabase.from('workout_logs').insert(payload).select();
        
        if (error) {
            console.error("WorkoutLogger Failed:", error);
            throw new Error(`Failed to log workout: ${error.message}`);
        }

        // Update daily_logs activity_burned
        const { data: currentLog } = await supabase
            .from('daily_logs')
            .select('activity_burned')
            .eq('user_id', params.userId)
            .eq('date', params.date)
            .maybeSingle();
        
        const currentBurned = currentLog?.activity_burned || 0;

        const { error: dailyErr } = await supabase
            .from('daily_logs')
            .upsert({
                user_id: params.userId,
                date: params.date,
                activity_burned: currentBurned + params.caloriesBurned
            }, { onConflict: 'user_id,date' });

        if (dailyErr) {
            console.error("WorkoutLogger Daily Log Update Failed:", dailyErr);
            throw new Error(`Failed to update daily burn: ${dailyErr.message}`);
        }

        return data;
    }
}
