async function testOptions() {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tasks`;
    console.log("Fetching OPTIONS:", url);
    const res = await fetch(url, {
        method: 'OPTIONS',
        headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
    });
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    console.log("Body:", await res.text());
}

testOptions();
