'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function RecentActivity() {
    const [activities, setActivities] = useState([
        { id: 1, title: 'Completed Push Workout', time: '2 hours ago', icon: '🏋️‍♂️' },
        { id: 2, title: 'Logged 500ml Water', time: '3 hours ago', icon: '💧' },
        { id: 3, title: 'Spent ₹1250 at Grocery', time: '5 hours ago', icon: '🛒' },
    ]);
    const [isClearing, setIsClearing] = useState(false);

    const handleClear = () => {
        setIsClearing(true);
        setTimeout(() => setActivities([]), 300);
    };

    if (activities.length === 0) return null;

    return (
        <div className={`bg-white border border-gray-100 border-gray-200 rounded-3xl p-5 shadow-sm space-y-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${isClearing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="flex items-center justify-between ml-1">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Recent Activity</h3>
                <button 
                    onClick={handleClear}
                    className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-rose-500 transition-colors"
                >
                    <Trash2 size={12} /> Clear All
                </button>
            </div>
            <div className="space-y-2">
                {activities.map((act, index) => (
                    <div key={act.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs transition-colors shadow-sm hover:bg-gray-100 animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                        <span className="flex items-center gap-2.5 text-gray-900 font-bold drop-shadow-sm">
                            <span className="text-base">{act.icon}</span> {act.title}
                        </span>
                        <span className="text-gray-600 font-bold">{act.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
