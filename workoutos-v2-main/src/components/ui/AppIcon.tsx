'use client';

import React from 'react';
import * as Icons from 'lucide-react';

interface AppIconProps {
    name: keyof typeof Icons;
    size?: number;
    className?: string;
}

export default function AppIcon({ name, size = 20, className = '' }: AppIconProps) {
    const IconComponent = (Icons[name] as React.ComponentType<{ size?: number; className?: string }>) || Icons.HelpCircle;
    return <IconComponent size={size} className={className} />;
}
