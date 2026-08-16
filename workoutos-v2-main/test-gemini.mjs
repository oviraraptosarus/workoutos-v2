import fs from 'fs';
import https from 'https';

const env = fs.readFileSync('.env', 'utf-8');
const keyLine = env.split('\n').find(l => l.startsWith('GEMINI_API_KEY='));
if (!keyLine) { console.error('No GEMINI_API_KEY found'); process.exit(1); }
const key = keyLine.split('=')[1].trim();

const reqBody = {
    contents: [
        { role: 'user', parts: [{ text: 'give me a workout plan for today' }] }
    ],
    tools: [
        {
            functionDeclarations: [
                {
                    name: "add_task",
                    description: "Add a task",
                    parameters: { type: "OBJECT", properties: { title: { type: "STRING" } }, required: ["title"] }
                }
            ]
        }
    ],
    generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
    }
};

const reqData = JSON.stringify(reqBody);

const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}, res => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', data));
});

req.on('error', console.error);
req.write(reqData);
req.end();
