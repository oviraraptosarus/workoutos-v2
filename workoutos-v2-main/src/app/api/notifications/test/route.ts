import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from '@/lib/notifications';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
        }
        
        const token = authHeader.replace('Bearer ', '');
        
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

        const res = await sendPushNotification(user.id, {
            title: 'Test Notification',
            description: 'It works! Push notifications are successfully configured on this device.',
            url: '/dashboard'
        });

        if (!res.success) {
            return NextResponse.json({ error: res.error || res.reason || 'Failed to send' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Test notification sent' });

    } catch (error: any) {
        console.error('Test Push API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
