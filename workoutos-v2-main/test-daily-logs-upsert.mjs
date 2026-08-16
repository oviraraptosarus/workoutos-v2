import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data: data1, error: err1 } = await supabase.from('daily_logs').upsert({
        user_id: '5e1d3715-4f0c-4473-99e6-1a00220be6d9',
        date: '2026-08-08',
        activity_burned: 300
    }, { onConflict: 'user_id,date' }).select();
    console.log("daily_logs upsert result:", err1 || data1);
}

checkSchema();
