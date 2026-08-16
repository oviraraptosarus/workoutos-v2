with open('src/app/budget-tracker/components/TransactionModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { IncomeItem, ExpenseItem } from '../services/budgetStorage';", "import { IncomeItem, ExpenseItem } from '../services/budgetStorage';\nimport { useLanguage } from '@/contexts/LanguageContext';")

text = text.replace("}: TransactionModalProps) {", "}: TransactionModalProps) {\n    const { t } = useLanguage();")

text = text.replace(">Amount (₹)<", ">{t('budget.modal.amount')}<")
text = text.replace(">Description<", ">{t('budget.modal.description')}<")
text = text.replace("{type === 'income' ? 'Source' : 'Category'}", "{type === 'income' ? t('budget.modal.source') : t('budget.modal.category')}")
text = text.replace("Select a category", "{t('budget.modal.selectCategory')}")
text = text.replace("Other (Specify)", "{t('budget.modal.otherSpecify')}")
text = text.replace("Add {type}", "{type === 'income' ? t('budget.modal.addIncome') : t('budget.modal.addExpense')}")
text = text.replace("Save {type}", "{type === 'income' ? t('budget.modal.saveIncome') : t('budget.modal.saveExpense')}")
text = text.replace("Expense logged! 💡 Friendly reminder: Don't forget to put some money aside for your savings goals!", "Expense logged! 💡 Friendly reminder: Do not forget to put some money aside for your savings goals!")
text = text.replace("window.alert(\"Expense logged! 💡 Friendly reminder: Do not forget to put some money aside for your savings goals!\")", "window.alert(t('budget.modal.alert'))")

with open('src/app/budget-tracker/components/TransactionModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
