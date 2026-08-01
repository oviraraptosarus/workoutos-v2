'use client';

import React from 'react';
import { Dumbbell, Droplet, Utensils, IndianRupee } from 'lucide-react';

export default function QuickLogBar() {
    return (
        <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-hide">
            <span className="text-[11px] font-bold text-on-surface-variant flex-shrink-0 mr-1 uppercase tracking-wider">Quick Log</span>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card-white border border-surface-variant border-surface-variant hover:bg-surface-container-low text-[11px] font-bold text-on-surface-variant transition-colors flex-shrink-0 shadow-sm btn-press">
                <Dumbbell size={14} className="text-green-500" /> Workout
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card-white border border-surface-variant border-surface-variant hover:bg-surface-container-low text-[11px] font-bold text-on-surface-variant transition-colors flex-shrink-0 shadow-sm btn-press">
                <Droplet size={14} className="text-blue-500" /> Water
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card-white border border-surface-variant border-surface-variant hover:bg-surface-container-low text-[11px] font-bold text-on-surface-variant transition-colors flex-shrink-0 shadow-sm btn-press">
                <Utensils size={14} className="text-orange-500" /> Meal
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card-white border border-surface-variant border-surface-variant hover:bg-surface-container-low text-[11px] font-bold text-on-surface-variant transition-colors flex-shrink-0 shadow-sm btn-press">
                <IndianRupee size={14} className="text-indigo-500" /> Expense
            </button>
        </div>
    );
}
