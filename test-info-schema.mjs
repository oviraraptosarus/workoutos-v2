import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInformationSchema() {
    console.log("Testing information_schema access...");
    const { data, error } = await supabase.from('information_schema.columns').select('*').limit(5);
    console.log("Result:", error || data);
}

testInformationSchema();
