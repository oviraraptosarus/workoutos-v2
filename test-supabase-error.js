const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ixqrijxdedtbxondzytn.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key'
);

async function run() {
  const payload = { id: '00000000-0000-0000-0000-000000000000', non_existent_column: 123 };
  const res = await supabase.from('profiles').upsert(payload).select().single();
  console.log("Error object:", res.error);
  console.log("Stringified:", JSON.stringify(res.error));
  console.log("Keys:", Object.keys(res.error || {}));
}

run();
