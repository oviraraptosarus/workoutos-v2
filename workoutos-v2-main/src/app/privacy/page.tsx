'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background text-on-surface p-4 sm:p-5 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto bg-surface-container rounded-2xl shadow-sm border border-surface-variant/30 p-8">
                <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-8 font-medium">
                    <ArrowLeft size={18} /> Back
                </Link>

                <h1 className="text-3xl font-black text-on-surface mb-1">Privacy Policy</h1>
                <p className="text-sm text-on-surface-variant mb-1">Last Updated: 15 August 2026</p>
                <p className="text-xs text-on-surface-variant mb-8">Applicable to users in India and governed by the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology Act, 2000.</p>

                <div className="space-y-8 text-on-surface leading-relaxed text-sm">

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">1. Who We Are (Data Fiduciary)</h2>
                        <p>Workout OS ("we", "us", "our") is a personal productivity and fitness tracking application developed and operated as an Indian entity. As the entity that determines the purpose and means of processing your personal data, we act as the <strong>Data Fiduciary</strong> under the Digital Personal Data Protection Act, 2023 (DPDP Act). For all privacy-related concerns, contact us at: <strong>privacy@workoutos.app</strong></p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">2. Age Restriction &amp; Child Protection</h2>
                        <p>Our Service is intended for individuals who are <strong>7 years of age or older</strong>. In compliance with the DPDP Act, 2023 (Section 9), we treat any user under 18 as a <strong>Child Data Principal</strong>.</p>
                        <ul className="list-disc pl-5 space-y-2 mt-3">
                            <li><strong>Child Mode (Under 18):</strong> We automatically detect minor accounts and restrict collection of sensitive health data, disable AI dietary/caloric deficit profiling, disable biometric photo uploads, and suppress behavioral inference engines.</li>
                            <li><strong>Verifiable Parental Consent:</strong> Where required by law, we will seek verifiable parental or guardian consent before processing a Child Data Principal's personal data.</li>
                            <li>We do not knowingly create behavioural profiles of children or serve targeted content to users under 18.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">3. Personal Data We Collect</h2>
                        <p className="mb-3">We collect personal data that you provide directly or that is generated through your use of the Service. This includes:</p>

                        <h3 className="font-semibold mb-2">3a. Identity &amp; Account Data</h3>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Full name, email address, date of birth, profile photo</li>
                            <li>Preferred language, timezone, and region settings</li>
                        </ul>

                        <h3 className="font-semibold mb-2">3b. Health &amp; Fitness Data (Sensitive Personal Data)</h3>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Body weight, height, BMI, and fitness goals</li>
                            <li>Daily workout logs: exercises, sets, reps, duration, and personal records</li>
                            <li>Sleep logs: bedtime, wake time, sleep duration, sleep quality, mood, and energy levels</li>
                            <li>Dietary logs: meals, ingredients, caloric intake, macronutrient breakdown (protein, carbs, fat, sugar, fiber), and water intake</li>
                            <li>Financial logs: income, expenses, budget categories, and financial reminders</li>
                            <li>Progress photographs (biometric visual data), which are screened for prohibited content before storage</li>
                        </ul>

                        <h3 className="font-semibold mb-2">3c. Behavioural &amp; Productivity Data</h3>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Daily task lists, Execution Budget scores, macro goals, and quest completions</li>
                            <li>Brain Dump voice transcripts and AI-generated journal summaries</li>
                            <li>Daily reflections and journal entries (voice-to-text and typed)</li>
                            <li>Content Vault items (saved URLs, descriptions, categories, and consumption status)</li>
                            <li>AI-inferred behavioural patterns and long-term memories saved by the Ava AI Copilot</li>
                            <li>AI conversation history with the Ava Copilot</li>
                        </ul>

                        <h3 className="font-semibold mb-2">3d. Technical &amp; Usage Data</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Device type, browser user-agent (used for platform-aware dictation features)</li>
                            <li>Push notification tokens and delivery status</li>
                            <li>Session activity logs and API request metadata (for security and anti-abuse purposes)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">4. How &amp; Why We Process Your Data (Purpose Limitation)</h2>
                        <p className="mb-3">We process your personal data only for the specific, lawful purposes listed below. We will not process your data for any purpose incompatible with these stated purposes without your prior consent.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Service Delivery:</strong> To store, retrieve, and display your fitness, sleep, nutrition, financial, and productivity logs across sessions and devices.</li>
                            <li><strong>AI Copilot Operation:</strong> To transmit your text, voice, and image inputs to third-party LLM providers to generate personalized fitness, nutrition, and productivity responses.</li>
                            <li><strong>Behavioural Insights:</strong> To analyse patterns in your logged data (e.g., sleep consistency, workout frequency) and surface insights within the app.</li>
                            <li><strong>Push Notifications &amp; Reminders:</strong> To deliver task reminders, sleep logging prompts, and financial reminder notifications at user-configured times via push notification services.</li>
                            <li><strong>Safety &amp; Compliance:</strong> To screen uploaded images for prohibited content, prevent fraudulent account activity, and comply with applicable Indian law.</li>
                            <li><strong>Data Export &amp; Portability:</strong> To allow you to export all your personal data as a JSON backup file at any time from your Profile settings.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">5. AI Processing &amp; Third-Party Data Processors</h2>
                        <p className="mb-3">The Ava AI Copilot is powered by third-party Large Language Model (LLM) providers. When you send a message, upload an image, or use voice dictation, your input is securely transmitted to one or more of the following processors:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-3">
                            <li><strong>Google (Gemini API):</strong> Text, image, and voice processing</li>
                            <li><strong>OpenRouter:</strong> LLM routing to open-source and proprietary models (Llama, Claude, etc.) as fallback providers</li>
                        </ul>
                        <p className="mb-2">We configure these integrations to request <strong>zero data retention</strong> where supported, meaning your inputs are used only to generate an immediate response and are <strong>not used to train third-party foundational models</strong>.</p>
                        <p>All third-party processors are bound by data processing agreements. We remain the Data Fiduciary; these processors act only on our documented instructions.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">6. Voice &amp; Audio Data</h2>
                        <p className="mb-2">Workout OS includes voice dictation features (Daily Journal, Brain Dump, Ava AI Copilot) that use the Web Speech API. Key disclosures:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Voice recognition is processed by your device's native speech service (Google Speech on Android, Apple Speech on iOS/macOS). We do not receive or store raw audio recordings.</li>
                            <li>Only the final transcribed text is stored in our database and/or transmitted to AI providers.</li>
                            <li>On Android, we use a platform-aware state machine that reads only the final recognised result to prevent audio buffer duplication, as mandated by our security architecture.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">7. Data Security</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Row-Level Security (RLS):</strong> All your personal data is mathematically isolated in our PostgreSQL database (hosted on Supabase). Only your authenticated user account can read or write your records. No other user or internal system can access your data without a court order or your explicit consent.</li>
                            <li><strong>Encryption in Transit:</strong> All data is transmitted over HTTPS/TLS 1.3. API keys and secrets are stored server-side in environment variables and never exposed to the client.</li>
                            <li><strong>Authentication:</strong> Account access is managed via Supabase Auth with industry-standard JWT tokens.</li>
                            <li><strong>Image Screening:</strong> Progress photographs are screened for NSFW content before storage to prevent harmful content ingestion.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">8. Data Retention</h2>
                        <p>We retain your personal data for as long as your account is active or as necessary to provide the Service. You may delete your entire account and all associated data at any time through Profile Settings. Upon deletion, your data is permanently purged from our primary database within 30 days, except where retention is legally required under Indian law (e.g., the IT Act, 2000).</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">9. Your Rights as a Data Principal (DPDP Act, 2023)</h2>
                        <p className="mb-3">Under the Digital Personal Data Protection Act, 2023, you have the following rights:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Right to Access:</strong> Request a summary of what personal data we hold about you</li>
                            <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete personal data</li>
                            <li><strong>Right to Erasure:</strong> Request permanent deletion of your personal data and account</li>
                            <li><strong>Right to Grievance Redressal:</strong> Submit complaints to our designated Grievance Officer</li>
                            <li><strong>Right to Nominate:</strong> Nominate an individual to exercise your rights in the event of your death or incapacity</li>
                            <li><strong>Right to Withdraw Consent:</strong> Withdraw your consent to processing at any time (note: this may limit your ability to use certain features)</li>
                        </ul>
                        <p className="mt-3">To exercise any of these rights, contact our <strong>Grievance Officer</strong> at: <strong>grievance@workoutos.app</strong>. We will acknowledge your request within 72 hours and resolve it within 30 days.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">10. Cross-Border Data Transfers</h2>
                        <p>Our database and AI processing infrastructure may be located outside India (e.g., United States, European Union). Such transfers occur only to countries or entities that provide an adequate level of data protection as notified by the Central Government of India under the DPDP Act, or pursuant to appropriate contractual safeguards. By using the Service, you consent to these transfers.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">11. Push Notifications</h2>
                        <p>We send push notifications for task reminders, sleep logging prompts (from 6:00 PM), financial reminders (at 9:00 AM on due dates), and overdue task alerts. You may disable push notifications at any time through your device OS settings or within the app. Disabling notifications will not affect your ability to use core features.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">12. Cookies &amp; Local Storage</h2>
                        <p>We use browser <code>localStorage</code> and <code>sessionStorage</code> to store theme preferences, session tokens, and splash screen flags. We do not use third-party advertising cookies or cross-site tracking technologies. You can clear local storage at any time via your browser settings.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">13. Changes to This Policy</h2>
                        <p>We may update this Privacy Policy to reflect new features or legal requirements. We will notify you of material changes via an in-app notice or email at least 15 days before they take effect. Continued use of the Service after the effective date constitutes acceptance of the revised policy.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">14. Governing Law &amp; Jurisdiction</h2>
                        <p>This Privacy Policy is governed by the laws of India, including the Digital Personal Data Protection Act, 2023, the Information Technology Act, 2000, and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011. Any disputes shall be subject to the exclusive jurisdiction of the courts of India.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold mb-3 border-b border-surface-variant/40 pb-2">15. Contact &amp; Grievance Officer</h2>
                        <div className="bg-surface-variant/20 rounded-xl p-4 space-y-1">
                            <p><strong>Grievance Officer:</strong> Workout OS Privacy Team</p>
                            <p><strong>Email:</strong> grievance@workoutos.app</p>
                            <p><strong>Privacy Inquiries:</strong> privacy@workoutos.app</p>
                            <p className="text-xs text-on-surface-variant mt-2">Response time: 72 hours for acknowledgement, 30 days for resolution as per DPDP Act, 2023.</p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
