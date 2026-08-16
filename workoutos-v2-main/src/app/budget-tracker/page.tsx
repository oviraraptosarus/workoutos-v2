'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import BudgetHeader from './components/BudgetHeader';
import BudgetSummaryCards from './components/BudgetSummaryCards';
import CategoryBreakdown from './components/CategoryBreakdown';
import SpendPaceChart from './components/SpendPaceChart';
import IncomeTable from './components/IncomeTable';
import ExpenseTable from './components/ExpenseTable';
import FinancialReminders from './components/FinancialReminders';
import { useAuth } from '@/contexts/AuthContext';

import { BudgetProvider } from './contexts/BudgetContext';

export default function BudgetTrackerPage() {
    const { userProfile } = useAuth();
    
    return (
        <AppLayout>
            <BudgetProvider>
                <div className="space-y-5">
                    <BudgetHeader />
                    <BudgetSummaryCards />
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        <div className="lg:col-span-3">
                            <SpendPaceChart />
                        </div>
                        <div className="lg:col-span-2 space-y-5">
                            <CategoryBreakdown />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                            <IncomeTable />
                            <ExpenseTable />
                        </div>
                        <div className="lg:col-span-1">
                            {userProfile?.enableFinancialReminders !== false && (
                                <FinancialReminders />
                            )}
                        </div>
                    </div>
                </div>
            </BudgetProvider>
        </AppLayout>
    );
}