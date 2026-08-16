'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CookiesPage() {
    const { t } = useLanguage();
    
    return (
        <div className="min-h-screen bg-background text-on-surface p-4 sm:p-5 md:p-12 font-sans">
            <div className="max-w-3xl mx-auto bg-surface-container rounded-2xl shadow-sm border border-surface-variant/30 p-8">
                <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-8 font-medium">
                    <ArrowLeft size={18} /> Back
                </Link>
                
                <h1 className="text-3xl font-black text-on-surface mb-2">Cookie Policy</h1>
                <p className="text-sm text-on-surface-variant mb-8">Last Updated: August 2026 (v1.0)</p>

                <div className="space-y-4 text-on-surface leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold mb-3">What are Cookies?</h2>
                        <p>Cookies are small text files that are placed on your device to help the site provide a better user experience. In general, cookies are used to retain user preferences and provide anonymized tracking data.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">How We Use Cookies</h2>
                        <p>Workout OS uses strictly necessary cookies to manage authentication sessions via Supabase Auth. We also use local storage to persist offline states, UI preferences (like Theme and Language), and cached data to make the app load faster.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3">Managing Cookies</h2>
                        <p>You can choose to disable cookies through your browser options. However, please note that disabling cookies will prevent you from logging into your Workout OS account, as authentication relies on secure session cookies.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
