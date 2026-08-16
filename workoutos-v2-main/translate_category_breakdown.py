with open('src/app/budget-tracker/components/CategoryBreakdown.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { getExpenses, ExpenseItem } from '../services/budgetStorage';", "import { getExpenses, ExpenseItem } from '../services/budgetStorage';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function CategoryBreakdown() {", "export default function CategoryBreakdown() {\n    const { t } = useLanguage();")

text = text.replace("summaryString += ` • Other (${Math.round((otherActual / totalSpend) * 100)}%)`;", "summaryString += ` • ${t('budget.category.other')} (${Math.round((otherActual / totalSpend) * 100)}%)`;")
text = text.replace(">By category<", ">{t('budget.category.title')}<")
text = text.replace(">Budget vs. actual<", ">{t('budget.category.subtitle')}<")
text = text.replace("{categories.length} categories", "{t('budget.category.count').replace('{count}', categories.length.toString())}")
text = text.replace(">No expenses yet<", ">{t('budget.category.noExpenses')}<")
text = text.replace(">Log an expense using the + button to see your category breakdown.<", ">{t('budget.category.noExpensesDesc')}<")
text = text.replace("{showAll ? 'Show less' : `Show ${categories.length - 5} more categories`}", "{showAll ? t('budget.category.showLess') : t('budget.category.showMore').replace('{count}', (categories.length - 5).toString())}")
text = text.replace("Where it went this month:", "{t('budget.category.summary')}")

with open('src/app/budget-tracker/components/CategoryBreakdown.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
