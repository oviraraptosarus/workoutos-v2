import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
    'mailto:support@workoutos.example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

// Admin client to bypass RLS for background processing
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function sendPushNotification(userId: string, payload: any) {
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
