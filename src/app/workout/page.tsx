'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import WorkoutHeader from './components/WorkoutHeader';
import ActiveSplitCard from './components/ActiveSplitCard';
import RecentWorkouts from './components/RecentWorkouts';
import PresetWorkouts from './components/PresetWorkouts';
import ActivityTracker from './components/ActivityTracker';
import BurnGoalTracker from './components/BurnGoalTracker';
import CardioActivityModal from './components/modals/CardioActivityModal';
import ActivityTrendsChart from './components/ActivityTrendsChart';
import MuscleRecoveryHeatmap from './components/MuscleRecoveryHeatmap';

export default function WorkoutPage() {
    const [activePreset, setActivePreset] = useState<any>(null);
    const [isBuilderMode, setIsBuilderMode] = useState(false);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [isCardioModalOpen, setIsCardioModalOpen] = useState(false);

    const handlePlayWorkout = (preset: any) => {
        setIsBuilderMode(false);
        setIsCountingDown(true);
        setCountdown(3);
        
        let counter = 3;
        const interval = setInterval(() => {
            counter -= 1;
            if (counter > 0) {
                setCountdown(counter);
            } else {
                clearInterval(interval);
                setIsCountingDown(false);
                setActivePreset(preset);
                
                // Scroll to top where active split is
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 1000);
    };

    React.useEffect(() => {
        const handleMuscleClick = (e: any) => {
            const muscle = e.detail;
            
            // Map muscles to exercises
            const exerciseMap: Record<string, {name: string, sets: string}[]> = {
                'Chest': [
                    { name: 'Barbell Bench Press', sets: '4 sets x 8-10 reps' },
                    { name: 'Incline Dumbbell Press', sets: '3 sets x 10-12 reps' },
                    { name: 'Push-ups', sets: '3 sets x max reps' }
                ],
                'Back': [
                    { name: 'Pull-ups', sets: '3 sets x 8-12 reps' },
                    { name: 'Barbell Rows', sets: '3 sets x 8-10 reps' },
                    { name: 'Lat Pulldowns', sets: '3 sets x 10-12 reps' }
                ],
                'Legs': [
                    { name: 'Back Squats', sets: '4 sets x 6-8 reps' },
                    { name: 'Romanian Deadlifts', sets: '3 sets x 8-10 reps' },
                    { name: 'Leg Press', sets: '3 sets x 10-12 reps' }
                ],
                'Arms': [
                    { name: 'Bicep Curls', sets: '3 sets x 12-15 reps' },
                    { name: 'Tricep Pushdowns', sets: '3 sets x 12-15 reps' },
                    { name: 'Hammer Curls', sets: '3 sets x 10-12 reps' }
                ],
                'Shoulders': [
                    { name: 'Overhead Press', sets: '3 sets x 8-10 reps' },
                    { name: 'Lateral Raises', sets: '3 sets x 12-15 reps' },
                    { name: 'Front Raises', sets: '3 sets x 12-15 reps' }
                ],
                'Core': [
                    { name: 'Crunches', sets: '3 sets x 20 reps' },
                    { name: 'Russian Twists', sets: '3 sets x 20 reps / side' },
                    { name: 'Plank', sets: '3 sets x 60s' }
                ]
            };

            const exercises = exerciseMap[muscle] || [];

            const miniPreset = {
                id: `quick-${muscle.toLowerCase()}`,
                title: `${muscle} Focus`,
                subtitle: `Targeted ${muscle} Training`,
                iconType: 'target',
                duration: '30 min',
                intensity: 'Medium',
                color: 'bg-primary/10 text-primary',
                exercises: exercises.map(ex => ({ ...ex, youtubeUrl: '' }))
            };

            handlePlayWorkout(miniPreset);
        };

        const handleRecentWorkout = (e: any) => {
            const workout = e.detail;
            
            // Format recent workout into a preset format
            const preset = {
                id: `recent-${workout.id}`,
                title: workout.name,
                subtitle: `Past Workout from ${workout.date}`,
                iconType: 'repeat',
                duration: workout.duration,
                intensity: 'Medium',
                color: 'bg-primary/10 text-primary',
                exercises: workout.originalExercises ? workout.originalExercises.filter((ex: any) => ex.type !== 'metadata') : []
            };

            handlePlayWorkout(preset);
        };

        window.addEventListener('workout_os_play_muscle_workout', handleMuscleClick);
        window.addEventListener('workout_os_play_recent_workout', handleRecentWorkout);
        
        return () => {
            window.removeEventListener('workout_os_play_muscle_workout', handleMuscleClick);
            window.removeEventListener('workout_os_play_recent_workout', handleRecentWorkout);
        };
    }, []);

    return (
        <AppLayout>
            {isCountingDown && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f4e38]/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div key={countdown} className="text-9xl font-black text-white drop-shadow-2xl animate-in zoom-in duration-500">
                        {countdown}
                    </div>
                </div>
            )}
            
            <CardioActivityModal isOpen={isCardioModalOpen} onClose={() => setIsCardioModalOpen(false)} />

            <div className="space-y-4">
                <WorkoutHeader 
                    onStartEmpty={() => { setActivePreset(null); setIsBuilderMode(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                    onLogActivity={() => setIsCardioModalOpen(true)}
                />
                
                <BurnGoalTracker />
                
                <ActivityTracker />
                
                <div id="tour-workout-active-split" className="relative z-30">
                    <ActiveSplitCard preset={activePreset} isBuilderMode={isBuilderMode} onExitBuilder={() => setIsBuilderMode(false)} onCloseSession={() => { setActivePreset(null); setIsBuilderMode(false); }} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ActivityTrendsChart />
                    <MuscleRecoveryHeatmap />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PresetWorkouts onPlay={handlePlayWorkout} />
                    <RecentWorkouts />
                </div>
            </div>
        </AppLayout>
    );
}
