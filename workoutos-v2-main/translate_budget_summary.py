with open('src/app/budget-tracker/components/BudgetSummaryCards.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { getIncome, getExpenses, IncomeItem, ExpenseItem } from '../services/budgetStorage';", "import { getIncome, getExpenses, IncomeItem, ExpenseItem } from '../services/budgetStorage';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function BudgetSummaryCards() {", "export default function BudgetSummaryCards() {\n    const { t } = useLanguage();")

text = text.replace(">Total Income<", ">{t('budget.cards.totalIncome')}<")
text = text.replace("From {income.length} income streams", "{t('budget.cards.incomeStreams').replace('{count}', income.length.toString())}")
text = text.replace(">Total Expenses<", ">{t('budget.cards.totalExpenses')}<")
text = text.replace("{onTrack ? 'On track' : 'Over pace'}", "{onTrack ? t('budget.cards.onTrack') : t('budget.cards.overPace')}")
text = text.replace("{expenseRatio}% of income", "{expenseRatio}{t('budget.cards.ofIncome')}")
text = text.replace("{monthPct}% of month", "{monthPct}{t('budget.cards.ofMonth')}")
text = text.replace("Projected total: <", "{t('budget.cards.projected')} <")
text = text.replace("Day {dayOfMonth} of {daysInMonth} — projection available from day 5", "{t('budget.cards.projectionMsg').replace('{day}', dayOfMonth.toString()).replace('{total}', daysInMonth.toString())}")
text = text.replace(">Net Savings<", ">{t('budget.cards.netSavings')}<")
text = text.replace("{savingsRate}% savings rate", "{savingsRate}{t('budget.cards.savingsRate')}")
text = text.replace(">Cost Per Gram Protein<", ">{t('budget.cards.costPerG')}<")
text = text.replace("{totalG}g purchased • ₹{totalProteinSpend.toFixed(0)} spent", "{t('budget.cards.proteinPurchased').replace('{g}', totalG.toString()).replace('{spend}', totalProteinSpend.toFixed(0))}")

with open('src/app/budget-tracker/components/BudgetSummaryCards.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
