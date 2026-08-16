import React from 'react';
import clsx from 'clsx';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function BentoCard({ children, className, noPadding = false }: BentoCardProps) {
  return (
    <div 
      className={clsx(
        "bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden",
        !noPadding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
