import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, ArrowUpDown } from 'lucide-react'
import { useClanContext } from '@/contexts/ClanContext'
import { useClanInfo } from '@/hooks/useClanInfo'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import EmptyState from '@/components/common/EmptyState'
import RoleTag from '@/components/common/RoleTag'
import { formatNumber } from '@/utils/formatNumber'
import { calculateActivity, getActivityLabel } from '@/utils/calculateActivity'
import { cn } from '@/lib/utils'

type RoleFilter = 'all' | 'leader' | 'coLeader' | 'admin' | 'member'

export default function MemberActivity() {
  const { t } = useTranslation()
  const { clanTag } = useClanContext()
  const { data: clan, isLoading, error, refetch } = useClanInfo(clanTag)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [sortKey, setSortKey] = useState<'trophies' | 'donations' | 'activity'>('activity')
  const [sortAsc, setSortAsc] = useState(false)

  if (!clanTag) return <EmptyState />
  if (isLoading) return <LoadingSpinner text={t('common.loading')} />
  if (error) return <ErrorMessage onRetry={() => refetch()} />
  if (!clan) return <EmptyState />

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const filtered = clan.memberList.filter(
    (m) => roleFilter === 'all' || m.role === roleFilter
  )

  const sorted = [...filtered].sort((a, b) => {
    let va: number, vb: number
    if (sortKey === 'activity') {
      va = calculateActivity(a, clan.memberList)
      vb = calculateActivity(b, clan.memberList)
    } else if (sortKey === 'donations') {
      va = a.donations
      vb = b.donations
    } else {
      va = a.trophies
      vb = b.trophies
    }
    return sortAsc ? va - vb : vb - va
  })

  const activityColors = {
    excellent: 'text-green-400 bg-green-500/10',
    good: 'text-blue-400 bg-blue-500/10',
    average: 'text-slate-400 bg-slate-500/10',
  }

  const roleFilters: RoleFilter[] = ['all', 'leader', 'coLeader', 'admin', 'member']
  const filterLabels: Record<RoleFilter, string> = {
    all: t('activity.filterAll'),
    leader: t('activity.filterLeader'),
    coLeader: t('activity.filterCoLeader'),
    admin: t('activity.filterElder'),
    member: t('activity.filterMember'),
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        {t('activity.title')}
      </h1>

      {/* Role Filter */}
      <div className="flex flex-wrap gap-2">
        {roleFilters.map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors border',
              roleFilter === r
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'text-muted-foreground border-border hover:text-foreground hover:border-border'
            )}
          >
            {filterLabels[r]}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="text-left py-3 px-4">#</th>
                <th className="text-left py-3 px-4">{t('common.name')}</th>
                <th className="text-left py-3 px-4">{t('common.role')}</th>
                <th className="text-right py-3 px-4">{t('activity.expLevel')}</th>
                <th
                  className="text-right py-3 px-4 cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort('trophies')}
                >
                  <span className="inline-flex items-center gap-1">
                    {t('common.trophies')} <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="text-left py-3 px-4">{t('activity.league')}</th>
                <th
                  className="text-right py-3 px-4 cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort('donations')}
                >
                  <span className="inline-flex items-center gap-1">
                    {t('donations.donated')} <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th
                  className="text-right py-3 px-4 cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort('activity')}
                >
                  <span className="inline-flex items-center gap-1">
                    {t('activity.score')} <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, i) => {
                const score = calculateActivity(m, clan.memberList)
                const label = getActivityLabel(score)
                return (
                  <tr
                    key={m.tag}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                    <td className="py-3 px-4 font-medium">{m.name}</td>
                    <td className="py-3 px-4"><RoleTag role={m.role} /></td>
                    <td className="py-3 px-4 text-right">{m.expLevel}</td>
                    <td className="py-3 px-4 text-right text-primary font-medium">
                      {formatNumber(m.trophies)}
                    </td>
                    <td className="py-3 px-4">
                      {m.league && (
                        <div className="flex items-center gap-1.5">
                          <img src={m.league.iconUrls.tiny} alt="" className="h-5 w-5" />
                          <span className="text-xs text-muted-foreground hidden xl:inline">{m.league.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">{formatNumber(m.donations)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', activityColors[label])}>
                        {score} - {t(`activity.${label}`)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
