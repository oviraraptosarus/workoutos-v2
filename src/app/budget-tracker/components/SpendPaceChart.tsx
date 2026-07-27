'use client';

import React from 'react';

export default function SpendPaceChart() {
    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 h-full flex flex-col justify-between rounded-3xl shadow-sm transition-colors">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight mb-1">Weekly spend pace</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Cumulative spend vs. budget pace</p>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-[#8b5cf6] dark:bg-purple-400" />
                        <span>Actual</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0 border-t border-dashed border-gray-400 dark:border-gray-500" />
                        <span>Budget pace</span>
                    </div>
                </div>
            </div>

            <div className="relative w-full h-[200px] mt-4">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-gray-400 dark:text-gray-500 font-medium pb-5">
                    <span>₹2800</span>
                    <span>₹2100</span>
                    <span>₹1400</span>
                    <span>₹700</span>
                    <span>₹0</span>
                </div>

                {/* Grid lines */}
                <div className="absolute left-10 right-0 top-0 h-full flex flex-col justify-between pb-5">
                    <div className="border-t border-dashed border-gray-100 dark:border-slate-800 w-full"></div>
                    <div className="border-t border-dashed border-gray-100 dark:border-slate-800 w-full"></div>
                    <div className="border-t border-dashed border-gray-100 dark:border-slate-800 w-full"></div>
                    <div className="border-t border-dashed border-gray-100 dark:border-slate-800 w-full"></div>
                    <div className="border-t border-gray-200 dark:border-slate-700 w-full"></div>
                </div>

                {/* Chart Lines (SVG) */}
                <svg className="absolute left-10 right-0 top-0 w-[calc(100%-40px)] h-[calc(100%-20px)] overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    {/* Fill Gradient for actual */}
                    <defs>
                        <linearGradient id="purpleGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" className="dark:stop-opacity-[0.5]" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d="M 0,100 Q 30,85 50,60 T 100,45 L 100,100 Z" fill="url(#purpleGradient)" />
                    {/* Budget Pace (Dashed) */}
                    <path d="M 0,100 L 100,10" fill="none" stroke="#9ca3af" strokeWidth="0.75" strokeDasharray="2,2" />
                    {/* Actual Pace (Solid) */}
                    <path d="M 0,100 Q 30,85 50,60 T 100,45" fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
                </svg>

                {/* X-axis labels */}
                <div className="absolute left-10 right-0 bottom-0 flex justify-between text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                    <span>Jul 1</span>
                    <span>Jul 10</span>
                    <span>Jul 19</span>
                    <span>Jul 28</span>
                </div>
            </div>
        </div>
    );
}
