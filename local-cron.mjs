import fetch from 'node-fetch';

const INTERVAL = 60000; // 1 minute

console.log('Starting local cron runner for Workout OS...');
console.log(`Polling /api/cron/process-reminders every ${INTERVAL / 1000} seconds.`);

setInterval(async () => {
    try {
        console.log(`[${new Date().toISOString()}] Triggering cron...`);
        const res = await fetch('http://localhost:4028/api/cron/process-reminders');
        const data = await res.json();
        
        if (res.ok) {
            console.log(`Cron success: Processed ${data.processed} tasks.`);
        } else {
            console.error('Cron failed:', data.error);
        }
    } catch (error) {
        console.error('Cron network error:', error.message);
    }
}, INTERVAL);
