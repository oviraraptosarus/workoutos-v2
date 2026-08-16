'use client';

import React from 'react';
import { useShadowTaunt } from '@/hooks/useShadowTaunt';
import ShadowTauntCard from '@/app/components/ShadowTauntCard';

export default function WorkoutShadowTaunt() {
  const { taunt, isLoading } = useShadowTaunt("Physical Training & Discipline", {
    recentActivity: "Viewing their workout splits."
  });

  return (
    <div className="mt-4">
        <ShadowTauntCard taunt={taunt} domain="Physical Dominance" isLoading={isLoading} />
    </div>
  );
}
