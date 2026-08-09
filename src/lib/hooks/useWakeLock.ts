'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useWakeLock() {
    const [isSupported, setIsSupported] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    useEffect(() => {
        setIsSupported(typeof navigator !== 'undefined' && 'wakeLock' in navigator);
    }, []);

    const requestWakeLock = useCallback(async () => {
        if (!isSupported) return;

        try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
            setIsLocked(true);
            
            wakeLockRef.current.addEventListener('release', () => {
                setIsLocked(false);
            });
        } catch (err: any) {
            console.error(`Wake Lock error: ${err.name}, ${err.message}`);
        }
    }, [isSupported]);

    const releaseWakeLock = useCallback(async () => {
        if (wakeLockRef.current) {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
            setIsLocked(false);
        }
    }, []);

    // Re-request wake lock when page visibility changes
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
                await requestWakeLock();
            }
        };

        if (isSupported) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        return () => {
            if (isSupported) {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
        };
    }, [isSupported, requestWakeLock]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            releaseWakeLock();
        };
    }, [releaseWakeLock]);

    return { isSupported, isLocked, requestWakeLock, releaseWakeLock };
}
