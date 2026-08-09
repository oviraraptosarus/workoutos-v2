// src/lib/leveling.ts

export const MAX_LEVEL = 50;

/**
 * Calculates the user's current level based on their total XP.
 * Curve: Level 1 = 0 XP. 
 * Each subsequent level requires increasingly more XP.
 * Example formula: XP = (Level - 1)^2 * 100
 */
export function getLevelFromXP(xp: number): number {
    if (xp <= 0) return 1;
    // Reverse formula: Level = sqrt(XP / 100) + 1
    const rawLevel = Math.floor(Math.sqrt(xp / 100)) + 1;
    return Math.min(Math.max(1, rawLevel), MAX_LEVEL);
}

/**
 * Calculates how much XP is required to reach a specific level.
 */
export function getXPForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.pow(level - 1, 2) * 100;
}

/**
 * Returns the progress towards the next level as a percentage (0-100).
 */
export function getLevelProgress(xp: number): { currentLevel: number; nextLevelXP: number; currentLevelXP: number; progressPercent: number } {
    const currentLevel = getLevelFromXP(xp);
    if (currentLevel >= MAX_LEVEL) {
        return { currentLevel, nextLevelXP: xp, currentLevelXP: xp, progressPercent: 100 };
    }
    const currentLevelXP = getXPForLevel(currentLevel);
    const nextLevelXP = getXPForLevel(currentLevel + 1);
    
    const xpIntoLevel = xp - currentLevelXP;
    const xpRequiredForNext = nextLevelXP - currentLevelXP;
    const progressPercent = Math.min(100, Math.max(0, (xpIntoLevel / xpRequiredForNext) * 100));
    
    return { currentLevel, nextLevelXP, currentLevelXP, progressPercent };
}

/**
 * Reddit-style Progress Nametags for 50 levels.
 * Grouped into 5 tiers (Iron, Bronze, Silver, Gold, Diamond), each with 10 sub-tiers.
 */
export function getNametagForLevel(level: number): { name: string; colorClass: string; bgClass: string } {
    const clamped = Math.min(Math.max(1, level), MAX_LEVEL);
    
    // Determine Tier (1-5)
    const tierIndex = Math.ceil(clamped / 10);
    const rankIndex = clamped % 10 === 0 ? 10 : clamped % 10;
    
    const tiers = [
        { prefix: "Iron", color: "text-zinc-400", bg: "bg-zinc-400/10" },
        { prefix: "Bronze", color: "text-amber-600", bg: "bg-amber-600/10" },
        { prefix: "Silver", color: "text-slate-300", bg: "bg-slate-300/10" },
        { prefix: "Gold", color: "text-yellow-400", bg: "bg-yellow-400/10" },
        { prefix: "Diamond", color: "text-cyan-400", bg: "bg-cyan-400/10" },
    ];
    
    const ranks = [
        "Novice", "Initiate", "Apprentice", "Tracker", "Scout", 
        "Challenger", "Gladiator", "Warrior", "Champion", "Titan"
    ];

    const currentTier = tiers[tierIndex - 1] || tiers[0];
    const currentRank = ranks[rankIndex - 1] || ranks[0];

    // Max level special tag
    if (clamped === 50) {
        return { name: "Apex Predator", colorClass: "text-rose-500", bgClass: "bg-rose-500/10" };
    }

    return { 
        name: `${currentTier.prefix} ${currentRank}`, 
        colorClass: currentTier.color,
        bgClass: currentTier.bg
    };
}
