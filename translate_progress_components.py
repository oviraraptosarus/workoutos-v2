with open('src/components/progress/ProgressPhotosRow.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { Camera, Plus, Trash2, X, AlertCircle } from 'lucide-react';", "import { Camera, Plus, Trash2, X, AlertCircle } from 'lucide-react';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function ProgressPhotosRow({ photos, currentWeight, onPhotosUpdated, onOpenGallery }: ProgressPhotosRowProps) {", "export default function ProgressPhotosRow({ photos, currentWeight, onPhotosUpdated, onOpenGallery }: ProgressPhotosRowProps) {\n    const { t } = useLanguage();")
text = text.replace(">Progress Photos<", ">{t('progress.photos.title')}<")
text = text.replace(">No progress photos yet. Start documenting your journey!<", ">{t('progress.photos.empty')}<")
text = text.replace(">Upload Photo<", ">{t('progress.photos.uploadBtn')}<")
text = text.replace(">Add Photo Details<", ">{t('progress.photos.addDetails')}<")
text = text.replace("placeholder=\"How are you feeling today? e.g., Felt strong, clothes fit looser...\"", "placeholder={t('progress.photos.notesPlaceholder')}")
text = text.replace(">Save Photo<", ">{t('progress.photos.save')}<")
text = text.replace(">Cancel<", ">{t('progress.photos.cancel')}<")

# Just do partial matches for delete confirm
text = text.replace(">Are you sure you want to delete this photo?<", ">{t('progress.photos.deleteConfirm')}<")
text = text.replace(">This cannot be undone.<", "")
text = text.replace(">Delete<", ">{t('progress.photos.delete')}<")

with open('src/components/progress/ProgressPhotosRow.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

with open('src/components/progress/ProgressPhotoGalleryModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { X, ChevronLeft, ChevronRight, Scale, Calendar, AlertCircle, Trash2, Image as ImageIcon, Sparkles, Wand2 } from 'lucide-react';", "import { X, ChevronLeft, ChevronRight, Scale, Calendar, AlertCircle, Trash2, Image as ImageIcon, Sparkles, Wand2 } from 'lucide-react';\nimport { useLanguage } from '@/contexts/LanguageContext';")
text = text.replace("export default function ProgressPhotoGalleryModal({", "export default function ProgressPhotoGalleryModal({\n    const { t } = useLanguage();")
text = text.replace(">Progress Gallery<", ">{t('progress.gallery.title')}<")
text = text.replace(">Compare Mode<", ">{t('progress.gallery.compareMode')}<")
text = text.replace(">Date<", ">{t('progress.gallery.date')}<")
text = text.replace(">Weight<", ">{t('progress.gallery.weight')}<")
text = text.replace(">Notes<", ">{t('progress.gallery.notes')}<")
text = text.replace(">No photos uploaded yet.<", ">{t('progress.gallery.noPhotos')}<")

with open('src/components/progress/ProgressPhotoGalleryModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
