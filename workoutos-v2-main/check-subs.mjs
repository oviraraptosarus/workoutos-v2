import fs from 'fs';

const envLines = fs.readFileSync('.env.local', 'utf8').split('\n');
const env = {};
for (const line of envLines) {
    if (line.includes('=')) {
        const [k, ...v] = line.split('=');
        env[k.trim()] = v.join('=').trim();
    }
}

const url = env['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/push_subscriptions?select=*';
const key = env['SUPABASE_SERVICE_ROLE_KEY'];

fetch(url, {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2)));
