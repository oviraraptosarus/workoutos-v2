'use client';

import React from 'react';
import { X } from 'lucide-react';

interface LogMealModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LogMealModal({ isOpen, onClose }: LogMealModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-lg overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Log meal</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors btn-press"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Form */}
                <form className="p-5 space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
                    <div>
                        <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">Meal description</label>
                        <input
                            type="text"
                            placeholder="e.g. Oatmeal with berries"
                            className="w-full bg-[#f5ebd7]/40 border border-transparent rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-300 focus:bg-[#f5ebd7]/60 transition-colors placeholder:text-gray-400 font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">Calories</label>
                            <input
                                type="number"
                                placeholder="350"
                                className="w-full bg-[#f5ebd7]/40 border border-transparent rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-300 focus:bg-[#f5ebd7]/60 transition-colors placeholder:text-gray-400 font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">Protein (g)</label>
                            <input
                                type="number"
                                placeholder="25"
                                className="w-full bg-[#f5ebd7]/40 border border-transparent rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-300 focus:bg-[#f5ebd7]/60 transition-colors placeholder:text-gray-400 font-medium"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full bg-[#1f4e38] hover:bg-[#163a2a] text-white font-bold py-3.5 rounded-2xl transition-colors text-[15px] shadow-sm btn-press"
                        >
                            Log meal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
