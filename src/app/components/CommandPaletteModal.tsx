'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Command, HelpCircle, Utensils, Dumbbell, Droplet, Sparkles, FileJson, BookOpen, Settings, Moon, DollarSign, ChevronRight, HelpCircle as HelpIcon } from 'lucide-react';


interface CommandPaletteModalProps {
    isOpen?: boolean;
    onClose?: () => void;
}

interface NavCommand {
    id: string;
    title: string;
    description: string;
    category: 'Navigation' | 'Actions' | 'Help';
    icon: React.ReactNode;
    href?: string;
    action?: () => void;
}

const FAQ_ITEMS = [
    {
        q: 'What are Bites / Points?',
        a: 'Bites (or points) is a simplified calorie-tracking unit where 1 Bite ≈ 50 kcal. For example, 1 slice of bread = 4 Bites, 1 egg = 2 Bites. It lets you estimate food portions without keeping track of 4-digit numbers.',
    },
    {
        q: 'How does AI Voice & Natural Text Logging work?',
        a: 'Open the AI Logger (via the Sparkles icon or Ctrl+K), and type or dictate plain English like "2 eggs, avocado toast, and 500ml water". AI automatically parses food, macros, water, and notes.',
    },
    {
        q: 'How do I export or backup my account data?',
        a: 'Go to Settings -> Import / Export tab -> click "Export Account Configuration (.json)". This downloads your complete profile, macros, diet meals, and logs as a JSON file.',
    },
    {
        q: 'How do I set custom daily macro targets?',
        a: 'On the Diet page, click the Settings (gear/slider) icon at the top right of the Macro Rings card to customize your target Calories, Protein, Carbs, Fat, and Sugar.',
    },
    {
        q: 'How do I view the 5-Day Meal Plan recipes?',
        a: 'Click "SEE DETAILS >" on the "YOUR MEAL PLAN" card on the Diet page to browse complete 5-day recipes, ingredient lists, and prep steps.',
    },
];

export default function CommandPaletteModal() {

    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'commands' | 'help'>('commands');

    // Global Ctrl+K / Cmd+K keyboard shortcut listener
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-command-palette', handleOpen);

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('open-command-palette', handleOpen);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const commands: NavCommand[] = [
        {
            id: 'nav-diet',
            title: 'Diet & Nutrition Tracker',
            description: 'Track meals, macros, calories, bites & hydration',
            category: 'Navigation',
            icon: <Utensils className="w-5 h-5 text-white" />,
            href: '/diet',
        },
        {
            id: 'nav-workout',
            title: 'Workout Tracker & Today\'s Split',
            description: 'Log workout sets, reps, active timers & splits',
            category: 'Navigation',
            icon: <Dumbbell className="w-5 h-5 text-white" />,
            href: '/workout',
        },
        {
            id: 'nav-planner',
            title: 'Weekly Workout Planner',
            description: 'Customize weekly exercise schedules & routines',
            category: 'Navigation',
            icon: <BookOpen className="w-5 h-5 text-white" />,
            href: '/planner',
        },
        {
            id: 'nav-budget',
            title: 'Budget & Expense Tracker',
            description: 'Track daily expenses and financial goals',
            category: 'Navigation',
            icon: <DollarSign className="w-5 h-5 text-white" />,
            href: '/budget-tracker',
        },
        {
            id: 'nav-sleep',
            title: 'Sleep Tracker',
            description: 'Log sleep duration and quality scores',
            category: 'Navigation',
            icon: <Moon className="w-5 h-5 text-white" />,
            href: '/sleep',
        },
    ];

    const filteredCommands = commands.filter(
        (c) =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFaqs = FAQ_ITEMS.filter(
        (f) =>
            f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.a.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectCommand = (cmd: NavCommand) => {
        setIsOpen(false);
        if (cmd.href) {
            router.push(cmd.href);
        } else if (cmd.action) {
            cmd.action();
        }
    };

    return (
        <>
            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-card-white/95 backdrop-blur-md rounded-3xl w-full max-w-xl shadow-[0_20px_60px_0_rgba(0,0,0,0.3)] border border-surface-variant overflow-hidden flex flex-col max-h-[85vh]">
                        
                        {/* Search Input Bar */}
                        <div className="px-5 py-4 border-b border-surface-variant flex items-center gap-3 bg-surface-container-low/80">
                            <Search size={20} className="text-on-surface-variant dark:text-on-surface-variant" />
                            <input
                                type="text"
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search sections, features, or help topics (Ctrl+K)..."
                                className="w-full bg-transparent text-sm font-bold text-on-surface placeholder:text-on-surface-variant focus:outline-none"
                            />
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-full hover:bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface-variant transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Tabs Bar */}
                        <div className="px-5 py-2.5 bg-card-white border-b border-surface-variant flex items-center gap-2">
                            <button
                                onClick={() => setActiveTab('commands')}
                                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all border ${
                                    activeTab === 'commands'
                                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                                        : 'bg-surface-container-low text-on-surface-variant border-surface-variant hover:bg-surface-container'
                                }`}
                            >
                                Quick Section Jumper
                            </button>
                            <button
                                onClick={() => setActiveTab('help')}
                                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all border ${
                                    activeTab === 'help'
                                        ? 'bg-secondary text-on-secondary border-secondary shadow-sm'
                                        : 'bg-surface-container-low text-on-surface-variant border-surface-variant hover:bg-surface-container'
                                }`}
                            >
                                Help & FAQ Guide
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="p-5 space-y-3 overflow-y-auto max-h-[60vh]">
                            {activeTab === 'commands' ? (
                                filteredCommands.length > 0 ? (
                                    filteredCommands.map((cmd) => (
                                        <div
                                            key={cmd.id}
                                            onClick={() => handleSelectCommand(cmd)}
                                            className="group flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-surface-variant hover:border-secondary/40 shadow-sm transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-2xl bg-card-white border border-surface-variant shadow-sm group-hover:scale-105 transition-transform">
                                                    {cmd.icon}
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-on-surface group-hover:text-secondary transition-colors">
                                                        {cmd.title}
                                                    </h4>
                                                    <p className="text-[11px] font-medium text-on-surface-variant mt-0.5">
                                                        {cmd.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-on-surface-variant group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-xs font-bold text-on-surface-variant dark:text-on-surface-variant">
                                        No matching sections found. Try searching for "Diet", "Workout", or "Budget".
                                    </div>
                                )
                            ) : (
                                /* FAQ Accordion */
                                filteredFaqs.length > 0 ? (
                                    filteredFaqs.map((faq, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant space-y-1.5 shadow-sm"
                                        >
                                            <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                                <HelpIcon size={14} className="text-secondary flex-shrink-0" />
                                                <span>{faq.q}</span>
                                            </h4>
                                            <p className="text-[11px] font-medium text-on-surface-variant leading-relaxed pl-5">
                                                {faq.a}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-xs font-bold text-on-surface-variant dark:text-on-surface-variant">
                                        No matching help guides found.
                                    </div>
                                )
                            )}
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}
