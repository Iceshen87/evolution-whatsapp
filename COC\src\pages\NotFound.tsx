import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-muted-foreground">{t('common.noData')}</p>
      <Link
        to="/"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {t('nav.myClan')}
      </Link>
    </div>
  )
}
