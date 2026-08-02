with open('src/app/budget-tracker/components/FinancialReminders.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { Bell, Plus, Trash2, CheckCircle2 } from 'lucide-react';", "import { Bell, Plus, Trash2, CheckCircle2 } from 'lucide-react';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function FinancialReminders() {", "export default function FinancialReminders() {\n    const { t } = useLanguage();")

text = text.replace(">Financial Reminders<", ">{t('budget.reminders.title')}<")
text = text.replace('placeholder="e.g. Pay Rent"', 'placeholder={t("budget.reminders.placeholder")}')
text = text.replace(">Add<", ">{t('budget.reminders.addBtn')}<")
text = text.replace(">No reminders yet<", ">{t('budget.reminders.noReminders')}<")
text = text.replace("Due: {new Date(r.date)", "{t('budget.reminders.due')} {new Date(r.date)")

with open('src/app/budget-tracker/components/FinancialReminders.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
