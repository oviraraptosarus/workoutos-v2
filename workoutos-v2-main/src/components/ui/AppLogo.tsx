'use client';

import React from 'react';
import Image from 'next/image';

interface AppLogoProps {
    size?: number;
    className?: string;
}

export default function AppLogo({ size = 34, className = '' }: AppLogoProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div 
                className="rounded-xl overflow-hidden flex items-center justify-center shadow-sm flex-shrink-0 border border-stone-200/20 bg-black"
                style={{ width: size, height: size }}
            >
                <Image 
                    src="/logo.png" 
                    alt="Workout OS Logo" 
                    width={size} 
                    height={size}
                    className="w-full h-full object-cover"
                />
            </div>
        </div>
    );
}
