with open('src/app/workout/components/ActiveSplitCard.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { Play, CheckCircle2, Trophy, Flame, Video, Link as LinkIcon, Plus, Save } from 'lucide-react';", "import { Play, CheckCircle2, Trophy, Flame, Video, Link as LinkIcon, Plus, Save } from 'lucide-react';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function ActiveSplitCard({ preset, isBuilderMode, onExitBuilder }: { preset?: any, isBuilderMode?: boolean, onExitBuilder?: () => void }) {", "export default function ActiveSplitCard({ preset, isBuilderMode, onExitBuilder }: { preset?: any, isBuilderMode?: boolean, onExitBuilder?: () => void }) {\n    const { t } = useLanguage();")
text = text.replace(">Workout Complete!<", ">{t('workout.active.complete')}<")
text = text.replace("Great job crushing ", "{t('workout.active.greatJob')} ")
text = text.replace(">Duration<", ">{t('workout.active.duration')}<")
text = text.replace(">Burned<", ">{t('workout.active.burned')}<")
text = text.replace(">Plan Workout<", ">{t('workout.active.plan')}<")
text = text.replace(">Add Exercise<", ">{t('workout.active.addEx')}<")
text = text.replace("placeholder=\"Ex Name\"", "placeholder={t('workout.active.name')}")
text = text.replace("placeholder=\"Sets\"", "placeholder={t('workout.active.sets')}")
text = text.replace("placeholder=\"Reps\"", "placeholder={t('workout.active.reps')}")
text = text.replace("> Start Workout<", "> {t('workout.active.start')}<")
text = text.replace("> Finish Workout<", "> {t('workout.active.finish')}<")
text = text.replace(">Add Youtube Link<", ">{t('workout.active.addLink')}<")
text = text.replace("placeholder=\"https://youtube.com/...\"", "placeholder={t('workout.active.linkPlaceholder')}")
text = text.replace(">Save Link<", ">{t('workout.active.saveLink')}<")
text = text.replace(">Cancel<", ">{t('workout.active.cancel')}<")

with open('src/app/workout/components/ActiveSplitCard.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
