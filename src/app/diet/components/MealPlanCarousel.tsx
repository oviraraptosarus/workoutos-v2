'use client';

import React from 'react';
import { Sun, SunDim, Moon, Apple, Check, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
    const { t } = useLanguage();
    const plans: PlanItem[] = [
        {
            id: '1',
            type: 'Morning',
            title: 'Eggs & Toast',
            imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&auto=format&fit=crop&q=80',
            icon: <Sun className="w-5 h-5 text-white" />,
            completed: true,
        },
        {
            id: '2',
            type: 'Lunch',
            title: 'Quinoa & Edamame Bowl',
            imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80',
            icon: <SunDim className="w-5 h-5 text-white" />,
        },
        {
            id: '3',
            type: 'Dinner',
            title: 'Broccoli & Curry Dish',
            imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80',
            icon: <Moon className="w-5 h-5 text-white" />,
        },
        {
            id: '4',
            type: 'Snack',
            title: 'Protein Oat Bites',
            imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=300&auto=format&fit=crop&q=80',
            icon: <Apple className="w-5 h-5 text-white" />,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-end justify-between px-2">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-on-surface">5-Day Nutrition Programs</h2>
                    <span className="text-xs font-medium text-on-surface-variant uppercase tracking-widest">{t('diet.mealplan')}</span>
                </div>
                <button
                    id="tour-see-details"
                    onClick={onOpenDetails}
                    className="text-xs font-semibold text-primary hover:text-primary-fixed-variant uppercase tracking-widest flex items-center gap-1 transition-colors group relative z-[110]"
                >
                    {t('diet.details')} <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {plans.map((item) => (
                    <div
                        key={item.id}
                        onClick={onOpenDetails}
                        className="group cursor-pointer relative w-full aspect-[4/5] rounded-[32px] overflow-hidden bg-surface-container shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:shadow-[0_24px_48px_rgba(0,0,0,0.2)] transition-all duration-500 transform hover:-translate-y-1"
                        title="Click to view complete 5-day recipe plan"
                    >
                        {/* Background Image with Zoom on Hover */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                        />
                        
                        {/* Dark Gradient Overlay for Text Legibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Top Icon Area */}
                        <div className="absolute top-4 left-4 p-2 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 group-hover:bg-white/20 transition-colors">
                            {item.icon}
                        </div>

                        {item.completed && (
                            <div className="absolute top-4 right-4 p-1.5 rounded-full bg-emerald-500 text-white shadow-lg">
                                <Check size={14} strokeWidth={3} />
                            </div>
                        )}

                        {/* Bottom Text Area */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                            <h3 className="text-white font-semibold text-base leading-tight mb-1 drop-shadow-md">
                                {item.title}
                            </h3>
                            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest drop-shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                {item.type}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
