'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardWidgetConfig {
    id: string;
    visible: boolean;
}

const WIDGET_NAMES: Record<string, string> = {
    'BentoGrid': 'Daily Activity Stats',
    'TouchGrassNudge': 'Health Nudge',
    'WeightLogCard': 'Weight Tracker',
    'TimeProgressWidget': 'Time Progress',
    'QuickNotes': 'Quick Notes',
    'DashboardTasks': 'Daily Tasks',
    'DashboardCountdowns': 'Countdowns'
};

const DEFAULT_LAYOUT: DashboardWidgetConfig[] = [
    { id: 'BentoGrid', visible: true },
    { id: 'TouchGrassNudge', visible: true },
    { id: 'WeightLogCard', visible: true },
    { id: 'TimeProgressWidget', visible: true },
    { id: 'QuickNotes', visible: true },
    { id: 'DashboardTasks', visible: true },
    { id: 'DashboardCountdowns', visible: true }
];

interface DashboardEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newLayout: DashboardWidgetConfig[]) => void;
}

export default function DashboardEditModal({ isOpen, onClose, onSave }: DashboardEditModalProps) {
    const { userProfile } = useAuth();
    const [layout, setLayout] = useState<DashboardWidgetConfig[]>(DEFAULT_LAYOUT);

    useEffect(() => {
        if (isOpen) {
            if (userProfile?.dashboard_config && Array.isArray(userProfile.dashboard_config) && userProfile.dashboard_config.length > 0) {
                // Merge with default to ensure all widgets are present
                const saved = userProfile.dashboard_config as DashboardWidgetConfig[];
                const merged = [...saved];
                
                // Add any missing new widgets
                DEFAULT_LAYOUT.forEach(defaultW => {
                    if (!merged.find(w => w.id === defaultW.id)) {
                        merged.push(defaultW);
                    }
                });
                
                setLayout(merged);
            } else {
                setLayout(DEFAULT_LAYOUT);
            }
        }
    }, [isOpen, userProfile]);

    if (!isOpen) return null;

    const toggleVisibility = (index: number) => {
        const newLayout = [...layout];
        newLayout[index].visible = !newLayout[index].visible;
        setLayout(newLayout);
    };

    const moveWidget = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index > 0) {
            const newLayout = [...layout];
            const temp = newLayout[index];
            newLayout[index] = newLayout[index - 1];
            newLayout[index - 1] = temp;
            setLayout(newLayout);
        } else if (direction === 'down' && index < layout.length - 1) {
            const newLayout = [...layout];
            const temp = newLayout[index];
            newLayout[index] = newLayout[index + 1];
            newLayout[index + 1] = temp;
            setLayout(newLayout);
        }
    };

    const handleSave = () => {
        onSave(layout);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-surface-container-lowest border border-white/10 rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
                
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-surface-container-lowest sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-bold text-on-surface">Edit Layout</h3>
                        <p className="text-xs text-on-surface-variant mt-1">Customize your Dashboard</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar flex-1">
                    {layout.map((widget, index) => (
                        <div 
                            key={widget.id}
                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                                widget.visible 
                                    ? 'bg-surface-container/50 border-white/10' 
                                    : 'bg-black/20 border-transparent opacity-60'
                            }`}
                        >
                            {/* Toggle Button (iOS Wiggle style add/remove) */}
                            <button 
                                onClick={() => toggleVisibility(index)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                    widget.visible 
                                        ? 'bg-rose-500 text-white' 
                                        : 'bg-emerald-500 text-white'
                                }`}
                            >
                                {widget.visible ? <Minus size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                            </button>

                            <div className="flex-1 font-semibold text-sm text-on-surface">
                                {WIDGET_NAMES[widget.id] || widget.id}
                            </div>

                            {/* Reorder Controls */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button 
                                    onClick={() => moveWidget(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-white/10 hover:text-on-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                >
                                    <ArrowUp size={16} />
                                </button>
                                <button 
                                    onClick={() => moveWidget(index, 'down')}
                                    disabled={index === layout.length - 1}
                                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-white/10 hover:text-on-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                >
                                    <ArrowDown size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-white/10 bg-surface-container-lowest sticky bottom-0 z-10 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-full font-bold text-sm bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 py-3.5 rounded-full font-bold text-sm bg-[#0a84ff] text-white hover:bg-[#0a84ff]/90 transition-colors shadow-lg shadow-[#0a84ff]/20"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
