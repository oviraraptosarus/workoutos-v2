'use client';

import React from 'react';
import { Play, Dumbbell, Zap, Timer, Activity, Flame, Shield, Heart, Anchor, Crosshair, Target, Wind } from 'lucide-react';

export const PRESET_WORKOUTS = [
    {
        id: 'hiit-1',
        title: 'HIIT for Fat Loss',
        subtitle: 'Tabata Protocol',
        iconType: 'zap',
        duration: '20 min',
        intensity: 'High',
        color: 'bg-amber-50 text-amber-500',
        exercises: [
            { name: 'Burpees', sets: '8 sets x 20s (10s rest)', youtubeUrl: 'https://youtube.com/watch?v=qZWpbC6nZzI' },
            { name: 'Mountain Climbers', sets: '8 sets x 20s (10s rest)', youtubeUrl: 'https://youtube.com/watch?v=nmwgirgXLYM' },
            { name: 'Jumping Jacks', sets: '8 sets x 20s (10s rest)', youtubeUrl: 'https://youtube.com/watch?v=iSSAk4XcsZk' },
        ]
    },
    {
        id: 'push-1',
        title: 'Push Day',
        subtitle: 'Hypertrophy Focus',
        iconType: 'dumbbell',
        duration: '45 min',
        intensity: 'Medium',
        color: 'bg-blue-50 text-blue-500',
        exercises: [
            { name: 'Barbell Bench Press', sets: '4 sets x 8-10 reps', youtubeUrl: 'https://youtube.com/watch?v=rxD321l2svE' },
            { name: 'Incline Dumbbell Press', sets: '3 sets x 10-12 reps', youtubeUrl: 'https://youtube.com/watch?v=8iPEnn-ltC8' },
            { name: 'Overhead Press', sets: '3 sets x 8-10 reps', youtubeUrl: 'https://youtube.com/watch?v=QAQ64hK4Xxs' },
            { name: 'Tricep Pushdowns', sets: '3 sets x 12-15 reps', youtubeUrl: 'https://youtube.com/watch?v=2-LAMcpzODU' },
        ]
    },
    {
        id: 'pull-1',
        title: 'Pull Day',
        subtitle: 'Hypertrophy Focus',
        iconType: 'anchor',
        duration: '45 min',
        intensity: 'Medium',
        color: 'bg-indigo-50 text-indigo-500',
        exercises: [
            { name: 'Deadlift', sets: '3 sets x 5 reps', youtubeUrl: 'https://youtube.com/watch?v=op9kVnSso6Q' },
            { name: 'Pull-ups', sets: '3 sets x 8-12 reps', youtubeUrl: 'https://youtube.com/watch?v=eGo4IYtlCvk' },
            { name: 'Barbell Rows', sets: '3 sets x 8-10 reps', youtubeUrl: 'https://youtube.com/watch?v=G8l_8chR5BE' },
            { name: 'Bicep Curls', sets: '3 sets x 12-15 reps', youtubeUrl: 'https://youtube.com/watch?v=ykJmrZ5v0Oo' },
        ]
    },
    {
        id: 'leg-1',
        title: 'Leg Day',
        subtitle: 'Strength & Size',
        iconType: 'shield',
        duration: '50 min',
        intensity: 'High',
        color: 'bg-emerald-50 text-emerald-500',
        exercises: [
            { name: 'Back Squats', sets: '4 sets x 6-8 reps', youtubeUrl: 'https://youtube.com/watch?v=SW_C1A-rejs' },
            { name: 'Romanian Deadlifts', sets: '3 sets x 8-10 reps', youtubeUrl: 'https://youtube.com/watch?v=JCXUYuzwNrM' },
            { name: 'Leg Press', sets: '3 sets x 10-12 reps', youtubeUrl: 'https://youtube.com/watch?v=IZxyjW7OSvc' },
            { name: 'Calf Raises', sets: '4 sets x 15-20 reps', youtubeUrl: 'https://youtube.com/watch?v=-M4-G8p8fmc' },
        ]
    },
    {
        id: 'cardio-1',
        title: 'Cardio Engine',
        subtitle: 'Norwegian 4x4',
        iconType: 'timer',
        duration: '35 min',
        intensity: 'High',
        color: 'bg-rose-50 text-rose-500',
        exercises: [
            { name: 'Warm-up Jog', sets: '1 set x 10 min', youtubeUrl: '' },
            { name: 'High Intensity Run (90% HR)', sets: '4 sets x 4 min', youtubeUrl: '' },
            { name: 'Active Recovery Jog', sets: '3 sets x 3 min', youtubeUrl: '' },
            { name: 'Cool-down Walk', sets: '1 set x 5 min', youtubeUrl: '' },
        ]
    },
    {
        id: 'fullbody-1',
        title: 'Full Body Core',
        subtitle: 'Stability & Strength',
        iconType: 'crosshair',
        duration: '40 min',
        intensity: 'Medium',
        color: 'bg-purple-50 text-purple-500',
        exercises: [
            { name: 'Goblet Squats', sets: '3 sets x 10-12 reps', youtubeUrl: '' },
            { name: 'Push-ups', sets: '3 sets x 10-15 reps', youtubeUrl: '' },
            { name: 'Dumbbell Rows', sets: '3 sets x 10-12 reps', youtubeUrl: '' },
            { name: 'Plank', sets: '3 sets x 60s', youtubeUrl: '' },
        ]
    },
    {
        id: 'power-1',
        title: 'Upper Body Power',
        subtitle: 'Explosive Focus',
        iconType: 'flame',
        duration: '40 min',
        intensity: 'High',
        color: 'bg-orange-50 text-orange-500',
        exercises: [
            { name: 'Plyometric Push-ups', sets: '4 sets x 5-8 reps', youtubeUrl: '' },
            { name: 'Medicine Ball Throws', sets: '4 sets x 8-10 reps', youtubeUrl: '' },
            { name: 'Speed Bench Press', sets: '4 sets x 5 reps', youtubeUrl: '' },
        ]
    },
    {
        id: 'recovery-1',
        title: 'Active Recovery',
        subtitle: 'Mobility & Stretching',
        iconType: 'heart',
        duration: '25 min',
        intensity: 'Low',
        color: 'bg-pink-50 text-pink-500',
        exercises: [
            { name: 'Cat-Cow Stretches', sets: '1 set x 2 min', youtubeUrl: '' },
            { name: 'World\'s Greatest Stretch', sets: '1 set x 2 min / side', youtubeUrl: '' },
            { name: 'Pigeon Pose', sets: '1 set x 2 min / side', youtubeUrl: '' },
            { name: 'Child\'s Pose', sets: '1 set x 3 min', youtubeUrl: '' },
        ]
    },
    {
        id: 'core-1',
        title: 'Core Crusher',
        subtitle: 'Abs Focus',
        iconType: 'target',
        duration: '25 min',
        intensity: 'Medium',
        color: 'bg-teal-50 text-teal-500',
        exercises: [
            { name: 'Crunches', sets: '3 sets x 20 reps', youtubeUrl: 'https://youtube.com/watch?v=Xyd_fa5zoEU' },
            { name: 'Russian Twists', sets: '3 sets x 20 reps / side', youtubeUrl: 'https://youtube.com/watch?v=wkD8rjkodUI' },
            { name: 'Leg Raises', sets: '3 sets x 15 reps', youtubeUrl: 'https://youtube.com/watch?v=l4kQd9eWclE' },
            { name: 'Bicycle Crunches', sets: '3 sets x 20 reps / side', youtubeUrl: 'https://youtube.com/watch?v=9FGilxCbdz8' },
        ]
    },
    {
        id: 'strength-1',
        title: '5x5 Strength',
        subtitle: 'Powerlifting Base',
        iconType: 'activity',
        duration: '60 min',
        intensity: 'High',
        color: 'bg-slate-100 text-slate-700',
        exercises: [
            { name: 'Barbell Squat', sets: '5 sets x 5 reps', youtubeUrl: '' },
            { name: 'Bench Press', sets: '5 sets x 5 reps', youtubeUrl: '' },
            { name: 'Barbell Row', sets: '5 sets x 5 reps', youtubeUrl: '' },
        ]
    },
    {
        id: 'calisthenics-1',
        title: 'Calisthenics Basics',
        subtitle: 'Bodyweight Mastery',
        iconType: 'wind',
        duration: '35 min',
        intensity: 'Medium',
        color: 'bg-cyan-50 text-cyan-500',
        exercises: [
            { name: 'Pull-ups', sets: '4 sets x max reps', youtubeUrl: '' },
            { name: 'Dips', sets: '4 sets x 8-12 reps', youtubeUrl: '' },
            { name: 'Pistol Squat Progressions', sets: '3 sets x 5-8 reps / side', youtubeUrl: '' },
            { name: 'L-Sit Hold', sets: '4 sets x 10-20s', youtubeUrl: '' },
        ]
    }
];

export default function PresetWorkouts({ onPlay }: { onPlay: (preset: any) => void }) {
    const renderIcon = (type: string, className: string) => {
        const props = { size: 18, className };
        switch (type) {
            case 'zap': return <Zap {...props} />;
            case 'dumbbell': return <Dumbbell {...props} />;
            case 'timer': return <Timer {...props} />;
            case 'anchor': return <Anchor {...props} />;
            case 'shield': return <Shield {...props} />;
            case 'crosshair': return <Crosshair {...props} />;
            case 'flame': return <Flame {...props} />;
            case 'heart': return <Heart {...props} />;
            case 'target': return <Target {...props} />;
            case 'activity': return <Activity {...props} />;
            case 'wind': return <Wind {...props} />;
            default: return <Zap {...props} />;
        }
    };

    return (
        <div className="bg-white border border-gray-100 border-gray-200 rounded-3xl p-5 shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 mb-4">Preset Workouts</h3>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {PRESET_WORKOUTS.map((preset, idx) => (
                    <div 
                        key={preset.id} 
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100 transition-all duration-300 shadow-sm hover:bg-gray-100 hover:scale-[1.02] cursor-pointer group"
                        style={{ animationDelay: `${(idx % 5) * 100}ms` }}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${preset.color.split(' ')[0]} shadow-sm border border-white/50 group-hover:scale-110 transition-transform duration-300`}>
                                {renderIcon(preset.iconType, preset.color.split(' ')[1])}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 drop-shadow-sm leading-tight">{preset.title}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[11px] text-gray-500 font-medium">{preset.subtitle}</span>
                                    <span className="text-[10px] text-gray-400">•</span>
                                    <span className="text-[11px] text-gray-500 font-bold">{preset.duration}</span>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => onPlay(preset)}
                            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm btn-press"
                        >
                            <Play size={14} className="ml-0.5" fill="currentColor" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
