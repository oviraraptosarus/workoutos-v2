import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data: data1, error: err1 } = await supabase.from('tasks').select('*').limit(1);
    console.log("Tasks row 1 keys:", data1 && data1.length > 0 ? Object.keys(data1[0]) : (err1 || "No data"));
    const { data: data2, error: err2 } = await supabase.from('tasks').select('priority').limit(1);
    console.log("Tasks priority query:", err2 || data2);
}

checkSchema();
