import { useTranslation } from 'react-i18next'
import { Swords } from 'lucide-react'
import { useClanContext } from '@/contexts/ClanContext'
import { useClanWarLog } from '@/hooks/useClanWarLog'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import EmptyState from '@/components/common/EmptyState'
import StatCard from '@/components/common/StatCard'
import { formatCocDateLocale } from '@/utils/formatDate'
import { cn } from '@/lib/utils'

export default function ClanWarRecords() {
  const { t, i18n } = useTranslation()
  const { clanTag } = useClanContext()
  const { data, isLoading, error, refetch } = useClanWarLog(clanTag)

  if (!clanTag) return <EmptyState />
  if (isLoading) return <LoadingSpinner text={t('common.loading')} />
  if (error) {
    const is403 = (error as { response?: { status: number } })?.response?.status === 403
    if (is403) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Swords className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t('war.logNotPublic')}</p>
        </div>
      )
    }
    return <ErrorMessage onRetry={() => refetch()} />
  }
  if (!data?.items?.length) return <EmptyState message={t('common.noData')} />

  const items = data.items
  const wins = items.filter((w) => w.result === 'win').length
  const winRate = items.length > 0 ? ((wins / items.length) * 100).toFixed(1) : '0'
  const avgStars = (items.reduce((s, w) => s + w.clan.stars, 0) / items.length).toFixed(1)
  const avgDest = (items.reduce((s, w) => s + w.clan.destructionPercentage, 0) / items.length).toFixed(1)

  const resultStyles = {
    win: 'text-win',
    lose: 'text-lose',
    tie: 'text-draw',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Swords className="h-5 w-5 text-primary" />
        {t('war.title')}
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('war.totalWars')} value={items.length} />
        <StatCard label={t('war.winRate')} value={`${winRate}%`} />
        <StatCard label={t('war.avgStars')} value={avgStars} />
        <StatCard label={t('war.avgDestruction')} value={`${avgDest}%`} />
      </div>

      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="text-left py-3 px-4">{t('war.date')}</th>
                <th className="text-left py-3 px-4">{t('war.opponent')}</th>
                <th className="text-center py-3 px-4">{t('war.teamSize')}</th>
                <th className="text-center py-3 px-4">{t('war.result')}</th>
                <th className="text-right py-3 px-4">{t('war.stars')}</th>
                <th className="text-right py-3 px-4">{t('war.destruction')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((w, i) => (
                <tr
                  key={i}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-4 text-muted-foreground">
                    {formatCocDateLocale(w.endTime, i18n.language)}
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {w.opponent.name || t('common.noData')}
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">
                    {w.teamSize}v{w.teamSize}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn('font-bold', resultStyles[w.result])}>
                      {t(`war.${w.result}`)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-primary">{w.clan.stars}</span>
                    <span className="text-muted-foreground"> - </span>
                    <span>{w.opponent.stars}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-primary">{w.clan.destructionPercentage.toFixed(1)}%</span>
                    <span className="text-muted-foreground"> - </span>
                    <span>{w.opponent.destructionPercentage.toFixed(1)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
