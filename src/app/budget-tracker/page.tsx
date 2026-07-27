import React from 'react';
import AppLayout from '@/components/AppLayout';
import BudgetHeader from './components/BudgetHeader';
import BudgetSummaryCards from './components/BudgetSummaryCards';
import CategoryBreakdown from './components/CategoryBreakdown';
import SpendPaceChart from './components/SpendPaceChart';
import IncomeTable from './components/IncomeTable';
import ExpenseTable from './components/ExpenseTable';

export default function BudgetTrackerPage() {
    return (
        <AppLayout>
            <div className="space-y-5">
                <BudgetHeader />
                <BudgetSummaryCards />
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    <div className="lg:col-span-3">
                        <SpendPaceChart />
                    </div>
                    <div className="lg:col-span-2">
                        <CategoryBreakdown />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <IncomeTable />
                    <ExpenseTable />
                </div>
            </div>
        </AppLayout>
    );
}