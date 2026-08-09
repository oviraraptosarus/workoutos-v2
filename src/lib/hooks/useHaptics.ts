'use client';

import { useCallback } from 'react';

export function useHaptics() {
    const isSupported = typeof window !== 'undefined' && 'vibrate' in navigator;

    const hapticTap = useCallback(() => {
        if (isSupported) {
            navigator.vibrate(10);
        }
    }, [isSupported]);

    const hapticSuccess = useCallback(() => {
        if (isSupported) {
            navigator.vibrate([10, 30, 10]);
        }
    }, [isSupported]);

    const hapticError = useCallback(() => {
        if (isSupported) {
            navigator.vibrate([30, 50, 30, 50, 50]);
        }
    }, [isSupported]);

    const hapticWarning = useCallback(() => {
        if (isSupported) {
            navigator.vibrate([20, 50, 20]);
        }
    }, [isSupported]);

    return {
        isSupported,
        hapticTap,
        hapticSuccess,
        hapticError,
        hapticWarning,
    };
}
