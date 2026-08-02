with open('src/app/sleep/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { useAuth } from '@/contexts/AuthContext';", "import { useAuth } from '@/contexts/AuthContext';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function SleepPage() {", "export default function SleepPage() {\n    const { t } = useLanguage();")

text = text.replace("> Sleep Tracking<", "> {t('sleep.page.title')}<")
text = text.replace("{isToday ? \"Today's Recovery\" : `History for ${selectedDate}`}", "{isToday ? t('sleep.page.todayRecovery') : t('sleep.page.historyFor').replace('{date}', selectedDate)}")
text = text.replace(">Daily Target<", ">{t('sleep.page.dailyTarget')}<")
text = text.replace(">hrs<", ">{t('sleep.page.hrs')}<")
text = text.replace("Logged {isToday ? 'Today' : selectedDate}", "{t('sleep.page.loggedToday').replace('{date}', isToday ? 'Today' : selectedDate)}")
text = text.replace(">7-Day Avg<", ">{t('sleep.page.7dayAvg')}<")
text = text.replace(">Status<", ">{t('sleep.page.status')}<")
text = text.replace("? \"Optimal Recovery\" : \"Need more rest\"", "? t('sleep.page.optimalRecovery') : t('sleep.page.needRest')")
text = text.replace("> 7-Day Sleep Trends<", "> {t('sleep.page.trends')}<")
text = text.replace("> Recent Logs<", "> {t('sleep.page.recentLogs')}<")
text = text.replace(">No sleep logged.<", ">{t('sleep.page.noSleep')}<")

with open('src/app/sleep/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
