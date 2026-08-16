'use client';

import { useState, useEffect, useCallback, RefObject } from 'react';

interface SwipeConfig {
    threshold?: number; // minimum distance in px to be considered a swipe
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
}

export function useSwipe(ref: RefObject<HTMLElement | null>, config: SwipeConfig) {
    const { threshold = 50, onSwipeLeft, onSwipeRight } = config;
    
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const onTouchStart = useCallback((e: TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    }, []);

    const onTouchMove = useCallback((e: TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    }, []);

    const onTouchEnd = useCallback(() => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > threshold;
        const isRightSwipe = distance < -threshold;

        if (isLeftSwipe && onSwipeLeft) {
            onSwipeLeft();
        }
        
        if (isRightSwipe && onSwipeRight) {
            onSwipeRight();
        }

        // Reset
        setTouchStart(null);
        setTouchEnd(null);
    }, [touchStart, touchEnd, threshold, onSwipeLeft, onSwipeRight]);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        element.addEventListener('touchstart', onTouchStart);
        element.addEventListener('touchmove', onTouchMove);
        element.addEventListener('touchend', onTouchEnd);

        return () => {
            element.removeEventListener('touchstart', onTouchStart);
            element.removeEventListener('touchmove', onTouchMove);
            element.removeEventListener('touchend', onTouchEnd);
        };
    }, [ref, onTouchStart, onTouchMove, onTouchEnd]);
}
