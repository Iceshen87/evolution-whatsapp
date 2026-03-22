import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function EmptyState({ message }: { message?: string }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Search className="h-12 w-12 text-muted-foreground/50" />
      <p className="text-muted-foreground text-center">
        {message || t('common.enterClanTag')}
      </p>
    </div>
  )
}
