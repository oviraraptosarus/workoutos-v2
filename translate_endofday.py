with open('src/app/sleep/components/EndOfDayReflection.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { useAuth } from '@/contexts/AuthContext';", "import { useAuth } from '@/contexts/AuthContext';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function EndOfDayReflection() {", "export default function EndOfDayReflection() {\n    const { t } = useLanguage();")

text = text.replace("> Reflection Saved!<", "> {t('sleep.reflection.saved')}<")
text = text.replace("> End of Day Reflection<", "> {t('sleep.reflection.title')}<")
text = text.replace("{isSaving ? 'Saving…' : 'Save Reflection'}", "{isSaving ? t('sleep.reflection.saving') : t('sleep.reflection.saveBtn')}")

text = text.replace(">Overall Mood<", ">{t('sleep.reflection.overallMood')}<")
text = text.replace(">Great 😄<", ">{t('sleep.reflection.moodGreat')}<")
text = text.replace(">Good 🙂<", ">{t('sleep.reflection.moodGood')}<")
text = text.replace(">Okay 😐<", ">{t('sleep.reflection.moodOkay')}<")
text = text.replace(">Bad 😞<", ">{t('sleep.reflection.moodBad')}<")

text = text.replace(">Energy<", ">{t('sleep.reflection.energy')}<")
text = text.replace(">High ⚡<", ">{t('sleep.reflection.energyHigh')}<")
text = text.replace(">Medium 🔋<", ">{t('sleep.reflection.energyMedium')}<")
text = text.replace(">Low 😴<", ">{t('sleep.reflection.energyLow')}<")

text = text.replace(">Stress<", ">{t('sleep.reflection.stress')}<")
text = text.replace(">Low 🧘<", ">{t('sleep.reflection.stressLow')}<")
text = text.replace(">Moderate 😤<", ">{t('sleep.reflection.stressModerate')}<")
text = text.replace(">High 🔥<", ">{t('sleep.reflection.stressHigh')}<")

text = text.replace(">Productivity<", ">{t('sleep.reflection.productivity')}<")

text = text.replace(">Water Intake<", ">{t('sleep.reflection.waterIntake')}<")
text = text.replace('placeholder="e.g. 3L or 2500ml"', 'placeholder={t("sleep.reflection.waterPlaceholder")}')
text = text.replace(">Screen Time<", ">{t('sleep.reflection.screenTime')}<")
text = text.replace('placeholder="e.g. 4h 30m or 2h"', 'placeholder={t("sleep.reflection.screenPlaceholder")}')
text = text.replace("{screenTimeToMinutes(reflection.screenTime)} min will be saved to your log", "{t('sleep.reflection.screenSaveMsg').replace('{mins}', screenTimeToMinutes(reflection.screenTime).toString())}")

text = text.replace(">Journal / Thoughts<", ">{t('sleep.reflection.journal')}<")
text = text.replace('placeholder="How was your day?"', 'placeholder={t("sleep.reflection.journalPlaceholder")}')

text = text.replace(">Highlights (Wins)<", ">{t('sleep.reflection.highlights')}<")
text = text.replace('placeholder="What went well today?"', 'placeholder={t("sleep.reflection.highlightsPlaceholder")}')

text = text.replace(">Gratitude<", ">{t('sleep.reflection.gratitude')}<")
text = text.replace('placeholder="What are you grateful for today?"', 'placeholder={t("sleep.reflection.gratitudePlaceholder")}')

text = text.replace(">Overall Day Rating<", ">{t('sleep.reflection.dayRating')}<")

text = text.replace("{user ? 'Synced to cloud (Supabase)' : 'Saved locally only — sign in to sync'}", "{user ? t('sleep.reflection.syncedCloud') : t('sleep.reflection.savedLocal')}")

with open('src/app/sleep/components/EndOfDayReflection.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
