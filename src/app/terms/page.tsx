'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TermsPage() {
    const { t } = useLanguage();
    
    return (
        <div className="min-h-screen bg-background text-on-surface p-6 md:p-12 font-sans">
            <div className="max-w-3xl mx-auto bg-surface-container rounded-3xl shadow-sm border border-surface-variant/30 p-8">
                <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-8 font-medium">
                    <ArrowLeft size={18} /> Back
                </Link>
                
                <h1 className="text-3xl font-black text-on-surface mb-2">Terms and Conditions</h1>
                <p className="text-sm text-on-surface-variant mb-8">Last Updated: August 2026 (v1.0)</p>

                <div className="space-y-6 text-on-surface leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
                        <p>By accessing and using Workout OS (the "Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Service.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">2. User Accounts</h2>
                        <p>To use certain features, you must register for an account. You agree to provide accurate information and are solely responsible for maintaining the confidentiality of your account credentials.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">3. Medical Disclaimer</h2>
                        <p>Workout OS is a fitness and productivity tool, not a medical device or healthcare provider. Any health, fitness, or nutritional information provided is for informational purposes only and should not replace professional medical advice. Always consult a physician before beginning any new exercise or diet program.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">4. User Content</h2>
                        <p>You retain ownership of the data you input (workouts, photos, budgets). By using the Service, you grant Workout OS a license to host, store, and process this data solely to provide the Service to you.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">5. Prohibited Conduct</h2>
                        <p>You agree not to use the Service for any unlawful purpose, to reverse engineer the application, or to interfere with the proper working of the system.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">6. Termination</h2>
                        <p>We reserve the right to suspend or terminate your account at any time for violations of these Terms, with or without notice.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
