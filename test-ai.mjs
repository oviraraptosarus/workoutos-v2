import fs from 'fs';

async function run() {
    const res = await fetch('http://localhost:4028/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: `I have a macro goal: "DEADLIFT" (Category: Fitness). Give me EXACTLY 3 extremely specific, immediate micro-tasks I can do TODAY to move towards this goal. Break the inertia. CRITICAL: ONLY output a valid JSON array of strings representing the 3 micro-tasks. No markdown formatting, no code blocks, JUST the raw JSON array. DO NOT call any tools.`,
            history: []
        })
    });
    const data = await res.json();
    console.log("RESPONSE:", data);
}
run();
