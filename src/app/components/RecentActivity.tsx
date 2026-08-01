'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function RecentActivity() {
    const [activities, setActivities] = useState<any[]>([]);
    const [isClearing, setIsClearing] = useState(false);

    React.useEffect(() => {
        const loadActivities = () => {
            const allActs: any[] = [];
            const now = Date.now();

            // Load Workouts
            try {
                const logs = JSON.parse(localStorage.getItem('workout_os_workout_logs') || '[]');
                logs.forEach((w: any) => allActs.push({ id: w.id, title: `Completed ${w.presetName || 'Workout'}`, time: w.id, icon: '🏋️‍♂️' }));
            } catch (e) {}

            // Load Diet (today only for simplicity)
            try {
                const dateKey = new Date().toISOString().split('T')[0];
                const meals = JSON.parse(localStorage.getItem(`workout_os_diet_meals_${dateKey}`) || '[]');
                meals.forEach((m: any) => allActs.push({ id: m.id, title: `Logged ${m.name}`, time: m.id, icon: m.icon || '🍽️' }));
            } catch (e) {}

            // Load Expenses
            try {
                const expenses = JSON.parse(localStorage.getItem('workout_os_budget_expenses') || '[]');
                expenses.forEach((e: any) => allActs.push({ id: e.id, title: `Spent $${e.amount} on ${e.description}`, time: e.id, icon: '🛒' }));
            } catch (e) {}

            allActs.sort((a, b) => Number(b.id) - Number(a.id));
            
            // Format times
            const formatted = allActs.slice(0, 3).map(act => {
                const diffMs = now - Number(act.id);
                const diffMins = Math.floor(diffMs / 60000);
                const diffHrs = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHrs / 24);
                
                let timeStr = 'Just now';
                if (diffDays > 0) timeStr = `${diffDays}d ago`;
                else if (diffHrs > 0) timeStr = `${diffHrs}h ago`;
                else if (diffMins > 0) timeStr = `${diffMins}m ago`;

                return { ...act, time: timeStr };
            });

            setActivities(formatted);
        };

        loadActivities();
        window.addEventListener('storage', loadActivities);
        return () => window.removeEventListener('storage', loadActivities);
    }, []);

    const handleClear = () => {
        setIsClearing(true);
        // Note: this just hides them from the UI for now
        setTimeout(() => setActivities([]), 300);
    };

    if (activities.length === 0 && !isClearing) return null;

    return (
        <div className={`bg-card-white border border-surface-variant border-surface-variant rounded-3xl p-5 shadow-sm space-y-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${isClearing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="flex items-center justify-between ml-1">
                <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Recent Activity</h3>
                <button 
                    onClick={handleClear}
                    className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant hover:text-rose-500 transition-colors"
                >
                    <Trash2 size={12} /> Clear All
                </button>
            </div>
            <div className="space-y-2">
                {activities.map((act, index) => (
                    <div key={act.id} className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-surface-variant text-xs transition-colors shadow-sm hover:bg-surface-container animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                        <span className="flex items-center gap-2.5 text-on-surface font-bold drop-shadow-sm">
                            <span className="text-base">{act.icon}</span> {act.title}
                        </span>
                        <span className="text-on-surface-variant font-bold">{act.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
