'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let authSubscription: any = null;

        const handleAuthCallback = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('Error in auth callback:', error.message);
                    setError(error.message);
                    return;
                }

                if (session) {
                    router.push('/dashboard');
                } else {
                    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
                        if (event === 'SIGNED_IN' || currentSession) {
                            subscription.unsubscribe();
                            router.push('/dashboard');
                        }
                    });
                    authSubscription = subscription;

                    timeoutId = setTimeout(async () => {
                        const { data } = await supabase.auth.getSession();
                        if (!data.session) {
                            if (authSubscription) authSubscription.unsubscribe();
                            router.push('/sign-up-login-screen');
                        } else {
                            if (authSubscription) authSubscription.unsubscribe();
                            router.push('/dashboard');
                        }
                    }, 5000);
                }
            } catch (err: any) {
                console.error('Unexpected error in auth callback:', err);
                setError(err.message || 'Authentication failed');
            }
        };

        handleAuthCallback();

        return () => {
            if (authSubscription) authSubscription.unsubscribe();
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [router]);

    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="text-center p-4 sm:p-5 bg-surface-container rounded-2xl max-w-md w-full">
                    <h2 className="text-title-lg font-title-lg text-error mb-4">Authentication Error</h2>
                    <p className="text-body-md text-on-surface-variant mb-6">{error}</p>
                    <button 
                        onClick={() => router.push('/sign-up-login-screen')}
                        className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-lg"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-body-lg font-body-lg text-on-surface">Completing sign in...</p>
            </div>
        </div>
    );
}
