'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
    const { userProfile, updateUserProfile } = useAuth();
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        if (userProfile?.preferredLanguage) {
            setLanguageState(userProfile.preferredLanguage as Language);
        }
    }, [userProfile?.preferredLanguage]);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        if (userProfile) {
            updateUserProfile({ preferredLanguage: lang });
        }
    }, [userProfile, updateUserProfile]);

    const t = useCallback((key: string, values?: Record<string, string | number>) => {
        const dict = dictionaries[language] || dictionaries.en;
        let text = dict[key];

        if (text === undefined) {
            // Fallback to English if key is missing
            text = dictionaries.en[key] || key;
        }

        if (values) {
            Object.keys(values).forEach(k => {
                text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(values[k]));
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
