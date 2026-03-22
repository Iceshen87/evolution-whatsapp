import { useTranslation } from 'react-i18next'
import { Shield, Users, Trophy, Swords, TrendingUp, Zap } from 'lucide-react'
import { useClanContext } from '@/contexts/ClanContext'
import { useClanInfo } from '@/hooks/useClanInfo'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import EmptyState from '@/components/common/EmptyState'
import ClanBadge from '@/components/common/ClanBadge'
import StatCard from '@/components/common/StatCard'
import { formatNumber } from '@/utils/formatNumber'

export default function MyClan() {
  const { t } = useTranslation()
  const { clanTag } = useClanContext()
  const { data: clan, isLoading, error, refetch } = useClanInfo(clanTag)

  if (!clanTag) return <EmptyState />
  if (isLoading) return <LoadingSpinner text={t('common.loading')} />
  if (error) return <ErrorMessage message={t('clan.notFound')} onRetry={() => refetch()} />
  if (!clan) return <EmptyState />

  const clanType = clan.type === 'open' ? t('clan.typeOpen') : clan.type === 'inviteOnly' ? t('clan.typeInviteOnly') : t('clan.typeClosed')

  return (
    <div className="space-y-6">
      {/* Clan Header */}
      <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <ClanBadge url={clan.badgeUrls.large} name={clan.name} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{clan.name}</h1>
            <p className="text-sm text-primary font-mono mt-1">{clan.tag}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" />
                {t('clan.clanLevel')} {clan.clanLevel}
              </span>
              <span>{clanType}</span>
              {clan.location && <span>{clan.location.name}</span>}
            </div>
            {clan.description && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {clan.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('clan.memberCount')}
          value={`${clan.members}/50`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label={t('clan.clanPoints')}
          value={formatNumber(clan.clanPoints)}
          icon={<Trophy className="h-4 w-4" />}
        />
        <StatCard
          label={t('clan.clanVersusPoints')}
          value={formatNumber(clan.clanBuilderBasePoints)}
          icon={<Zap className="h-4 w-4" />}
        />
        <StatCard
          label={t('clan.warWinStreak')}
          value={clan.warWinStreak}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* War Summary */}
      <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <Swords className="h-5 w-5 text-primary" />
          {t('clan.warSummary')}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label={t('clan.warWins')}
            value={clan.warWins}
            variant="win"
          />
          <StatCard
            label={t('clan.warLosses')}
            value={clan.warLosses}
            variant="lose"
          />
          <StatCard
            label={t('clan.warTies')}
            value={clan.warTies}
            variant="draw"
          />
        </div>
      </div>

      {/* Quick Member List */}
      <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {t('common.members')} ({clan.members})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 px-3">#</th>
                <th className="text-left py-2 px-3">{t('common.name')}</th>
                <th className="text-left py-2 px-3">{t('common.role')}</th>
                <th className="text-right py-2 px-3">{t('common.level')}</th>
                <th className="text-right py-2 px-3">{t('common.trophies')}</th>
              </tr>
            </thead>
            <tbody>
              {clan.memberList
                .sort((a, b) => a.clanRank - b.clanRank)
                .map((m, i) => (
                  <tr
                    key={m.tag}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 px-3 font-medium">{m.name}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs ${m.role === 'leader' ? 'text-red-400' : m.role === 'coLeader' ? 'text-purple-400' : m.role === 'admin' ? 'text-blue-400' : 'text-muted-foreground'}`}>
                        {t(`roles.${m.role}`)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">{m.expLevel}</td>
                    <td className="py-2 px-3 text-right text-primary font-medium">
                      {formatNumber(m.trophies)}
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
