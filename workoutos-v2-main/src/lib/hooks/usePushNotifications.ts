import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function usePushNotifications() {
    const { user } = useAuth();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    };

    const subscribeToPush = async () => {
        if (!user || !isSupported) return;

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Notification permission not granted');
            }

            const registration = await navigator.serviceWorker.register('/sw.js');
            
            // Note: In production you'd fetch this public key dynamically
            const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; 
            if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY === 'BM-s-x-e-c-y-e-e-k-p-u-b-l-i-c-k-e-y') {
                throw new Error("Missing VAPID Public Key in Vercel. Please generate one and add NEXT_PUBLIC_VAPID_PUBLIC_KEY to your environment variables.");
            }
            
            // Helper function to convert base64 to Uint8Array
            const urlBase64ToUint8Array = (base64String: string) => {
                const padding = '='.repeat((4 - base64String.length % 4) % 4);
                const base64 = (base64String + padding)
                    .replace(/\-/g, '+')
                    .replace(/_/g, '/');
                
                const rawData = window.atob(base64);
                const outputArray = new Uint8Array(rawData.length);
                
                for (let i = 0; i < rawData.length; ++i) {
                    outputArray[i] = rawData.charCodeAt(i);
                }
                return outputArray;
            };

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // Send subscription to backend
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription,
                    userId: user.id
                }),
            });

            if (!response.ok) throw new Error('Failed to save subscription');
            
            setIsSubscribed(true);
            return true;
        } catch (error: any) {
            console.error('Error subscribing to push:', error);
            alert('Failed to enable notifications: ' + (error.message || String(error)));
            return false;
        }
    };

    return {
        isSupported,
        isSubscribed,
        subscribeToPush
    };
}
