'use client';

import React from 'react';
import { X } from 'lucide-react';

interface LogWorkoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LogWorkoutModal({ isOpen, onClose }: LogWorkoutModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card-white/95 backdrop-blur-2xl border border-surface-variant dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-surface-variant ">
                    <h2 className="text-lg font-bold text-on-surface dark:text-white">Log workout</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors btn-press"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Form */}
                <form className="p-5 space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
                    <div>
                        <label className="block text-[13px] font-semibold text-on-surface mb-1.5">Session type</label>
                        <select
                            className="w-full bg-[#f5ebd7]/40 border border-transparent rounded-xl px-4 h-12 text-sm text-on-surface focus:outline-none focus:border-surface-variant focus:bg-[#f5ebd7]/60 transition-colors font-medium font-sans appearance-none"
                            defaultValue=""
                        >
                            <option value="" disabled>Select activity...</option>
                            <optgroup label="Strength">
                                <option value="Weightlifting">Weightlifting / Free Weights</option>
                                <option value="Upper Body">Upper Body</option>
                                <option value="Lower Body">Lower Body</option>
                            </optgroup>
                            <optgroup label="Cardio">
                                <option value="Walking">Walking</option>
                                <option value="Running">Running / Jogging</option>
                                <option value="Stationary Bike">Stationary Bike</option>
                                <option value="Cycling">Outdoor Cycling</option>
                                <option value="Swimming">Swimming</option>
                                <option value="Elliptical">Elliptical</option>
                            </optgroup>
                            <optgroup label="Flexibility & Other">
                                <option value="Yoga">Yoga</option>
                                <option value="Pilates">Pilates</option>
                                <option value="Stretching">Stretching / Mobility</option>
                            </optgroup>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-on-surface mb-1.5">Duration (min)</label>
                        <input
                            type="number"
                            placeholder="45"
                            className="w-full bg-[#f5ebd7]/40 border border-transparent rounded-xl px-4 h-12 text-sm text-on-surface focus:outline-none focus:border-surface-variant focus:bg-[#f5ebd7]/60 transition-colors placeholder:text-on-surface-variant font-medium"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full bg-[#1f4e38] hover:bg-[#163a2a] text-white font-bold h-12 rounded-xl transition-colors text-[15px] shadow-sm btn-press"
                        >
                            Log workout
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
