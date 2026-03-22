import { useTranslation } from 'react-i18next'
import { TrendingUp, Trophy } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useClanContext } from '@/contexts/ClanContext'
import { useClanInfo } from '@/hooks/useClanInfo'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import EmptyState from '@/components/common/EmptyState'
import { formatNumber } from '@/utils/formatNumber'

const RANGES = [
  { min: 0, max: 1000, label: '0-1000' },
  { min: 1000, max: 2000, label: '1000-2000' },
  { min: 2000, max: 3000, label: '2000-3000' },
  { min: 3000, max: 4000, label: '3000-4000' },
  { min: 4000, max: 5000, label: '4000-5000' },
  { min: 5000, max: 6000, label: '5000-6000' },
  { min: 6000, max: Infinity, label: '6000+' },
]

const BAR_COLORS = [
  '#64748b', '#8b5cf6', '#6366f1', '#3b82f6', '#22c55e', '#eab308', '#f59e0b',
]

export default function TrophyTrends() {
  const { t } = useTranslation()
  const { clanTag } = useClanContext()
  const { data: clan, isLoading, error, refetch } = useClanInfo(clanTag)

  if (!clanTag) return <EmptyState />
  if (isLoading) return <LoadingSpinner text={t('common.loading')} />
  if (error) return <ErrorMessage onRetry={() => refetch()} />
  if (!clan) return <EmptyState />

  const distribution = RANGES.map((r) => ({
    range: r.label,
    count: clan.memberList.filter(
      (m) => m.trophies >= r.min && m.trophies < r.max
    ).length,
  }))

  const topMembers = [...clan.memberList]
    .sort((a, b) => b.trophies - a.trophies)
    .slice(0, 10)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        {t('trophy.title')}
      </h1>

      {/* Distribution Chart */}
      <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {t('trophy.distribution')}
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={distribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" />
            <XAxis
              dataKey="range"
              tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(215, 20%, 20%)' }}
            />
            <YAxis
              tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(215, 20%, 20%)' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 10%)',
                border: '1px solid hsl(215, 20%, 20%)',
                borderRadius: '8px',
                color: 'hsl(210, 40%, 95%)',
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {distribution.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top 10 */}
      <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {t('trophy.topMembers')}
        </h2>
        <div className="space-y-2">
          {topMembers.map((m, i) => {
            const maxTrophies = topMembers[0].trophies
            const pct = maxTrophies > 0 ? (m.trophies / maxTrophies) * 100 : 0
            return (
              <div key={m.tag} className="flex items-center gap-3">
                <span className={`w-6 text-right text-sm font-bold ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{m.name}</span>
                    <span className="text-sm text-primary font-medium">
                      {formatNumber(m.trophies)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
