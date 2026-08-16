with open('src/app/water/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { useAuth } from '@/contexts/AuthContext';", "import { useAuth } from '@/contexts/AuthContext';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function WaterPage() {", "export default function WaterPage() {\n    const { t } = useLanguage();")

text = text.replace("> Hydration<", "> {t('water.page.title')}<")
text = text.replace(">Track your daily water intake<", ">{t('water.page.subtitle')}<")
text = text.replace(">Daily Goal<", ">{t('water.page.dailyGoal')}<")
text = text.replace(">ml<", ">{t('water.page.ml')}<")
text = text.replace("> Daily Goal Met!<", "> {t('water.page.goalMet')}<")
text = text.replace("> Quick Add<", "> {t('water.page.quickAdd')}<")
text = text.replace(">Glass<", ">{t('water.page.glass')}<")
text = text.replace(">Bottle<", ">{t('water.page.bottle')}<")
text = text.replace(">Custom Amount (ml)<", ">{t('water.page.customAmount')}<")
text = text.replace("{isToday ? \"Today's\" : selectedDate} Log", "{isToday ? t('water.page.todayLog') : t('water.page.logDate').replace('{date}', selectedDate)}")
text = text.replace(">Reset All<", ">{t('water.page.resetAll')}<")
text = text.replace(">No water logged yet.<", ">{t('water.page.noWater')}<")

with open('src/app/water/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
