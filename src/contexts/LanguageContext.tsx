'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '../i18n/en.json';
import te from '../i18n/te.json';

type Language = 'en' | 'te';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, values?: Record<string, string | number>) => string;
}

const dictionaries = {
    en: en as Record<string, string>,
    te: te as Record<string, string>,
};

const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    setLanguage: () => {},
    t: (key: string) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        const savedLang = localStorage.getItem('workoutos_lang') as Language;
        if (savedLang === 'te' || savedLang === 'en') {
            setLanguageState(savedLang);
        } else {
            // Check browser preference or default to English
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith('te')) {
                setLanguageState('te');
            } else {
                setLanguageState('en'); // Enforce English unless specified
            }
        }
    }, []);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('workoutos_lang', lang);
    }, []);

    const t = useCallback((key: string, values?: Record<string, string | number>) => {
        const dict = dictionaries[language] || dictionaries.en;
        let text = dict[key];

        if (text === undefined) {
            // Fallback to English if key is missing in Telugu
            text = dictionaries.en[key] || key;
        }

        if (values) {
            Object.keys(values).forEach(k => {
                text = text.replace(`{{${k}}}`, String(values[k]));
            });
        }

        return text;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
