import { supabase } from './supabase/client';

export interface XPAwardResult {
    awarded: boolean;
    xpAwarded: number;
    totalXP: number;
    oldLevel: number;
    newLevel: number;
    leveledUp: boolean;
}

export const XPService = {
    /**
     * Call the secure backend RPC to award XP.
     * Prevents duplicate awards via `sourceId`.
     */
    awardXP: async (
        userId: string,
        eventType: string,
        amount: number,
        sourceId: string,
        metadata: Record<string, any> = {}
    ): Promise<XPAwardResult | null> => {
        try {
            const { data, error } = await supabase.rpc('award_xp', {
                p_user_id: userId,
                p_event_type: eventType,
                p_amount: amount,
                p_source_id: sourceId,
                p_metadata: metadata
            });

            if (error) {
                console.error('Error awarding XP via RPC:', error);
                return null;
            }

            const result = data as XPAwardResult;

            // Dispatch global event for level up animation if applicable
            if (result.awarded && result.leveledUp && typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('workout_os_leveled_up', { detail: result }));
            }

            return result;
        } catch (err) {
            console.error('Unexpected error awarding XP:', err);
            return null;
        }
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // PROGRESSION MATH (Must mirror the PL/pgSQL function exactly)
    // Formula: XP for next level = round(100 * pow(1.08, L - 1))
    // ─────────────────────────────────────────────────────────────────────────────

    getXPRequiredForNextLevel: (currentLevel: number): number => {
        if (currentLevel >= 50) return 0;
        return Math.round(100 * Math.pow(1.08, currentLevel - 1));
    },

    getTotalXPRequiredForLevel: (targetLevel: number): number => {
        let total = 0;
        for (let l = 1; l < targetLevel; l++) {
            total += Math.round(100 * Math.pow(1.08, l - 1));
        }
        return total;
    },

    getLevelFromXP: (totalXP: number): number => {
        let currentLevel = 1;
        let cumulativeXP = 0;

        while (currentLevel < 50) {
            const xpForNext = Math.round(100 * Math.pow(1.08, currentLevel - 1));
            if (totalXP >= cumulativeXP + xpForNext) {
                cumulativeXP += xpForNext;
                currentLevel++;
            } else {
                break;
            }
        }
        return currentLevel;
    },

    getXPProgress: (totalXP: number): { currentLevelXP: number; nextLevelXP: number; progress: number } => {
        const level = XPService.getLevelFromXP(totalXP);
        
        if (level >= 50) {
            return { currentLevelXP: 0, nextLevelXP: 0, progress: 1 };
        }

        const baseXPForCurrentLevel = XPService.getTotalXPRequiredForLevel(level);
        const currentLevelXP = Math.max(0, totalXP - baseXPForCurrentLevel);
        const nextLevelXP = XPService.getXPRequiredForNextLevel(level);
        
        const progress = Math.min(1, Math.max(0, currentLevelXP / nextLevelXP));

        return {
            currentLevelXP,
            nextLevelXP,
            progress
        };
    },

    getRankForLevel: (level: number): string => {
        if (level <= 5) return 'IRON NOVICE';
        if (level <= 10) return 'IRON TRAINEE';
        if (level <= 15) return 'IRON FIGHTER';
        if (level <= 20) return 'IRON WARRIOR';
        if (level <= 25) return 'IRON ELITE';
        if (level <= 30) return 'IRON VETERAN';
        if (level <= 35) return 'IRON VANGUARD';
        if (level <= 40) return 'IRON MASTER';
        if (level <= 45) return 'IRON CHAMPION';
        if (level < 50) return 'IRON ASCENDANT';
        return 'IRON LEGEND';
    }
};
