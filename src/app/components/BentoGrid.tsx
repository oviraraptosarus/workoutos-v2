'use client';

import React from 'react';
import SleepCard from './cards/SleepCard';
import WaterCard from './cards/WaterCard';
import WorkoutCard from './cards/WorkoutCard';
import NutritionCard from './cards/NutritionCard';
import BudgetSnapshotCard from './cards/BudgetSnapshotCard';
import MoodEnergyCard from './cards/MoodEnergyCard';

export default function BentoGrid() {
    return (
        <div className="space-y-4">
            {/* Row 1: Sleep hero (2 cols on desktop) + Water (1 col) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <SleepCard />
                </div>
                <div>
                    <WaterCard />
                </div>
            </div>

            {/* Row 2: Workout + Nutrition + Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <WorkoutCard />
                <NutritionCard />
                <BudgetSnapshotCard />
            </div>

            {/* Row 3: Mood & Energy */}
            <MoodEnergyCard />
        </div>
    );
}