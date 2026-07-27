import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Testing Supabase connection...");
  
  // Try to select from the profiles table to verify the schema was run
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  
  if (error) {
    console.error("❌ Connection failed or schema not created!");
    console.error("Error details:", error.message);
  } else {
    console.log("✅ Connection successful!");
    console.log("✅ Database schema (profiles table) found!");
    console.log("Data:", data);
  }
}

testConnection();
