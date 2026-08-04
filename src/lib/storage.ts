/* eslint-disable @typescript-eslint/no-explicit-any */
export const safeStorage = {
    getItem(key: string): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(key);
    },
    setItem(key: string, value: string): boolean {
        if (typeof window === 'undefined') return false;
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e: any) {
            console.error('Storage error:', e);
            if (e.name === 'QuotaExceededError') {
                alert('Storage limit reached! Please clear some old data to save new data.');
            }
            return false;
        }
    },
    removeItem(key: string): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(key);
    }
};
