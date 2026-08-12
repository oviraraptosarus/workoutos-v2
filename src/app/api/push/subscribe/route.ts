import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
    try {
        const { subscription, userId } = await req.json();
        
        if (!subscription || !userId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const { endpoint, keys } = subscription;
        const { p256dh, auth } = keys;

        // Upsert the subscription (handles if the endpoint already exists for this user)
        const { error } = await supabase.from('push_subscriptions').upsert({
            user_id: userId,
            endpoint: endpoint,
            p256dh: p256dh,
            auth: auth
        }, { onConflict: 'user_id,endpoint' });

        if (error) {
            console.error('Push Subscription Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
