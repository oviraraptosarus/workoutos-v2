'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, UtensilsCrossed, Dumbbell, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuickActionPill() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleAction = (action: 'food' | 'workout' | 'ava') => {
        setIsOpen(false);
        if (action === 'food') {
            router.push('/diet');
        } else if (action === 'workout') {
            router.push('/workout');
        } else if (action === 'ava') {
            window.dispatchEvent(new CustomEvent('open-ai-copilot'));
        }
    };

    return (
        <div className="fixed bottom-24 right-6 z-50 pointer-events-auto">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="absolute bottom-full mb-3 right-0 flex flex-col items-end gap-2"
                    >
                        <ActionButton 
                            icon={<Sparkles size={16} />} 
                            label="Ask Ava" 
                            colorClass="text-purple-500 bg-purple-500/10 hover:bg-purple-500/20"
                            onClick={() => handleAction('ava')}
                            delay={0}
                        />
                        <ActionButton 
                            icon={<UtensilsCrossed size={16} />} 
                            label="Log Meal" 
                            colorClass="text-orange-500 bg-orange-500/10 hover:bg-orange-500/20"
                            onClick={() => handleAction('food')}
                            delay={0.05}
                        />
                        <ActionButton 
                            icon={<Dumbbell size={16} />} 
                            label="Workout" 
                            colorClass="text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
                            onClick={() => handleAction('workout')}
                            delay={0.1}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-full bg-black/90 dark:bg-white/90 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center text-white dark:text-black transition-colors z-50 relative group"
            >
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    <Plus size={24} strokeWidth={2.5} />
                </motion.div>
            </motion.button>
        </div>
    );
}

function ActionButton({ icon, label, colorClass, onClick, delay }: { icon: React.ReactNode, label: string, colorClass: string, onClick: () => void, delay: number }) {
    return (
        <motion.button
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className="flex items-center gap-3 px-5 py-3 rounded-full bg-white/80 dark:bg-[#1a1a1e]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-lg whitespace-nowrap"
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                {icon}
            </div>
            <span className="font-bold text-sm tracking-wide text-on-surface drop-shadow-sm">{label}</span>
        </motion.button>
    );
}
