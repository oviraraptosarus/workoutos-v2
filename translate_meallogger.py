with open('src/app/diet/components/MealLogger.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { MealItem, MealCategory } from '../types';", "import { MealItem, MealCategory } from '../types';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("const [searchQuery, setSearchQuery] = useState('');", "const [searchQuery, setSearchQuery] = useState('');\n    const { t } = useLanguage();")
text = text.replace(">Daily Meal Log<", ">{t('diet.logger.title')}<")
text = text.replace('placeholder="Filter logged foods..."', 'placeholder={t("diet.logger.filter")}')
text = text.replace('title="Saved Recipe & Meal Combos"', 'title={t("diet.logger.savedRecipes")}')
text = text.replace('> Saved Recipes<', '> {t("diet.logger.recipes")}<')
text = text.replace('title="Copy Day\'s Summary to Clipboard"', 'title={t("diet.logger.exportSummary")}')
text = text.replace('> Copied!<', '> {t("diet.logger.copied")}<')
text = text.replace('> Copy Summary<', '> {t("diet.logger.exportSummary")}<')
text = text.replace('> Copy Yesterday<', '> {t("diet.logger.copyYesterday")}<')
text = text.replace('>Add Item<', '>{t("diet.logger.add")}<')
text = text.replace('>No meals logged yet<', '>{t("diet.logger.empty")}<')

# dynamic translation for categories (Breakfast, Lunch, Dinner, Snacks)
text = text.replace(">{name}<", ">{t(`diet.logger.${name.toLowerCase()}`)}<")


with open('src/app/diet/components/MealLogger.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
