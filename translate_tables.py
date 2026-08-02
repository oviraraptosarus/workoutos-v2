with open('src/app/budget-tracker/components/IncomeTable.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { getIncome, deleteTransaction, IncomeItem } from '../services/budgetStorage';", "import { getIncome, deleteTransaction, IncomeItem } from '../services/budgetStorage';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function IncomeTable() {", "export default function IncomeTable() {\n    const { t } = useLanguage();")

text = text.replace(">Income log<", ">{t('budget.income.title')}<")
text = text.replace("{visible.length === 1 ? 'entry' : 'entries'}", "{visible.length === 1 ? t('budget.income.entry') : t('budget.income.entries').replace('{count}', visible.length.toString())}")
text = text.replace("{visible.length} ", "")
text = text.replace("• Total:", "• {t('budget.income.total')}:")
text = text.replace("placeholder=\"Search income...\"", "placeholder={t('budget.income.search')}")
text = text.replace(">All sources<", ">{t('budget.income.allSources')}<")
text = text.replace("'No income logged yet.'", "t('budget.income.noLog')")
text = text.replace("'No income matches this filter.'", "t('budget.income.noMatch')")
text = text.replace(">Clear filters<", ">{t('budget.income.clear')}<")
text = text.replace(">Delete<", ">{t('budget.income.delete')}<")
text = text.replace(">Cancel<", ">{t('budget.income.cancel')}<")

with open('src/app/budget-tracker/components/IncomeTable.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

with open('src/app/budget-tracker/components/ExpenseTable.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { getExpenses, deleteTransaction, ExpenseItem } from '../services/budgetStorage';", "import { getExpenses, deleteTransaction, ExpenseItem } from '../services/budgetStorage';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function ExpenseTable() {", "export default function ExpenseTable() {\n    const { t } = useLanguage();")

text = text.replace(">Expense log<", ">{t('budget.expense.title')}<")
text = text.replace("{visible.length === 1 ? 'entry' : 'entries'}", "{visible.length === 1 ? t('budget.expense.entry') : t('budget.expense.entries').replace('{count}', visible.length.toString())}")
text = text.replace("{visible.length} ", "")
text = text.replace("• Total:", "• {t('budget.expense.total')}:")
text = text.replace("placeholder=\"Search expenses...\"", "placeholder={t('budget.expense.search')}")
text = text.replace(">All categories<", ">{t('budget.expense.allCategories')}<")
text = text.replace("'No expenses logged yet.'", "t('budget.expense.noLog')")
text = text.replace("'No expenses match this filter.'", "t('budget.expense.noMatch')")
text = text.replace(">Clear filters<", ">{t('budget.expense.clear')}<")
text = text.replace(">Delete<", ">{t('budget.expense.delete')}<")
text = text.replace(">Cancel<", ">{t('budget.expense.cancel')}<")

with open('src/app/budget-tracker/components/ExpenseTable.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
