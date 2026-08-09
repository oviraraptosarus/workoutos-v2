import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data: data1, error: err1 } = await supabase.from('workout_logs').select('*').limit(1);
    console.log("workout_logs row 1 keys:", data1 && data1.length > 0 ? Object.keys(data1[0]) : (err1 || "No data"));
}

checkSchema();
