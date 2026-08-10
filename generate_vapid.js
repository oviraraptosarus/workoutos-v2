const webpush = require('web-push');
const fs = require('fs');

const vapidKeys = webpush.generateVAPIDKeys();

const envContent = `\n# Web Push VAPID Keys\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`;

fs.appendFileSync('.env.local', envContent);

console.log('VAPID keys generated and appended to .env.local');
console.log('Public Key:', vapidKeys.publicKey);
