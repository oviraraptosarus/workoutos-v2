'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PrivacyPage() {
    const { t } = useLanguage();
    
    return (
        <div className="min-h-screen bg-background text-on-surface p-4 sm:p-5 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto bg-surface-container rounded-2xl shadow-sm border border-surface-variant/30 p-8">
                <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-8 font-medium">
                    <ArrowLeft size={18} /> Back
                </Link>
                
                <h1 className="text-3xl font-black text-on-surface mb-2">Privacy Policy</h1>
                <p className="text-sm text-on-surface-variant mb-8">Last Updated: August 2026</p>

                <div className="space-y-6 text-on-surface leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold mb-3">1. Age Restriction (7+)</h2>
                        <p>Our Service is intended for individuals who are 7 years of age or older. <strong>Under 18 (Child Mode):</strong> If you are under 18, we restrict the collection of sensitive data (such as progress photos) and disable AI health profiling to protect your privacy. We may require verifiable parental consent prior to account creation for users under 18 in certain jurisdictions.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">2. Information We Collect</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Identity & Health Data:</strong> Name, age, weight, and fitness logs.</li>
                            <li><strong>Biometric / Visual Data:</strong> Progress photographs (which are scanned for NSFW content before storage).</li>
                            <li><strong>Behavioral Data:</strong> Inferred profiles about your execution habits and procrastination tendencies.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">3. AI Processing & Third Parties</h2>
                        <p>When you interact with the AI Copilot, your voice, text, and image inputs are securely transmitted to third-party providers (e.g., Google, OpenRouter). We configure these integrations to request zero-data retention, meaning your data is used only to generate an immediate response and is not used to train external foundational models.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">4. Data Security</h2>
                        <p>Your data is mathematically isolated using Row-Level Security (RLS) in our PostgreSQL database. Only your authenticated user account can access your health logs, photos, and AI memories.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">5. Your Privacy Rights</h2>
                        <p>In accordance with the Digital Personal Data Protection Act, 2023 (India) and other applicable laws, you have the right to access, correct, and permanently delete your personal data. You can erase your entire account history directly through the application settings.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
