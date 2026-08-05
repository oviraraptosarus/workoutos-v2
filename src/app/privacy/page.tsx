'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PrivacyPage() {
    const { t } = useLanguage();
    
    return (
        <div className="min-h-screen bg-background text-on-surface p-4 sm:p-5 md:p-12 font-sans">
            <div className="max-w-3xl mx-auto bg-surface-container rounded-2xl shadow-sm border border-surface-variant/30 p-8">
                <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-8 font-medium">
                    <ArrowLeft size={18} /> Back
                </Link>
                
                <h1 className="text-3xl font-black text-on-surface mb-2">Privacy Policy</h1>
                <p className="text-sm text-on-surface-variant mb-8">Last Updated: August 2026 (v1.0)</p>

                <div className="space-y-4 text-on-surface leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold mb-3">1. Information We Collect</h2>
                        <p>We collect information you provide directly to us, including: Account details (name, email), Health and fitness data (weight, workouts, macros), Financial data (budgets, expenses), and Media (progress photos). We may also collect metadata such as IP addresses and device information.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">2. How We Use Your Information</h2>
                        <p>Your data is used solely to provide and improve the Service. We process your workouts, diet logs, and tasks to provide personalized AI insights, generate reports, and maintain your dashboard. If telemetry is enabled, we use anonymized data to fix bugs.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">3. AI Processing & Memory</h2>
                        <p>Workout OS utilizes Large Language Models (LLMs) to provide the AI Copilot. The AI Copilot has access to your logged data to provide personalized coaching. If "AI Memory" is enabled in your preferences, the AI may store contextual vectors of your past conversations. You can disable this and purge memory at any time in your Settings.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">4. Data Storage and Security</h2>
                        <p>Your data is securely stored using Supabase (PostgreSQL). We implement industry-standard Row-Level Security (RLS) policies to ensure that only authenticated users can access their own data. We do not sell your personal data to third-party data brokers.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">5. Your Rights</h2>
                        <p>Depending on your jurisdiction, you may have the right to access, export, correct, or delete your personal data. You can delete your account and all associated data permanently via the application settings.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
