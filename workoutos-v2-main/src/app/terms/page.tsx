'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background text-on-surface p-4 sm:p-5 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto bg-surface-container rounded-2xl shadow-sm border border-surface-variant/30 p-8">
                <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-8 font-medium">
                    <ArrowLeft size={18} /> Back
                </Link>

                <h1 className="text-3xl font-black text-on-surface mb-1">Terms of Service</h1>
                <p className="text-sm text-on-surface-variant mb-1">Last Updated: 15 August 2026</p>
                <p className="text-xs text-on-surface-variant mb-8">These Terms constitute a legally binding agreement between you and Workout OS, governed by the laws of India.</p>

                <div className="space-y-8 text-on-surface leading-relaxed text-sm">

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">1. Acceptance of Terms</h2>
                        <p>By creating an account, accessing, or using the Workout OS application (the "Service"), you confirm that you have read, understood, and agree to be bound by these Terms of Service and our <Link href="/privacy" className="text-secondary underline">Privacy Policy</Link>. If you do not agree to these Terms, you must immediately cease using the Service. These Terms apply to all users, including registered members and visitors.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">2. Eligibility &amp; Age Restriction</h2>
                        <p className="mb-3">You must be at least <strong>7 years of age</strong> to use the Service.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Users Under 18 (Child Mode):</strong> If you are under 18 years of age, you may use the Service in a restricted "Child Mode." High-liability features including biometric progress photo uploads, AI-generated caloric deficit targets, AI dietary advice, and behavioural profiling engines are disabled. Parental or guardian consent may be required in accordance with the Digital Personal Data Protection Act, 2023.</li>
                            <li><strong>Users 18 and Above:</strong> You represent that you are a major capable of entering into a binding legal agreement under the Indian Contract Act, 1872.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">3. Health &amp; Medical Disclaimer (Critical — Please Read)</h2>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                            <p className="font-bold text-red-500 dark:text-red-400 text-base">WORKOUT OS IS NOT A HEALTHCARE PROVIDER, DOCTOR, REGISTERED DIETICIAN, PHYSIOTHERAPIST, OR MENTAL HEALTH PROFESSIONAL.</p>
                        </div>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>All content on the Service — including workout plans, macronutrient targets, sleep recommendations, AI-generated coaching responses, and nutritional estimates — is provided <strong>for informational and self-tracking purposes only</strong>. It does not constitute medical advice, diagnosis, or treatment.</li>
                            <li>You must consult a licensed medical professional before starting any new exercise programme, diet, or making changes to an existing one, particularly if you have a pre-existing health condition, injury, disability, or are pregnant.</li>
                            <li>Do not use this Service for medical diagnosis, injury rehabilitation, eating disorder management, or mental health treatment.</li>
                            <li><strong>You assume all risks</strong> associated with your physical activities and dietary choices made in connection with the Service.</li>
                            <li>AI-generated caloric and macronutrient estimates are approximate. Exact nutritional content varies by preparation method, brand, and serving size. Always verify with a qualified professional.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">4. The Ava AI Copilot &amp; AI-Generated Content</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>The Service includes an AI Copilot ("Ava") powered by third-party Large Language Models (LLMs) including Google Gemini and OpenRouter-hosted models. Ava is an automated system and is not a human.</li>
                            <li>AI-generated content may be <strong>inaccurate, incomplete, outdated, or inappropriate</strong> — a phenomenon known as "hallucination." Workout OS expressly disclaims all liability for errors in AI-generated recommendations.</li>
                            <li>You are solely responsible for independently verifying all nutritional, fitness, financial, and productivity advice provided by Ava before acting upon it.</li>
                            <li>Ava may log data on your behalf (meals, sleep, workouts, water intake, expenses) based on your voice or text instructions. You are responsible for reviewing and correcting any incorrectly logged entries.</li>
                            <li>Ava may save long-term memories and behavioural inferences about you to personalise future responses. You may view and delete these memories within the app at any time.</li>
                            <li>Historical logging ("time-travel logging") allows you to log data for past dates. You are responsible for the accuracy of any backdated entries you submit.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">5. Voice Dictation &amp; Audio Features</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>The Service uses the Web Speech API (native to your device OS) for voice dictation in the Daily Journal, Brain Dump, and Ava Copilot features. Audio is processed on your device; we do not receive or store raw audio files.</li>
                            <li>Only the final text transcript is stored in our database.</li>
                            <li>You consent to your voice inputs being transcribed and processed to provide the Service. By using voice features, you confirm you are not in a jurisdiction where this constitutes unlawful interception.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">6. Financial Tracking Disclaimer</h2>
                        <p>The Budget Tracker feature (income, expenses, financial reminders) is a <strong>personal bookkeeping tool only</strong>. It does not constitute financial advice, investment advice, or tax advice. Workout OS is not a registered financial adviser or financial institution under any Indian law, including SEBI regulations or the Banking Regulation Act. Consult a qualified chartered accountant or financial adviser for professional financial guidance.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">7. Content Vault &amp; Third-Party Content</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>The Content Vault allows you to save URLs, YouTube links, and notes for personal consumption tracking. We do not host, endorse, or take responsibility for third-party content you save.</li>
                            <li>You must not use the Content Vault to store links to illegal, infringing, or harmful content. We reserve the right to terminate accounts that abuse this feature.</li>
                            <li>YouTube title fetching uses publicly available metadata; Workout OS is not affiliated with YouTube or Google LLC for this purpose.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">8. Acceptable Use &amp; Prohibited Conduct</h2>
                        <p className="mb-3">You agree NOT to:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Upload, store, or process explicit, nude, sexually suggestive, or otherwise illegal imagery via the Progress Photos feature (automated screening is in place and violations will result in immediate account termination)</li>
                            <li>Use the Service to impersonate another person or entity</li>
                            <li>Attempt to reverse-engineer, decompile, or copy the Service's code, UI, or AI architecture</li>
                            <li>Use automated bots or scripts to access the Service in a manner that overloads our infrastructure</li>
                            <li>Exploit AI features to generate harmful, dangerous, illegal, or abusive content</li>
                            <li>Use the Service in any manner that violates Indian law, including the IT Act, 2000, or DPDP Act, 2023</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">9. User Content &amp; Intellectual Property</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Your Data:</strong> You retain full ownership of all personal data, journal entries, workout logs, financial records, and other content you input into the Service.</li>
                            <li><strong>Licence to Us:</strong> You grant Workout OS a limited, non-exclusive, worldwide, royalty-free licence to host, store, reproduce, and transmit your content solely to provide the Service to you. This licence terminates when you delete your account.</li>
                            <li><strong>Our IP:</strong> Workout OS, its name, logo, design system, UI architecture, AI orchestration logic, and underlying code are the exclusive intellectual property of Workout OS. All rights are reserved. No part of the Service may be reproduced or repurposed without explicit written permission.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">10. Push Notifications &amp; Communications</h2>
                        <p>By enabling push notifications, you consent to receiving automated alerts for task reminders, overdue task follow-ups (every 4 hours), sleep logging prompts (from 6:00 PM), and financial reminders (at 9:00 AM). You may withdraw this consent at any time by disabling notifications in your device OS settings or within the app. Disabling notifications does not affect your core Service access.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">11. Data Export &amp; Portability</h2>
                        <p>You may export all your personal data (workout logs, journals, sleep records, meals, tasks, AI memories, and financial entries) at any time as a JSON file from Profile Settings. This is a manual process; you are responsible for the security of exported files once downloaded to your device.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">12. Disclaimers &amp; Limitation of Liability</h2>
                        <div className="bg-surface-variant/20 rounded-xl p-4 space-y-3">
                            <p><strong>AS-IS SERVICE:</strong> The Service is provided "as is" and "as available" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, or non-infringement.</p>
                            <p><strong>LIMITATION OF LIABILITY:</strong> To the maximum extent permitted by applicable Indian law, Workout OS, its founders, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to: loss of data, personal injury, bodily harm, financial loss, or health deterioration resulting from your use of or reliance on the Service or AI-generated recommendations.</p>
                            <p><strong>AI ERRORS:</strong> We expressly disclaim liability for any harm arising from inaccurate AI-generated content, including incorrect caloric estimates, inappropriate workout suggestions, or financial miscalculations.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">13. Service Availability &amp; Modifications</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>We do not guarantee uninterrupted or error-free access to the Service. Planned maintenance will be communicated in advance where possible.</li>
                            <li>We reserve the right to modify, suspend, or discontinue any feature of the Service at any time with reasonable notice.</li>
                            <li>We reserve the right to update these Terms. Material changes will be communicated via in-app notice or email at least 15 days before they take effect.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">14. Account Termination</h2>
                        <p>You may delete your account at any time through Profile Settings, which will permanently erase all your personal data from our systems within 30 days. We reserve the right to suspend or terminate accounts that violate these Terms, applicable law, or pose a risk to other users or the platform, without prior notice where legally permitted.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">15. Governing Law &amp; Dispute Resolution</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>These Terms are governed by the laws of India, including the Indian Contract Act, 1872, the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023.</li>
                            <li>Any dispute arising out of or relating to these Terms shall first be attempted to be resolved through good-faith negotiation.</li>
                            <li>If negotiation fails, disputes shall be subject to the exclusive jurisdiction of the competent courts in India.</li>
                            <li>Nothing in these Terms limits your statutory rights as a consumer under the Consumer Protection Act, 2019 (India).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">16. Contact &amp; Grievance Officer</h2>
                        <div className="bg-surface-variant/20 rounded-xl p-4 space-y-1">
                            <p><strong>Grievance Officer:</strong> Workout OS Legal Team</p>
                            <p><strong>Email:</strong> legal@workoutos.app</p>
                            <p><strong>General Inquiries:</strong> support@workoutos.app</p>
                            <p className="text-xs text-on-surface-variant mt-2">In accordance with Rule 3(11) of the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, we will acknowledge grievances within 24 hours and resolve them within 15 days.</p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
