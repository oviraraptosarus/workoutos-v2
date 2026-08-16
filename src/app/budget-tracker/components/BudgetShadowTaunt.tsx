'use client';

import React from 'react';
import { useShadowWarRoom } from '@/hooks/useShadowTaunt';
import { useAuth } from '@/contexts/AuthContext';
import { getIncome, getExpenses } from '../services/budgetStorage';
import { Swords, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BudgetShadowTaunt() {
  const { user } = useAuth();
  const { data: warRoomData, isLoading } = useShadowWarRoom('finance');

  const [savingsData, setSavingsData] = React.useState<{ userRate: number; shadowRate: number } | null>(null);

  React.useEffect(() => {
    if (!user) return;
    const month = new Date();
    const monthStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;

    Promise.all([getIncome(monthStr), getExpenses(monthStr)]).then(([income, expenses]) => {
      const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const userRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)) : 0;
      // Shadow always saves 15-25% more than the user
      const shadowRate = Math.min(95, userRate + 15 + Math.floor(Math.random() * 10));
      setSavingsData({ userRate, shadowRate });
    });
  }, [user]);

  if (isLoading) {
    return (
      <div className="w-full rounded-2xl bg-zinc-100 dark:bg-[#050505] border border-zinc-200 dark:border-[#ff453a]/10 p-4 mb-5 animate-pulse h-20" />
    );
  }

  const verdict = warRoomData?.verdict;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full rounded-2xl bg-zinc-100/80 dark:bg-[#050505] border border-[#ff453a]/20 dark:border-[#ff453a]/15 p-4 mb-5 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff453a] blur-[80px] opacity-[0.08] dark:opacity-[0.04] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="flex items-center gap-3 relative z-10">
        <div className="w-7 h-7 rounded-lg bg-[#ff453a]/10 border border-[#ff453a]/15 flex items-center justify-center shrink-0">
          <Swords size={13} className="text-[#ff453a]" />
        </div>

        <div className="flex-1 min-w-0">
          {savingsData ? (
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#ff453a]/80 dark:text-[#ff453a]/60">Shadow Saves</p>
                <p className="text-[13px] font-bold text-[#ff453a]">{savingsData.shadowRate}%</p>
              </div>
              <TrendingDown size={12} className="text-zinc-400 dark:text-white/20" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/30">You Save</p>
                <p className="text-[13px] font-bold text-zinc-700 dark:text-white/60">{savingsData.userRate}%</p>
              </div>
              <div className="flex-1 min-w-0">
                {verdict && (
                  <p className="text-[10px] text-zinc-600 dark:text-white/40 italic truncate">"{verdict}"</p>
                )}
              </div>
            </div>
          ) : verdict ? (
            <p className="text-[11px] text-zinc-700 dark:text-white/60 italic">"{verdict}"</p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
