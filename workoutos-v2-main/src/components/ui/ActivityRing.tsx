import React from 'react';

interface ActivityRingProps {
  moveProgress: number; // 0 to 1
  exerciseProgress: number; // 0 to 1
  standProgress: number; // 0 to 1
  size?: number;
}

export function ActivityRing({
  moveProgress,
  exerciseProgress,
  standProgress,
  size = 160
}: ActivityRingProps) {
  // SVG paths calculate dash array based on progress
  const getDashArray = (radius: number, progress: number) => {
    const circumference = 2 * Math.PI * radius;
    return `${Math.min(progress, 1) * circumference} ${circumference}`;
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Move Ring */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-container" />
        <circle 
          cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" 
          className="text-activity-red transition-all duration-1000 ease-out"
          strokeDasharray={getDashArray(45, moveProgress)} 
        />
        
        {/* Exercise Ring */}
        <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-container" />
        <circle 
          cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" 
          className="text-activity-green transition-all duration-1000 ease-out delay-150"
          strokeDasharray={getDashArray(35, exerciseProgress)} 
        />
        
        {/* Stand Ring */}
        <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-container" />
        <circle 
          cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" 
          className="text-activity-blue transition-all duration-1000 ease-out delay-300"
          strokeDasharray={getDashArray(25, standProgress)} 
        />
      </svg>
    </div>
  );
}
