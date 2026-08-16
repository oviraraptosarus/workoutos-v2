with open('src/app/diet/components/WaterTracker.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { Droplet, Plus, Minus, RotateCcw } from 'lucide-react';", "import { Droplet, Plus, Minus, RotateCcw } from 'lucide-react';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("    const percent = Math.min(100, Math.round((currentMl / goalMl) * 100));", "    const { t } = useLanguage();\n    const percent = Math.min(100, Math.round((currentMl / goalMl) * 100));")
text = text.replace(">Hydration Tracker<", ">{t('diet.water.title')}<")
text = text.replace(">Quick Add<", ">{t('diet.water.quickAdd')}<")
text = text.replace(">Undo<", ">{t('diet.water.undo')}<")
text = text.replace(">+250ml<", ">{t('diet.water.add')}<")

with open('src/app/diet/components/WaterTracker.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
