import React from 'react';
import clsx from 'clsx';

interface SparklineProps {
  color?: string; // Tailwind color variable name like "activity-blue" or hex code
  className?: string;
  points?: { x: number; y: number }[];
}

export function Sparkline({ color = "#3B82F6", className, points }: SparklineProps) {
  // If points are not provided, we draw a generic curve as placeholder
  return (
    <div className={clsx("w-full h-32 pt-2", className)}>
      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 100">
        <defs>
          <linearGradient id={`chartGradient-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.1"></stop>
            <stop offset="100%" stopColor={color} stopOpacity="0"></stop>
          </linearGradient>
        </defs>
        
        {/* Area */}
        <path d="M0,40 Q50,30 100,50 T200,20 T300,35 V100 H0 Z" fill={`url(#chartGradient-${color.replace('#', '')})`}></path>
        
        {/* Line */}
        <path d="M0,40 Q50,30 100,50 T200,20 T300,35" fill="none" stroke={color} strokeLinecap="round" strokeWidth="3"></path>
        
        {/* Points */}
        <circle cx="100" cy="50" fill="white" r="4" stroke={color} strokeWidth="2"></circle>
        <circle cx="200" cy="20" fill="white" r="4" stroke={color} strokeWidth="2"></circle>
        <circle cx="300" cy="35" fill={color} r="5"></circle>
      </svg>
    </div>
  );
}
