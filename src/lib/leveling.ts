// src/lib/leveling.ts
import { XPService } from './xpService';

export const MAX_LEVEL = 50;

export function getLevelFromXP(xp: number): number {
    return XPService.getLevelFromXP(xp);
}

export function getXPForLevel(level: number): number {
    return XPService.getTotalXPRequiredForLevel(level);
}

export function getLevelProgress(xp: number): { currentLevel: number; nextLevelXP: number; currentLevelXP: number; progressPercent: number } {
    const { currentLevelXP, nextLevelXP, progress } = XPService.getXPProgress(xp);
    const currentLevel = XPService.getLevelFromXP(xp);
    
    // nextLevelXP in leveling.ts was meant to be the absolute total XP required for next level
    // but in profile page: `nextLevelXP - currentLevelXP` is used. Wait, in profile: 
    // `xp - currentLevelXP` and `nextLevelXP - currentLevelXP`
    // So currentLevelXP here must mean the absolute total XP for the CURRENT level start.
    // nextLevelXP must mean the absolute total XP for the NEXT level start.

    const absoluteCurrentLevelXP = XPService.getTotalXPRequiredForLevel(currentLevel);
    const absoluteNextLevelXP = currentLevel >= 50 ? absoluteCurrentLevelXP : absoluteCurrentLevelXP + XPService.getXPRequiredForNextLevel(currentLevel);

    return { 
        currentLevel, 
        nextLevelXP: absoluteNextLevelXP, 
        currentLevelXP: absoluteCurrentLevelXP, 
        progressPercent: progress * 100 
    };
}

export function getNametagForLevel(level: number): { name: string; colorClass: string; bgClass: string } {
    const name = XPService.getRankForLevel(level);
    let colorClass = "text-zinc-400";
    let bgClass = "bg-zinc-400/10";

    if (level === 50) {
        colorClass = "text-rose-500";
        bgClass = "bg-rose-500/10";
    } else if (level >= 40) {
        colorClass = "text-cyan-400";
        bgClass = "bg-cyan-400/10";
    } else if (level >= 30) {
        colorClass = "text-yellow-400";
        bgClass = "bg-yellow-400/10";
    } else if (level >= 20) {
        colorClass = "text-slate-300";
        bgClass = "bg-slate-300/10";
    } else if (level >= 10) {
        colorClass = "text-amber-600";
        bgClass = "bg-amber-600/10";
    }

    return { name, colorClass, bgClass };
}
