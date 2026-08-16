'use client';

import React from 'react';
import { useShadowTaunt } from '@/hooks/useShadowTaunt';
import ShadowTauntCard from '@/app/components/ShadowTauntCard';

export default function BudgetShadowTaunt() {
  const { taunt, isLoading } = useShadowTaunt("Finance & Budgeting", {
    recentActivity: "Viewing their budget dashboard."
  });

  return (
    <ShadowTauntCard taunt={taunt} domain="Financial Discipline" isLoading={isLoading} />
  );
}
