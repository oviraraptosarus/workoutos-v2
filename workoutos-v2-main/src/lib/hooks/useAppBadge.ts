'use client';

import { useEffect, useCallback } from 'react';

export function useAppBadge() {
    const isSupported = typeof window !== 'undefined' && 'setAppBadge' in navigator && 'clearAppBadge' in navigator;

    const setBadge = useCallback(async (count: number) => {
        if (!isSupported) return;
        try {
            if (count > 0) {
                await (navigator as any).setAppBadge(count);
            } else {
                await (navigator as any).clearAppBadge();
            }
        } catch (error) {
            console.warn('App badge error:', error);
        }
    }, [isSupported]);

    const clearBadge = useCallback(async () => {
        if (!isSupported) return;
        try {
            await (navigator as any).clearAppBadge();
        } catch (error) {
            console.warn('App badge clear error:', error);
        }
    }, [isSupported]);

    return { setBadge, clearBadge, isSupported };
}
