import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ErrorMessageProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <p className="text-muted-foreground">{message || t('common.error')}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}
