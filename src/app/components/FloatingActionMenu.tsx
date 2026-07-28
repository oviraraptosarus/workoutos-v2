'use client';

import React, { useState } from 'react';
import { Plus, X, Moon, Droplet, Dumbbell, Apple, Wallet, ArrowRight, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import LogExpenseModal from './modals/LogExpenseModal';
import LogWorkoutModal from './modals/LogWorkoutModal';
import LogMealModal from './modals/LogMealModal';
import LogWaterModal from './modals/LogWaterModal';
import LogSleepModal from './modals/LogSleepModal';

export default function FloatingActionMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const router = useRouter();

    const openModal = (modalName: string) => {
        setActiveModal(modalName);
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-28 right-5 sm:bottom-6 sm:right-8 z-50 flex flex-col items-end">
            {/* The expanded menu */}
            <div 
                className={`flex flex-col items-end gap-3 mb-4 transition-all duration-300 origin-bottom ${
                    isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-10 pointer-events-none'
                }`}
            >
                {/* Details Button */}
                <button className="bg-[#f3e8ff] hover:bg-[#e9d5ff] text-[#7e22ce] text-[13px] font-medium px-4 py-1.5 rounded-full shadow-sm flex items-center gap-1 transition-colors">
                    Details <ArrowRight size={14} />
                </button>

                {/* Sleep */}
                <button 
                    onClick={() => openModal('sleep')}
                    className="bg-white hover:bg-gray-50 text-gray-900 text-[15px] font-medium px-4 py-2.5 rounded-full shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] flex items-center gap-3 transition-colors border border-gray-100 dark:border-slate-800"
                >
                    <div className="w-8 h-8 rounded-full bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center">
                        <Moon size={16} />
                    </div>
                    <span className="pr-2">Sleep</span>
                </button>

                {/* Water */}
                <button 
                    onClick={() => openModal('water')}
                    className="bg-white hover:bg-gray-50 text-gray-900 text-[15px] font-medium px-4 py-2.5 rounded-full shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] flex items-center gap-3 transition-colors border border-gray-100 dark:border-slate-800"
                >
                    <div className="w-8 h-8 rounded-full bg-[#f0fdfa] text-[#0ea5e9] flex items-center justify-center">
                        <Droplet size={16} />
                    </div>
                    <span className="pr-2">Water</span>
                </button>

                {/* Workout */}
                <button 
                    onClick={() => openModal('workout')}
                    className="bg-white hover:bg-gray-50 text-gray-900 text-[15px] font-medium px-4 py-2.5 rounded-full shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] flex items-center gap-3 transition-colors border border-gray-100 dark:border-slate-800"
                >
                    <div className="w-8 h-8 rounded-full bg-[#f0fdf4] text-[#16a34a] flex items-center justify-center">
                        <Dumbbell size={16} />
                    </div>
                    <span className="pr-2">Workout</span>
                </button>

                {/* Meal */}
                <button 
                    onClick={() => openModal('meal')}
                    className="bg-white hover:bg-gray-50 text-gray-900 text-[15px] font-medium px-4 py-2.5 rounded-full shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] flex items-center gap-3 transition-colors border border-gray-100 dark:border-slate-800"
                >
                    <div className="w-8 h-8 rounded-full bg-[#fff7ed] text-[#f97316] flex items-center justify-center">
                        <Apple size={16} />
                    </div>
                    <span className="pr-2">Meal</span>
                </button>

                {/* Expense */}
                <button 
                    onClick={() => openModal('expense')}
                    className="bg-white hover:bg-gray-50 text-gray-900 text-[15px] font-medium px-4 py-2.5 rounded-full shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] flex items-center gap-3 transition-colors border border-gray-100 dark:border-slate-800"
                >
                    <div className="w-8 h-8 rounded-full bg-[#f5f3ff] text-[#8b5cf6] flex items-center justify-center">
                        <Wallet size={16} />
                    </div>
                    <span className="pr-2">Expense</span>
                </button>

                {/* Progress Photo */}
                <button 
                    onClick={() => {
                        setIsOpen(false);
                        router.push('/progress');
                    }}
                    className="bg-white hover:bg-gray-50 text-gray-900 text-[15px] font-medium px-4 py-2.5 rounded-full shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] flex items-center gap-3 transition-colors border border-gray-100 dark:border-slate-800"
                >
                    <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center">
                        <Camera size={16} />
                    </div>
                    <span className="pr-2">Progress</span>
                </button>
            </div>

            {/* Main FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 active:scale-95 btn-press ${
                    isOpen ? 'bg-[#2e8555] rotate-90 text-white' : 'bg-[#1f4e38] text-white hover:bg-[#163a2a]'
                }`}
                aria-label={isOpen ? 'Close menu' : 'Quick Add Log'}
            >
                {isOpen ? <X size={28} strokeWidth={2.5} /> : <Plus size={28} strokeWidth={2.5} />}
            </button>
            
            {/* Background Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/5 z-[-1]" 
                    onClick={() => setIsOpen(false)} 
                    aria-hidden="true" 
                />
            )}

            {/* Modals */}
            <LogExpenseModal isOpen={activeModal === 'expense'} onClose={() => setActiveModal(null)} />
            <LogWorkoutModal isOpen={activeModal === 'workout'} onClose={() => setActiveModal(null)} />
            <LogMealModal isOpen={activeModal === 'meal'} onClose={() => setActiveModal(null)} />
            <LogWaterModal isOpen={activeModal === 'water'} onClose={() => setActiveModal(null)} />
            <LogSleepModal isOpen={activeModal === 'sleep'} onClose={() => setActiveModal(null)} />
        </div>
    );
}
