import fs from 'fs';
import path from 'path';
import https from 'https';

const env = fs.readFileSync('.env', 'utf-8');
const key = env.split('\n').find(l => l.startsWith('OPENROUTER_API_KEY=')).split('=')[1].trim();

const reqBody = {
  model: 'meta-llama/llama-3.3-70b-instruct:free',
  messages: [{ role: 'user', content: 'give me a workout plan for today' }],
  tools: [{
    type: 'function',
    function: {
      name: 'log_workout',
      description: 'Log a workout',
      parameters: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name']
      }
    }
  }]
};

const req = https.request('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`
  }
}, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('STATUS', res.statusCode, 'BODY', data));
});

req.on('error', console.error);
req.write(JSON.stringify(reqBody));
req.end();
