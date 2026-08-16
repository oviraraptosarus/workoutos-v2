with open('src/app/budget-tracker/components/SpendPaceChart.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { getExpenses } from '../services/budgetStorage';", "import { getExpenses } from '../services/budgetStorage';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function SpendPaceChart() {", "export default function SpendPaceChart() {\n    const { t } = useLanguage();")

text = text.replace(">Weekly spend pace<", ">{t('budget.chart.title')}<")
text = text.replace(">Cumulative spend vs. budget pace<", ">{t('budget.chart.subtitle')}<")
text = text.replace(">Actual<", ">{t('budget.chart.actual')}<")
text = text.replace(">Budget pace<", ">{t('budget.chart.budgetPace')}<")
text = text.replace("'Cumulative Spend'", "t('budget.chart.tooltipCumulative')")
text = text.replace("'Budget Pace'", "t('budget.chart.tooltipPace')")

with open('src/app/budget-tracker/components/SpendPaceChart.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
