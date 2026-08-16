async function getOpenAPI() {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
    console.log("Fetching:", url);
    const res = await fetch(url);
    if (!res.ok) {
        console.error("Failed to fetch OpenAPI spec:", res.status, await res.text());
        return;
    }
    const json = await res.json();
    
    // Process the OpenAPI definitions to extract table schemas
    const tables = {};
    for (const [key, value] of Object.entries(json.definitions || {})) {
        if (!key.endsWith('_patch') && !key.endsWith('_response') && !key.endsWith('_insert')) {
            const columns = Object.keys(value.properties || {});
            tables[key] = columns;
        }
    }
    console.log(JSON.stringify(tables, null, 2));
}

getOpenAPI();
