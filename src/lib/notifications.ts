import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

let vapidInitialized = false;

function initVapid() {
    if (vapidInitialized) return;
    
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    
    if (publicKey && privateKey) {
        try {
            webpush.setVapidDetails(
                'mailto:support@workoutos.example.com',
                publicKey,
                privateKey
            );
            vapidInitialized = true;
        } catch (e) {
            console.error('Failed to initialize VAPID details:', e);
        }
    } else {
        console.warn('VAPID keys are missing. Push notifications will be disabled.');
    }
}

// Admin client to bypass RLS for background processing
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fake-key'
);

export async function sendPushNotification(userId: string, payload: any) {
    initVapid();
    
    // 1. Get all subscriptions for this user
    const { data: subscriptions, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error("Error fetching subscriptions:", error);
        return { success: false, error };
    }

    if (!subscriptions || subscriptions.length === 0) {
        return { success: false, reason: 'No subscriptions found' };
    }

    const payloadString = JSON.stringify(payload);
    const staleEndpoints: string[] = [];

    // 2. Send to all endpoints
    const promises = subscriptions.map(async (sub) => {
        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
            }
        };

        try {
            await webpush.sendNotification(pushSubscription, payloadString);
        } catch (err: any) {
            console.error(`Error sending push to ${sub.endpoint}:`, err);
            // If the endpoint is expired or unsubscribed, mark for deletion
            if (err.statusCode === 404 || err.statusCode === 410) {
                staleEndpoints.push(sub.endpoint);
            }
        }
    });

    await Promise.allSettled(promises);

    // 3. Cleanup stale subscriptions
    if (staleEndpoints.length > 0) {
        await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .in('endpoint', staleEndpoints);
    }

    return { success: true };
}
