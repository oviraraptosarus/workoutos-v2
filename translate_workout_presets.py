with open('src/app/workout/components/PresetWorkouts.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { Play, Star, ChevronRight, Activity } from 'lucide-react';", "import { Play, Star, ChevronRight, Activity } from 'lucide-react';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function PresetWorkouts({ onPlay }: { onPlay: (preset: any) => void }) {", "export default function PresetWorkouts({ onPlay }: { onPlay: (preset: any) => void }) {\n    const { t } = useLanguage();")
text = text.replace(">Training Programs<", ">{t('workout.presets.title')}<")
text = text.replace(">Expertly crafted splits<", ">{t('workout.presets.subtitle')}<")
text = text.replace("> Start Workout<", "> {t('workout.presets.start')}<")

with open('src/app/workout/components/PresetWorkouts.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

with open('src/app/workout/components/RecentWorkouts.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { History, Share2, Flame, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';", "import { History, Share2, Flame, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function RecentWorkouts() {", "export default function RecentWorkouts() {\n    const { t } = useLanguage();")
text = text.replace(">Recent History<", ">{t('workout.recent.title')}<")
text = text.replace(">Your latest completed sessions<", ">{t('workout.recent.subtitle')}<")
text = text.replace(">No recent workouts recorded.<", ">{t('workout.recent.empty')}<")
text = text.replace(">Log a session manually or complete a workout above to see it here.<", ">{t('workout.recent.logManually')}<")

with open('src/app/workout/components/RecentWorkouts.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
