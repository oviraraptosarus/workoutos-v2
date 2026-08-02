with open('src/components/progress/ProgressPhotoGalleryModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { useLanguage } from '@/contexts/LanguageContext';", "")
text = text.replace("import { supabase } from '@/lib/supabaseClient';", "import { supabase } from '@/lib/supabaseClient';\nimport { useLanguage } from '@/contexts/LanguageContext';")

text = text.replace("export default function ProgressPhotoGalleryModal({\n    const { t } = useLanguage();", "export default function ProgressPhotoGalleryModal({")

text = text.replace("}: ProgressPhotoGalleryModalProps) {", "}: ProgressPhotoGalleryModalProps) {\n    const { t } = useLanguage();")


with open('src/components/progress/ProgressPhotoGalleryModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
