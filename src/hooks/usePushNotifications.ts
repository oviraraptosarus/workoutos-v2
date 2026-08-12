import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSupport = async () => {
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
                setIsSupported(true);
                setPermission(Notification.permission);
                
                try {
                    let registration = await navigator.serviceWorker.getRegistration();
                    if (!registration) {
                        registration = await navigator.serviceWorker.register('/sw.js');
                        await navigator.serviceWorker.ready;
                    }
                    if (registration) {
                        const sub = await registration.pushManager.getSubscription();
                        setSubscription(sub);
                    }
                } catch (e) {
                    console.error("Error getting push subscription:", e);
                }
            }
            setIsLoading(false);
        };
        checkSupport();
    }, []);

    const subscribeToPush = async () => {
        setIsLoading(true);
        try {
            if (!isSupported) throw new Error("Push notifications are not supported in this browser.");

            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult !== 'granted') {
                throw new Error("Permission not granted for notifications.");
            }

            let registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                registration = await navigator.serviceWorker.register('/sw.js');
                await navigator.serviceWorker.ready;
            }
            if (!registration) throw new Error("Service Worker registration failed.");
            
            // Get VAPID public key
            const response = await fetch('/api/notifications/vapid-public-key');
            if (!response.ok) throw new Error("Failed to fetch VAPID key");
            const { publicKey } = await response.json();
            
            // Convert Base64URL string to Uint8Array for the subscribe call
            const padding = '='.repeat((4 - publicKey.length % 4) % 4);
            const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: outputArray
            });
            
            setSubscription(sub);

            // Send subscription to backend
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const saveRes = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    action: 'subscribe',
                    subscription: sub
                })
            });

            if (!saveRes.ok) throw new Error("Failed to save subscription on server");
            
            return { success: true };
        } catch (error: any) {
            console.error('Failed to subscribe:', error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    const unsubscribeFromPush = async () => {
        setIsLoading(true);
        try {
            if (!subscription) return { success: true };

            // Tell backend to remove
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        action: 'unsubscribe',
                        subscription: subscription
                    })
                });
            }

            await subscription.unsubscribe();
            setSubscription(null);
            return { success: true };
        } catch (error: any) {
            console.error('Failed to unsubscribe:', error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isSupported,
        subscription,
        permission,
        isLoading,
        subscribeToPush,
        unsubscribeFromPush
    };
}
