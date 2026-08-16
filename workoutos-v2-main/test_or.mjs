import fs from 'fs';
import path from 'path';

// Read .env manually
const envPath = path.join(process.cwd(), '.env');
const envText = fs.readFileSync(envPath, 'utf8');
const envKeys = {};
envText.split('\n').forEach(line => {
    const [k, ...rest] = line.split('=');
    if(k && rest) envKeys[k.trim()] = rest.join('=').trim();
});

const OPENROUTER_API_KEY = envKeys['OPENROUTER_API_KEY'];
console.log('Testing OpenRouter key:', OPENROUTER_API_KEY.slice(0, 15) + '...');

async function test() {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.3-70b-instruct',
                messages: [{role: 'user', content: 'hello'}]
            })
        });
        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text);
    } catch(e) {
        console.error('Error:', e);
    }
}
test();
