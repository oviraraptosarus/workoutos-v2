import fs from 'fs';
import https from 'https';

const env = fs.readFileSync('.env', 'utf-8');
const key = env.split('\n').find(l => l.startsWith('GEMINI_API_KEY=')).split('=')[1].trim();

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(JSON.parse(data).models.map(m => m.name)));
});
