'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ForgeImpactOverlayProps {
    isVisible: boolean;
    onComplete: () => void;
}

export default function ForgeImpactOverlay({ isVisible, onComplete }: ForgeImpactOverlayProps) {
    const [shards, setShards] = useState<{ id: number; x: number; y: number; rotate: number; scale: number; delay: number }[]>([]);

    useEffect(() => {
        if (isVisible) {
            // Generate 40 random glass shards
            const newShards = Array.from({ length: 40 }).map((_, i) => ({
                id: i,
                x: (Math.random() - 0.5) * window.innerWidth * 1.5,
                y: (Math.random() - 0.5) * window.innerHeight * 1.5,
                rotate: Math.random() * 720 - 360,
                scale: Math.random() * 1.5 + 0.5,
                delay: Math.random() * 0.1
            }));
            setShards(newShards);

            // Auto cleanup after animation finishes
            const timer = setTimeout(() => {
                onComplete();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
                    {/* Darken background */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Massive Flash / Anvil Strike Glow */}
                    <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 5, 0], opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute w-[400px] h-[400px] bg-white rounded-full blur-[100px] mix-blend-overlay"
                    />
                    <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 2, 0], opacity: [0, 1, 0] }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute w-[200px] h-[200px] bg-orange-400 rounded-full blur-[60px] mix-blend-color-dodge"
                    />

                    {/* Impact Text */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 0], y: [50, 0, -20] }}
                        transition={{ duration: 2, ease: "easeOut", times: [0, 0.2, 1] }}
                        className="relative z-10 flex flex-col items-center"
                    >
                        <h1 className="text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] uppercase">
                            Forged
                        </h1>
                        <p className="text-orange-400 font-bold tracking-widest uppercase mt-2 drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]">
                            Workout Logged
                        </p>
                    </motion.div>

                    {/* Glass Shards Explosion */}
                    {shards.map((shard) => (
                        <motion.div
                            key={shard.id}
                            initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
                            animate={{ 
                                x: shard.x, 
                                y: shard.y, 
                                scale: shard.scale, 
                                rotate: shard.rotate,
                                opacity: 0
                            }}
                            transition={{ 
                                duration: 1.2 + Math.random() * 1, 
                                ease: "easeOut",
                                delay: shard.delay 
                            }}
                            className="absolute w-4 h-12 bg-gradient-to-b from-white/80 to-transparent backdrop-blur-sm rounded-full"
                            style={{
                                clipPath: 'polygon(50% 0%, 100% 20%, 80% 100%, 20% 100%, 0% 20%)',
                                boxShadow: '0 0 20px rgba(255,255,255,0.5)'
                            }}
                        />
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
}
