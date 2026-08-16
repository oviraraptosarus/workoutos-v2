'use client';

import React from 'react';
import SleepCard from './cards/SleepCard';
import WaterCard from './cards/WaterCard';
import WorkoutCard from './cards/WorkoutCard';
import NutritionCard from './cards/NutritionCard';
import BudgetSnapshotCard from './cards/BudgetSnapshotCard';
import MoodEnergyCard from './cards/MoodEnergyCard';
import { useAuth } from '@/contexts/AuthContext';

export default function BentoGrid() {
    const { userProfile } = useAuth();
    const showBudget = userProfile?.enableFinancialReminders !== false;

    return (
        <div className="flex flex-col gap-3 sm:gap-4">
            {/* Recovery pair — sleep and hydration read together each morning. */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <SleepCard />
                <WaterCard />
            </div>

            {/* Intake + training. Nutrition leads on desktop; both stay full width on mobile
                so the calorie ring and exercise list keep legible tap targets. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <NutritionCard />
                <WorkoutCard />
            </div>

            <MoodEnergyCard />

            {showBudget && <BudgetSnapshotCard />}
        </div>
    );
}
