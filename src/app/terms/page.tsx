'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TermsPage() {
    const { t } = useLanguage();
    
    return (
        <div className="min-h-screen bg-background text-on-surface p-4 sm:p-5 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto bg-surface-container rounded-2xl shadow-sm border border-surface-variant/30 p-8">
                <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-8 font-medium">
                    <ArrowLeft size={18} /> Back
                </Link>
                
                <h1 className="text-3xl font-black text-on-surface mb-2">Terms of Service</h1>
                <p className="text-sm text-on-surface-variant mb-8">Last Updated: August 2026</p>

                <div className="space-y-6 text-on-surface leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold mb-3">1. Eligibility & Age Restriction (7+)</h2>
                        <p>You must be at least seven (7) years of age to create an account and use Workout OS. 
                        <strong> Child Mode (Under 18):</strong> If you are under 18 years of age, you may use the Service, but high-liability features (including biometric photo uploads, caloric deficit targets, and AI dietary advice) will be strictly disabled. Depending on your jurisdiction, we may require verifiable parental consent before you can create an account.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">2. No Medical Advice (Health & Fitness Disclaimer)</h2>
                        <p className="font-bold text-red-500 dark:text-red-400 mb-2">WORKOUT OS IS NOT A HEALTHCARE PROVIDER, DOCTOR, OR REGISTERED DIETICIAN.</p>
                        <p>The Service, including all AI-generated recommendations, workout plans, and macronutrient targets, is provided for informational and execution-tracking purposes only. You assume all risks associated with your use of the Service. You should consult a licensed healthcare professional before starting any diet or exercise program. Do not use the Service for medical diagnosis, injury rehabilitation, or treatment.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">3. The AI Copilot & Automated Decisions</h2>
                        <p>The Service includes an AI Copilot powered by third-party Large Language Models (LLMs). The AI Copilot may generate inaccurate, incomplete, or inappropriate information (known as "hallucinations"). You are solely responsible for independently verifying any nutritional or fitness advice provided by the AI.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">4. Acceptable Use & Prohibited Content</h2>
                        <p>You agree not to use the Service to upload, store, or process any illegal, infringing, or harmful content. Uploading explicit, nude, or sexually suggestive imagery to the Progress Photos feature is strictly prohibited. We employ automated screening and reserve the right to terminate accounts that violate this policy without notice.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">5. User Content & Intellectual Property</h2>
                        <p>You retain all ownership rights to the data you input into the Service. You grant us a worldwide, non-exclusive license to host and process this data solely to provide the Service to you. We retain all rights to the underlying code, UI, and AI architecture.</p>
                    </section>
                    
                    <section>
                        <h2 className="text-xl font-bold mb-3">6. Limitation of Liability</h2>
                        <p className="uppercase text-sm">To the maximum extent permitted by applicable law, Workout OS shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data or personal injury resulting from your use of the Service or reliance on AI recommendations.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
