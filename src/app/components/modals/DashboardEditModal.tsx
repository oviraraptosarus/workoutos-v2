'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRewardSystem } from '@/lib/hooks/useRewardSystem';

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
    'DashboardCountdowns': 'Countdowns',
    'VaultWidget': 'Content Vault'
};

const DEFAULT_LAYOUT: DashboardWidgetConfig[] = [
    { id: 'BentoGrid', visible: true },
    { id: 'TouchGrassNudge', visible: true },
    { id: 'WeightLogCard', visible: true },
    { id: 'TimeProgressWidget', visible: true },
    { id: 'QuickNotes', visible: true },
    { id: 'DashboardTasks', visible: true },
    { id: 'DashboardCountdowns', visible: true },
    { id: 'VaultWidget', visible: true }
];

interface DashboardEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newLayout: DashboardWidgetConfig[]) => void;
}

export default function DashboardEditModal({ isOpen, onClose, onSave }: DashboardEditModalProps) {
    const { userProfile } = useAuth();
    const { triggerTap, triggerPop, triggerSuccess } = useRewardSystem();
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
        triggerTap();
        const newLayout = [...layout];
        newLayout[index].visible = !newLayout[index].visible;
        setLayout(newLayout);
    };

    const moveWidget = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index > 0) {
            triggerPop();
            const newLayout = [...layout];
            const temp = newLayout[index];
            newLayout[index] = newLayout[index - 1];
            newLayout[index - 1] = temp;
            setLayout(newLayout);
        } else if (direction === 'down' && index < layout.length - 1) {
            triggerPop();
            const newLayout = [...layout];
            const temp = newLayout[index];
            newLayout[index] = newLayout[index + 1];
            newLayout[index + 1] = temp;
            setLayout(newLayout);
        }
    };

    const handleSave = () => {
        triggerSuccess();
        onSave(layout);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-sm bg-surface-container-lowest border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
                
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-surface-container-lowest sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-on-surface">Edit Layout</h3>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">Customize your Dashboard</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto space-y-2 custom-scrollbar flex-1">
                    {layout.map((widget, index) => (
                        <div 
                            key={widget.id}
                            className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-[1rem] border transition-all ${
                                widget.visible 
                                    ? 'bg-surface-container/50 border-white/10' 
                                    : 'bg-black/20 border-transparent opacity-60'
                            }`}
                        >
                            {/* Toggle Button (iOS Wiggle style add/remove) */}
                            <button 
                                onClick={() => toggleVisibility(index)}
                                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                    widget.visible 
                                        ? 'bg-rose-500 text-white' 
                                        : 'bg-emerald-500 text-white'
                                }`}
                            >
                                {widget.visible ? <Minus size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={3} />}
                            </button>

                            <div className="flex-1 font-semibold text-sm text-on-surface">
                                {WIDGET_NAMES[widget.id] || widget.id}
                            </div>

                            {/* Reorder Controls */}
                            <div className="flex items-center shrink-0">
                                <button 
                                    onClick={() => moveWidget(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1.5 rounded-md text-on-surface-variant hover:bg-white/10 hover:text-on-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                >
                                    <ArrowUp size={14} />
                                </button>
                                <button 
                                    onClick={() => moveWidget(index, 'down')}
                                    disabled={index === layout.length - 1}
                                    className="p-1.5 rounded-md text-on-surface-variant hover:bg-white/10 hover:text-on-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                >
                                    <ArrowDown size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-white/10 bg-surface-container-lowest sticky bottom-0 z-10 flex gap-2">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-2xl font-bold text-[13px] bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 py-2.5 rounded-2xl font-bold text-[13px] bg-[#0a84ff] text-white hover:bg-[#0a84ff]/90 transition-colors shadow-lg shadow-[#0a84ff]/20"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
