with open('src/app/budget-tracker/components/BudgetHeader.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { addTransaction, IncomeItem, ExpenseItem } from '../services/budgetStorage';", "import { addTransaction, IncomeItem, ExpenseItem } from '../services/budgetStorage';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function BudgetHeader() {", "export default function BudgetHeader() {\n    const { t } = useLanguage();")

text = text.replace("Budget Tracker", "{t('budget.title')}")
text = text.replace("{currentDay} of {daysInMonth} days elapsed", "{t('budget.elapsedDays').replace('{currentDay}', currentDay.toString()).replace('{daysInMonth}', daysInMonth.toString())}")
text = text.replace(" Add income", " {t('budget.addIncome')}")
text = text.replace(" Add expense", " {t('budget.addExpense')}")

with open('src/app/budget-tracker/components/BudgetHeader.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
