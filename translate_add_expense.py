with open('src/app/budget-tracker/components/AddExpenseModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import Modal from '@/components/ui/Modal';", "import Modal from '@/components/ui/Modal';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function AddExpenseModal({ isOpen, onClose, onAdd }: AddExpenseModalProps) {", "export default function AddExpenseModal({ isOpen, onClose, onAdd }: AddExpenseModalProps) {\n    const { t } = useLanguage();")

text = text.replace('title="Add New Expense"', 'title={t("budget.modal.title")}')
text = text.replace(">Description<", ">{t('budget.modal.description')}<")
text = text.replace(">Amount (₹)<", ">{t('budget.modal.amount')}<")
text = text.replace(">Category<", ">{t('budget.modal.category')}<")
text = text.replace(">Cancel<", ">{t('budget.modal.cancel')}<")
text = text.replace(">Save Expense<", ">{t('budget.modal.saveExpense')}<")

with open('src/app/budget-tracker/components/AddExpenseModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
