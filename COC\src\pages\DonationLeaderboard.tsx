import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Gift, ArrowUpDown, Check } from 'lucide-react'
import { useClanContext } from '@/contexts/ClanContext'
import { useClanInfo } from '@/hooks/useClanInfo'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import EmptyState from '@/components/common/EmptyState'
import StatCard from '@/components/common/StatCard'
import RoleTag from '@/components/common/RoleTag'
import { formatNumber } from '@/utils/formatNumber'
import { cn } from '@/lib/utils'
import type { ClanMember } from '@/types/clan'

type SortKey = 'donations' | 'donationsReceived' | 'net' | 'ratio'
type Role = ClanMember['role']

const ALL_ROLES: Role[] = ['leader', 'coLeader', 'admin', 'member']

export default function DonationLeaderboard() {
  const { t } = useTranslation()
  const { clanTag } = useClanContext()
  const { data: clan, isLoading, error, refetch } = useClanInfo(clanTag)
  const [sortKey, setSortKey] = useState<SortKey>('donations')
  const [sortAsc, setSortAsc] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([])

  if (!clanTag) return <EmptyState />
  if (isLoading) return <LoadingSpinner text={t('common.loading')} />
  if (error) return <ErrorMessage onRetry={() => refetch()} />
  if (!clan) return <EmptyState />

  const toggleRole = (role: Role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const filtered = selectedRoles.length === 0
    ? clan.memberList
    : clan.memberList.filter((m) => selectedRoles.includes(m.role))

  const members = [...filtered].sort((a, b) => {
    const getVal = (m: ClanMember) =>
      sortKey === 'net' ? m.donations - m.donationsReceived :
      sortKey === 'donationsReceived' ? m.donationsReceived :
      sortKey === 'ratio' ? (m.donationsReceived > 0 ? m.donations / m.donationsReceived : m.donations > 0 ? Infinity : 0) :
      m.donations
    return sortAsc ? getVal(a) - getVal(b) : getVal(b) - getVal(a)
  })

  const totalDonated = filtered.reduce((s, m) => s + m.donations, 0)
  const avgDonated = filtered.length > 0 ? Math.round(totalDonated / filtered.length) : 0
  const topDonor = filtered.length > 0
    ? filtered.reduce((top, m) => m.donations > top.donations ? m : top, filtered[0])
    : null

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const medalColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600']

  const roleLabels: Record<Role, string> = {
    leader: t('roles.leader'),
    coLeader: t('roles.coLeader'),
    admin: t('roles.admin'),
    member: t('roles.member'),
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        {t('donations.title')}
      </h1>

      {/* Role Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground mr-1">{t('donations.filterRole')}:</span>
        {ALL_ROLES.map((role) => {
          const active = selectedRoles.includes(role)
          return (
            <button
              key={role}
              onClick={() => toggleRole(role)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors border',
                active
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'text-muted-foreground border-border hover:text-foreground hover:border-border'
              )}
            >
              {active && <Check className="h-3.5 w-3.5" />}
              {roleLabels[role]}
            </button>
          )
        })}
        {selectedRoles.length > 0 && (
          <button
            onClick={() => setSelectedRoles([])}
            className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
          >
            {t('donations.clearFilter')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t('donations.totalDonated')} value={formatNumber(totalDonated)} />
        <StatCard label={t('donations.avgDonated')} value={formatNumber(avgDonated)} />
        <StatCard label={t('donations.topDonor')} value={topDonor?.name ?? '-'} />
      </div>

      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="text-left py-3 px-4">#</th>
                <th className="text-left py-3 px-4">{t('common.name')}</th>
                <th className="text-left py-3 px-4">{t('common.role')}</th>
                <th
                  className="text-right py-3 px-4 cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort('donations')}
                >
                  <span className="inline-flex items-center gap-1">
                    {t('donations.donated')}
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th
                  className="text-right py-3 px-4 cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort('donationsReceived')}
                >
                  <span className="inline-flex items-center gap-1">
                    {t('donations.received')}
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th
                  className="text-right py-3 px-4 cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort('net')}
                >
                  <span className="inline-flex items-center gap-1">
                    {t('donations.net')}
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th
                  className="text-right py-3 px-4 cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort('ratio')}
                >
                  <span className="inline-flex items-center gap-1">
                    {t('donations.ratio')}
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => {
                const net = m.donations - m.donationsReceived
                const ratio = m.donationsReceived > 0 ? (m.donations / m.donationsReceived).toFixed(2) : m.donations > 0 ? '∞' : '0.00'
                return (
                  <tr
                    key={m.tag}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className={`font-bold ${i < 3 ? medalColors[i] : 'text-muted-foreground'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{m.name}</td>
                    <td className="py-3 px-4"><RoleTag role={m.role} /></td>
                    <td className="py-3 px-4 text-right text-green-400 font-medium">
                      {formatNumber(m.donations)}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-400">
                      {formatNumber(m.donationsReceived)}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {net >= 0 ? '+' : ''}{formatNumber(net)}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${Number(ratio) >= 1 ? 'text-green-400' : ratio === '∞' ? 'text-primary' : 'text-red-400'}`}>
                      {ratio}
                    </td>
                  </tr>
                )
              })}
              {members.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
