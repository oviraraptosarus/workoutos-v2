with open('src/app/workout/components/WorkoutHeader.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { Dumbbell, Plus } from 'lucide-react';", "import { Dumbbell, Plus } from 'lucide-react';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function WorkoutHeader({ onStartEmpty }: { onStartEmpty?: () => void }) {", "export default function WorkoutHeader({ onStartEmpty }: { onStartEmpty?: () => void }) {\n    const { t } = useLanguage();")
text = text.replace("> Workout Tracker<", "> {t('workout.title')}<")
text = text.replace(">Plan, track, and crush your fitness goals<", ">{t('workout.subtitle')}<")
text = text.replace("> Start Empty Workout<", "> {t('workout.startEmpty')}<")

with open('src/app/workout/components/WorkoutHeader.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
