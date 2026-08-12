import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { subscription, action } = body;

        // Since this is an API route accessed by authenticated clients,
        // we extract the token from the Authorization header to impersonate the user.
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
        }
        
        const token = authHeader.replace('Bearer ', '');
        
        // Create a client and forward the user's JWT to pass RLS policies
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        );
        
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        
        if (authErr || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (action === 'subscribe') {
            if (!subscription || !subscription.endpoint) {
                return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
            }

            const { endpoint, keys } = subscription;
            const p256dh = keys?.p256dh;
            const auth = keys?.auth;
            const userAgent = request.headers.get('user-agent') || 'Unknown';

            if (!p256dh || !auth) {
                return NextResponse.json({ error: 'Missing encryption keys in subscription' }, { status: 400 });
            }

            // Upsert the subscription based on endpoint
            const { error: upsertErr } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    endpoint,
                    p256dh,
                    auth,
                    user_agent: userAgent,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'endpoint' });

            if (upsertErr) {
                console.error("Supabase Error:", upsertErr);
                return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
            }

            return NextResponse.json({ success: true, message: 'Subscription saved' });
        } else if (action === 'unsubscribe') {
            if (!subscription || !subscription.endpoint) {
                return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
            }

            const { error: delErr } = await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', user.id)
                .eq('endpoint', subscription.endpoint);

            if (delErr) {
                console.error("Supabase Error:", delErr);
                return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
            }

            return NextResponse.json({ success: true, message: 'Subscription removed' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Subscription API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
