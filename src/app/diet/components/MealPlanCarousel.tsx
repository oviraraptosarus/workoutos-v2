'use client';

import React from 'react';
import { Sun, SunDim, Moon, Apple, Check, ChevronRight } from 'lucide-react';

interface MealPlanCarouselProps {
    onOpenDetails?: () => void;
}

interface PlanItem {
    id: string;
    type: 'Morning' | 'Lunch' | 'Dinner' | 'Snack';
    title: string;
    imageUrl: string;
    icon: React.ReactNode;
    completed?: boolean;
}

export default function MealPlanCarousel({ onOpenDetails }: MealPlanCarouselProps) {
    const plans: PlanItem[] = [
        {
            id: '1',
            type: 'Morning',
            title: 'Eggs & Toast',
            imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&auto=format&fit=crop&q=80',
            icon: <Sun className="w-5 h-5 text-amber-500" />,
            completed: true,
        },
        {
            id: '2',
            type: 'Lunch',
            title: 'Quinoa & Edamame Bowl',
            imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80',
            icon: <SunDim className="w-5 h-5 text-orange-500" />,
        },
        {
            id: '3',
            type: 'Dinner',
            title: 'Broccoli & Curry Dish',
            imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80',
            icon: <Moon className="w-5 h-5 text-indigo-500" />,
        },
        {
            id: '4',
            type: 'Snack',
            title: 'Protein Oat Bites',
            imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=300&auto=format&fit=crop&q=80',
            icon: <Apple className="w-5 h-5 text-emerald-500" />,
        },
    ];

    return (
        <div className="bg-white border border-gray-100 border-gray-200 rounded-3xl p-5 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">YOUR MEAL PLAN</span>
                <button
                    id="tour-see-details"
                    onClick={onOpenDetails}
                    className="text-xs font-black text-cyan-600 hover:text-cyan-700 uppercase tracking-wider flex items-center gap-0.5 btn-press transition-colors group relative z-[110]"
                >
                    SEE DETAILS <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
            
            <h2 className="text-lg font-black text-gray-900 mb-4 tracking-tight">5-Day Getting Started</h2>

            <div className="grid grid-cols-4 gap-3 sm:gap-4">
                {plans.map((item) => (
                    <div
                        key={item.id}
                        onClick={onOpenDetails}
                        className="flex flex-col items-center group cursor-pointer"
                        title="Click to view complete 5-day recipe plan"
                    >
                        {/* Icon above image */}
                        <div className="mb-2 p-1.5 rounded-full bg-gray-100 border border-gray-200 shadow-sm group-hover:scale-110 transition-transform">
                            {item.icon}
                        </div>
                        {/* Thumbnail image container */}
                        <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-gray-200 shadow-sm group-hover:shadow-md transition-all">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {item.completed && (
                                <div className="absolute inset-0 bg-emerald-900/30 backdrop-blur-[1px] flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
