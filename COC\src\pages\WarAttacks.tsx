import { useTranslation } from 'react-i18next'
import { Target, Star, Shield } from 'lucide-react'
import { useClanContext } from '@/contexts/ClanContext'
import { useCurrentWar } from '@/hooks/useCurrentWar'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import EmptyState from '@/components/common/EmptyState'
import ClanBadge from '@/components/common/ClanBadge'
import StatCard from '@/components/common/StatCard'
import { cn } from '@/lib/utils'

export default function WarAttacks() {
  const { t } = useTranslation()
  const { clanTag } = useClanContext()
  const { data: war, isLoading, error, refetch } = useCurrentWar(clanTag)

  if (!clanTag) return <EmptyState />
  if (isLoading) return <LoadingSpinner text={t('common.loading')} />
  if (error) return <ErrorMessage onRetry={() => refetch()} />
  if (!war || war.state === 'notInWar') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Target className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">{t('warAttack.notInWar')}</p>
      </div>
    )
  }

  const stateLabel =
    war.state === 'preparation'
      ? t('warAttack.preparation')
      : war.state === 'inWar'
        ? t('warAttack.inWar')
        : t('warAttack.warEnded')

  const stateColor =
    war.state === 'preparation'
      ? 'text-yellow-400'
      : war.state === 'inWar'
        ? 'text-green-400'
        : 'text-muted-foreground'

  // Collect all attacks
  const ourAttacks = war.clan.members
    ?.flatMap((m) =>
      (m.attacks || []).map((a) => ({
        ...a,
        attackerName: m.name,
        attackerTh: m.townhallLevel,
        defenderName:
          war.opponent.members?.find((o) => o.tag === a.defenderTag)?.name || a.defenderTag,
        defenderTh:
          war.opponent.members?.find((o) => o.tag === a.defenderTag)?.townhallLevel || 0,
      }))
    )
    .sort((a, b) => a.order - b.order) || []

  const theirAttacks = war.opponent.members
    ?.flatMap((m) =>
      (m.attacks || []).map((a) => ({
        ...a,
        attackerName: m.name,
        attackerTh: m.townhallLevel,
        defenderName:
          war.clan.members?.find((o) => o.tag === a.defenderTag)?.name || a.defenderTag,
        defenderTh:
          war.clan.members?.find((o) => o.tag === a.defenderTag)?.townhallLevel || 0,
      }))
    )
    .sort((a, b) => a.order - b.order) || []

  const renderStars = (count: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((s) => (
        <Star
          key={s}
          className={cn(
            'h-4 w-4',
            s <= count ? 'text-primary fill-primary' : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        {t('warAttack.title')}
      </h1>

      {/* War Overview */}
      <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div className="flex flex-col items-center gap-2">
            <ClanBadge url={war.clan.badgeUrls.medium} name={war.clan.name} size="md" />
            <span className="font-bold">{war.clan.name}</span>
            <span className="text-2xl font-bold text-primary">{war.clan.stars}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className={cn('text-sm font-medium', stateColor)}>{stateLabel}</span>
            <span className="text-3xl font-bold text-muted-foreground">{t('warAttack.vsLabel')}</span>
            <span className="text-sm text-muted-foreground">{war.teamSize}v{war.teamSize}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ClanBadge url={war.opponent.badgeUrls.medium} name={war.opponent.name} size="md" />
            <span className="font-bold">{war.opponent.name}</span>
            <span className="text-2xl font-bold">{war.opponent.stars}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <StatCard
            label={t('war.destruction')}
            value={`${war.clan.destructionPercentage.toFixed(1)}%`}
            variant="win"
          />
          <StatCard
            label={t('war.destruction')}
            value={`${war.opponent.destructionPercentage.toFixed(1)}%`}
            variant="lose"
          />
        </div>
      </div>

      {/* Attack Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Our Attacks */}
        <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-400" />
            {t('warAttack.ourAttacks')} ({ourAttacks.length})
          </h2>
          <div className="space-y-2">
            {ourAttacks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t('common.noData')}</p>
            )}
            {ourAttacks.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {a.attackerName}
                    <span className="text-muted-foreground text-xs ml-1">(TH{a.attackerTh})</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    → {a.defenderName}
                    <span className="ml-1">(TH{a.defenderTh})</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {renderStars(a.stars)}
                  <span className="text-sm font-medium text-primary w-12 text-right">
                    {a.destructionPercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Their Attacks */}
        <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-400" />
            {t('warAttack.theirAttacks')} ({theirAttacks.length})
          </h2>
          <div className="space-y-2">
            {theirAttacks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t('common.noData')}</p>
            )}
            {theirAttacks.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {a.attackerName}
                    <span className="text-muted-foreground text-xs ml-1">(TH{a.attackerTh})</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    → {a.defenderName}
                    <span className="ml-1">(TH{a.defenderTh})</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {renderStars(a.stars)}
                  <span className="text-sm font-medium w-12 text-right">
                    {a.destructionPercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
