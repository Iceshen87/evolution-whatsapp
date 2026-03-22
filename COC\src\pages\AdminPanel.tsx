import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Crown, Clock, Users, Globe, Filter, Server, KeyRound, X, TrendingUp, BarChart3, MapPin, Monitor, Eye, Wifi } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'
import axios from 'axios'
import StatCard from '@/components/common/StatCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface Visitor {
  sessionId: string
  ip: string
  country: string
  firstSeen: string
  lastSeen: string
  duration: number
  pages: string[]
  userAgent: string
}

interface VisitorResponse {
  visitors: Visitor[]
  stats: {
    total: number
    uniqueIps: number
    avgDuration: number
    uniqueDailyVisits: number
    countryStats: Record<string, number>
    cumulativeTotal: number
    cumulativeUniqueIps: number
    cumulativeUniqueDailyVisits: number
  }
}

interface ServerInfo {
  ip: string
  apiKey: string
}

type FilterMode = 'all' | 'today' | 'week' | 'month'

const CHART_COLORS = ['#eab308', '#8b5cf6', '#6366f1', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#64748b']

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString()
}

function getDateRange(mode: FilterMode): { startDate?: string; endDate?: string } {
  if (mode === 'all') return {}
  const now = new Date()
  let start: Date
  if (mode === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (mode === 'week') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
  }
  return { startDate: start.toISOString() }
}

export default function AdminPanel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [authed] = useState(true)
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [showOnlineVisitors, setShowOnlineVisitors] = useState(false)
  const [newApiKeyInput, setNewApiKeyInput] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const dateRange = getDateRange(filterMode)

  // Visitor data query
  const { data, isLoading, refetch } = useQuery<VisitorResponse>({
    queryKey: ['admin-visitors', filterMode],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (dateRange.startDate) params.startDate = dateRange.startDate
      if (dateRange.endDate) params.endDate = dateRange.endDate
      const { data } = await axios.get('/site/admin/visitors', { params })
      return data
    },
    enabled: authed,
    refetchInterval: 30000,
  })

  // Server info query
  const { data: serverInfo } = useQuery<ServerInfo>({
    queryKey: ['admin-server-info'],
    queryFn: async () => {
      const { data } = await axios.get('/site/admin/server-info', { params: {} })
      return data
    },
    enabled: authed,
  })

  // Update API key mutation
  const apiKeyMutation = useMutation({
    mutationFn: async (newKey: string) => {
      await axios.post('/site/admin/update-apikey', { apiKey: newKey })
    },
    onSuccess: () => {
      setUpdateSuccess(true)
      setNewApiKeyInput('')
      queryClient.invalidateQueries({ queryKey: ['admin-server-info'] })
      setTimeout(() => {
        setShowApiKeyDialog(false)
        setUpdateSuccess(false)
      }, 1500)
    },
  })

  // ESC to close dialog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowApiKeyDialog(false)
        setShowOnlineVisitors(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ===== Chart Data Processing =====

  // Daily visit trend (last 30 days)
  const dailyTrendData = useMemo(() => {
    if (!data?.visitors?.length) return []
    const counts: Record<string, number> = {}
    data.visitors.forEach((v) => {
      const day = v.firstSeen.slice(0, 10) // YYYY-MM-DD
      counts[day] = (counts[day] || 0) + 1
    })
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, count]) => ({ date: date.slice(5), count })) // MM-DD
  }, [data?.visitors])

  // Hourly distribution (0-23)
  const hourlyData = useMemo(() => {
    const slots = Array.from({ length: 24 }, (_, i) => ({ hour: String(i), count: 0 }))
    if (!data?.visitors?.length) return slots
    data.visitors.forEach((v) => {
      const h = new Date(v.firstSeen).getHours()
      slots[h].count++
    })
    return slots
  }, [data?.visitors])

  const maxHourlyCount = useMemo(() => Math.max(...hourlyData.map(d => d.count), 1), [hourlyData])

  // Duration distribution
  const durationData = useMemo(() => {
    if (!data?.visitors?.length) return []
    const ranges = [
      { range: '0-30s', min: 0, max: 30, count: 0 },
      { range: '30s-1m', min: 30, max: 60, count: 0 },
      { range: '1-3m', min: 60, max: 180, count: 0 },
      { range: '3-5m', min: 180, max: 300, count: 0 },
      { range: '5-10m', min: 300, max: 600, count: 0 },
      { range: '10m+', min: 600, max: Infinity, count: 0 },
    ]
    data.visitors.forEach((v) => {
      const d = v.duration || 0
      const range = ranges.find(r => d >= r.min && d < r.max)
      if (range) range.count++
    })
    return ranges
  }, [data?.visitors])

  // Duration stats
  const durationStats = useMemo(() => {
    if (!data?.visitors?.length) return { max: 0, min: 0, median: 0 }
    const durations = data.visitors.map(v => v.duration || 0).sort((a, b) => a - b)
    const max = durations[durations.length - 1]
    const min = durations[0]
    const median = durations[Math.floor(durations.length / 2)]
    return { max, min, median }
  }, [data?.visitors])

  // Country data for pie chart
  const countryData = useMemo(() => {
    if (!data?.stats?.countryStats) return []
    const total = Object.values(data.stats.countryStats).reduce((a, b) => a + b, 0)
    return Object.entries(data.stats.countryStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([country, count]) => ({
        country,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
  }, [data?.stats?.countryStats])

  // ===== Handlers =====

  const handleUpdateApiKey = () => {
    if (!newApiKeyInput.trim()) return
    apiKeyMutation.mutate(newApiKeyInput.trim())
  }

  // ===== Admin Panel Render =====

  const filters: { key: FilterMode; label: string }[] = [
    { key: 'all', label: t('admin.filterAll') },
    { key: 'today', label: t('admin.filterToday') },
    { key: 'week', label: t('admin.filterWeek') },
    { key: 'month', label: t('admin.filterMonth') },
  ]

  const tooltipStyle = {
    backgroundColor: 'hsl(222, 47%, 11%)',
    border: '1px solid hsl(215, 20%, 20%)',
    borderRadius: '8px',
    color: 'hsl(210, 40%, 95%)',
    fontSize: '12px',
  }

  const axisTickStyle = { fill: 'hsl(215, 20%, 65%)', fontSize: 12 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          {t('admin.title')}
        </h1>
      </div>

      {/* Server Info Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          {/* Server IP */}
          <div className="flex items-center gap-3">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('admin.serverIp')}</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono text-sm">
              {serverInfo?.ip || '...'}
            </span>
          </div>
          {/* Online Visitors */}
          <button
            onClick={() => setShowOnlineVisitors(true)}
            className="flex items-center gap-2 group"
          >
            <div className="relative">
              <Monitor className="h-4 w-4 text-green-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              {t('admin.onlineVisitors')}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 font-mono text-sm">
              {data?.visitors?.filter(v => {
                const lastSeen = new Date(v.lastSeen).getTime()
                return Date.now() - lastSeen < 5 * 60 * 1000 // 5 minutes
              }).length || 0}
            </span>
          </button>
        </div>
        <button
          onClick={() => { setShowApiKeyDialog(true); setUpdateSuccess(false); apiKeyMutation.reset() }}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <KeyRound className="h-4 w-4" />
          {t('admin.apiKeyMgmt')}
        </button>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard label={t('admin.cumulativeVisits')} value={data.stats.cumulativeTotal} icon={<Users className="h-4 w-4" />} />
          <StatCard label={t('admin.cumulativeUniqueIps')} value={data.stats.cumulativeUniqueIps} icon={<Globe className="h-4 w-4" />} />
          <StatCard label={t('admin.uniqueDailyVisits')} value={data.stats.cumulativeUniqueDailyVisits} icon={<TrendingUp className="h-4 w-4" />} />
          <StatCard label={t('admin.avgDuration')} value={formatDuration(data.stats.avgDuration)} icon={<Clock className="h-4 w-4" />} />
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilterMode(f.key); refetch() }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors border ${
              filterMode === f.key
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <LoadingSpinner />}

      {/* Online Visitors Section - 实时访客 */}
      <div className="space-y-4">
        {/* Section Title */}
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Wifi className="h-4 w-4 text-green-400" />
          <span>{t('admin.onlineVisitors')}</span>
          <span className="text-xs text-muted-foreground">
            ({data?.visitors?.filter(v => Date.now() - new Date(v.lastSeen).getTime() < 5 * 60 * 1000).length || 0} {t('admin.online')})
          </span>
        </div>

        {/* Online Visitors Chart & Table Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Online Visitors Status Chart */}
          <div className="lg:col-span-1 rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-green-400" />
              {t('admin.onlineStatus')}
            </h3>
            <div className="space-y-3">
              {/* Online Count */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-muted-foreground">{t('admin.currentOnline')}</span>
                </div>
                <span className="text-2xl font-bold text-green-400">
                  {data?.visitors?.filter(v => Date.now() - new Date(v.lastSeen).getTime() < 5 * 60 * 1000).length || 0}
                </span>
              </div>
              {/* Cumulative Total */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-sm text-muted-foreground">{t('admin.cumulativeVisits')}</span>
                <span className="text-lg font-semibold text-primary">{data?.stats?.cumulativeTotal || 0}</span>
              </div>
              {/* Cumulative Unique IPs */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/5 border border-secondary/10">
                <span className="text-sm text-muted-foreground">{t('admin.cumulativeUniqueIps')}</span>
                <span className="text-lg font-semibold text-secondary">{data?.stats?.cumulativeUniqueIps || 0}</span>
              </div>
              {/* Avg Duration */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <span className="text-sm text-muted-foreground">{t('admin.avgDuration')}</span>
                <span className="text-lg font-semibold text-orange-400">{formatDuration(data?.stats?.avgDuration || 0)}</span>
              </div>
              {/* Max Duration */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <span className="text-sm text-muted-foreground">{t('admin.maxDuration')}</span>
                <span className="text-lg font-semibold text-blue-400">{formatDuration(durationStats.max)}</span>
              </div>
            </div>
          </div>

          {/* Recent Visitors Table */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                {t('admin.recentVisitors')}
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                  <tr className="border-b border-border text-muted-foreground text-xs">
                    <th className="text-left py-2 px-3">#</th>
                    <th className="text-left py-2 px-3">IP</th>
                    <th className="text-left py-2 px-3">{t('admin.country')}</th>
                    <th className="text-left py-2 px-3">{t('admin.lastSeen')}</th>
                    <th className="text-left py-2 px-3">{t('admin.pages')}</th>
                    <th className="text-center py-2 px-3">{t('admin.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.visitors && data.visitors.length > 0 ? (
                    data.visitors
                      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
                      .slice(0, 20)
                      .map((v, i) => {
                        const isOnline = Date.now() - new Date(v.lastSeen).getTime() < 5 * 60 * 1000
                        return (
                          <tr key={v.sessionId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-2 px-3 text-muted-foreground text-xs">{i + 1}</td>
                            <td className="py-2 px-3 font-mono text-xs">{v.ip}</td>
                            <td className="py-2 px-3 text-xs">{v.country || 'Unknown'}</td>
                            <td className="py-2 px-3 text-xs">{formatTime(v.lastSeen)}</td>
                            <td className="py-2 px-3 text-xs text-right text-orange-400">{formatDuration(v.duration || 0)}</td>
                            <td className="py-2 px-3 text-xs text-muted-foreground max-w-[150px] truncate">
                              {v.pages?.slice(-2).join(', ')}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {isOnline ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                  {t('admin.online')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                                  {t('admin.offline')}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">{t('common.noData')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {data?.visitors && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Daily Visit Trend */}
            <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                {t('admin.dailyTrend')}
              </h2>
              {dailyTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dailyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" />
                    <XAxis dataKey="date" tick={axisTickStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#eab308"
                      strokeWidth={2}
                      dot={{ fill: '#eab308', r: 3 }}
                      activeDot={{ r: 5 }}
                      name={t('admin.visits')}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">{t('common.noData')}</div>
              )}
            </div>

            {/* Hourly Distribution */}
            <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-secondary" />
                {t('admin.hourlyDist')}
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" />
                  <XAxis dataKey="hour" tick={axisTickStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name={t('admin.visits')}>
                    {hourlyData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.count >= maxHourlyCount * 0.7 ? '#eab308' : '#8b5cf6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Duration Distribution */}
            <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-orange-400" />
                {t('admin.durationDist')}
              </h2>
              {durationData.some(d => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={durationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" />
                    <XAxis dataKey="range" tick={axisTickStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} name={t('admin.visits')}>
                      {durationData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={['#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'][i % 6]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">{t('common.noData')}</div>
              )}
            </div>

            {/* Country Distribution */}
            <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-green-400" />
                {t('admin.country')}
              </h2>
              {countryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={countryData}
                      dataKey="count"
                      nameKey="country"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {countryData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">{t('common.noData')}</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Visitor Table */}
      {data?.visitors && (
        <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-3 px-4">#</th>
                  <th className="text-left py-3 px-4">IP</th>
                  <th className="text-left py-3 px-4">{t('admin.country')}</th>
                  <th className="text-left py-3 px-4">{t('admin.firstSeen')}</th>
                  <th className="text-left py-3 px-4">{t('admin.lastSeen')}</th>
                  <th className="text-right py-3 px-4">{t('admin.duration')}</th>
                  <th className="text-left py-3 px-4">{t('admin.pages')}</th>
                </tr>
              </thead>
              <tbody>
                {data.visitors.map((v, i) => (
                  <tr key={v.sessionId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-4 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 px-4 font-mono text-xs">{v.ip}</td>
                    <td className="py-2 px-4 text-xs">{v.country || 'Unknown'}</td>
                    <td className="py-2 px-4 text-xs">{formatTime(v.firstSeen)}</td>
                    <td className="py-2 px-4 text-xs">{formatTime(v.lastSeen)}</td>
                    <td className="py-2 px-4 text-right text-primary font-medium">{formatDuration(v.duration)}</td>
                    <td className="py-2 px-4 text-xs text-muted-foreground">{v.pages?.join(', ')}</td>
                  </tr>
                ))}
                {data.visitors.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">{t('common.noData')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* API Key Dialog */}
      {showApiKeyDialog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowApiKeyDialog(false)}>
          <div
            className="bg-card rounded-xl border border-border max-w-2xl w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                {t('admin.apiKeyMgmt')}
              </h2>
              <button onClick={() => setShowApiKeyDialog(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current key */}
            <div>
              <label className="text-sm text-muted-foreground">{t('admin.currentKey')}</label>
              <div className="mt-1 rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground break-all">
                {serverInfo?.apiKey || '...'}
              </div>
            </div>

            {/* New key input */}
            <div>
              <label className="text-sm text-muted-foreground">{t('admin.newKey')}</label>
              <textarea
                value={newApiKeyInput}
                onChange={(e) => setNewApiKeyInput(e.target.value)}
                rows={4}
                placeholder="eyJ0eXAiOiJKV1Qi..."
                className="mt-1 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
              />
            </div>

            {/* Status messages */}
            {apiKeyMutation.isError && (
              <p className="text-sm text-destructive">{t('admin.updateFailed')}</p>
            )}
            {updateSuccess && (
              <p className="text-sm text-green-400">{t('admin.updateSuccess')}</p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApiKeyDialog(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('admin.cancel')}
              </button>
              <button
                onClick={handleUpdateApiKey}
                disabled={!newApiKeyInput.trim() || apiKeyMutation.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {apiKeyMutation.isPending ? t('common.loading') : t('admin.updateKey')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Online Visitors Dialog */}
      {showOnlineVisitors && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowOnlineVisitors(false)}>
          <div
            className="bg-card rounded-xl border border-border max-w-4xl w-full max-h-[80vh] p-6 space-y-4 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Wifi className="h-5 w-5 text-green-400" />
                {t('admin.onlineVisitors')}
                <span className="text-sm font-normal text-muted-foreground">
                  ({data?.visitors?.filter(v => Date.now() - new Date(v.lastSeen).getTime() < 5 * 60 * 1000).length || 0})
                </span>
              </h2>
              <button onClick={() => setShowOnlineVisitors(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Online Visitors Table */}
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 px-4">#</th>
                    <th className="text-left py-3 px-4">IP</th>
                    <th className="text-left py-3 px-4">{t('admin.country')}</th>
                    <th className="text-left py-3 px-4">{t('admin.lastSeen')}</th>
                    <th className="text-left py-3 px-4">{t('admin.pages')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.visitors
                    ?.filter(v => Date.now() - new Date(v.lastSeen).getTime() < 5 * 60 * 1000)
                    ?.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
                    ?.map((v, i) => (
                    <tr key={v.sessionId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-4 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          {v.ip}
                        </div>
                      </td>
                      <td className="py-2 px-4 text-xs">{v.country || 'Unknown'}</td>
                      <td className="py-2 px-4 text-xs text-primary">{formatTime(v.lastSeen)}</td>
                      <td className="py-2 px-4 text-xs text-muted-foreground">{v.pages?.slice(-3).join(', ')}</td>
                    </tr>
                  ))}
                  {(!data?.visitors?.filter(v => Date.now() - new Date(v.lastSeen).getTime() < 5 * 60 * 1000).length) && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">{t('admin.noOnlineVisitors')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
