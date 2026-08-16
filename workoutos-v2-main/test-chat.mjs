import fetch from 'node-fetch';

(async () => {
  try {
    const res = await fetch('http://localhost:4028/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'remind me to wash my face in 5 minutes', sessionId: 'test', history: [] })
    });
    const text = await res.text();
    console.log('STATUS:', res.status);
    console.log('BODY:', text);
  } catch (e) {
    console.error(e);
  }
})();
