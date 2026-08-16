with open('src/app/diet/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { useAuth } from '@/contexts/AuthContext';", "import { useAuth } from '@/contexts/AuthContext';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("const { userProfile } = useAuth();", "const { userProfile } = useAuth();\n    const { t } = useLanguage();")
text = text.replace(">Diet & Nutrition<", ">{t('diet.title')}<")
text = text.replace(">Track your meals, macros, calories, and hydration<", ">{t('diet.subtitle')}<")

with open('src/app/diet/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
