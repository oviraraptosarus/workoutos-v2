/**
 * Generates a consistent date key (YYYY-MM-DD) based on the user's LOCAL timezone.
 * Avoids the UTC drift bug caused by new Date().toLocaleDateString('en-CA')
 */
export function getLocalDateKey(dateObj?: Date): string {
    const d = dateObj || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

