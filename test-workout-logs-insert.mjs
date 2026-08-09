import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data: data1, error: err1 } = await supabase.from('workout_logs').insert([{
        user_id: '5e1d3715-4f0c-4473-99e6-1a00220be6d9',
        date: '2026-08-08',
        session_type: 'Gym',
        custom_name: 'Test',
        duration_minutes: 30,
        calories_burned: 300,
        exercises: [],
        completed: true
    }]).select();
    console.log("workout_logs insert result:", err1 || data1);
}

checkSchema();
