with open('src/app/progress/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { useAuth } from '@/contexts/AuthContext';", "import { useAuth } from '@/contexts/AuthContext';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("const { userProfile } = useAuth();", "const { userProfile } = useAuth();\n    const { t } = useLanguage();")
text = text.replace("{ key: '30', label: '30 days', days: 30 }", "{ key: '30', label: '30 days', days: 30, tk: 'progress.days30' }")
text = text.replace("{ key: '90', label: '3 months', days: 90 }", "{ key: '90', label: '3 months', days: 90, tk: 'progress.months3' }")
text = text.replace("{ key: '365', label: 'Year', days: 365 }", "{ key: '365', label: 'Year', days: 365, tk: 'progress.year' }")

text = text.replace(">{r.label}<", ">{t(r.tk)}<")

text = text.replace(">Progress<", ">{t('progress.title')}<")
text = text.replace(">Weight trend from your logs<", ">{t('progress.subtitle')}<")
text = text.replace(">Current<", ">{t('progress.current')}<")
text = text.replace(">Change<", ">{t('progress.change')}<")
text = text.replace(">To goal<", ">{t('progress.toGoal')}<")
text = text.replace(">Weight<", ">{t('progress.weight')}<")
text = text.replace(">No weight logged in this range<", ">{t('progress.noWeight')}<")
text = text.replace(">Log weight<", ">{t('progress.logWeight')}<")
text = text.replace(">Log another day to see your trend line<", ">{t('progress.logAnother')}<")
text = text.replace(">Entries<", ">{t('progress.entries')}<")
text = text.replace(">Back to dashboard<", ">{t('progress.back')}<")

with open('src/app/progress/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
