import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy, Search, ChevronDown, ChevronUp, Users, X } from 'lucide-react'
import { useLocations } from '@/hooks/useLocations'
import { useClanRankings } from '@/hooks/useClanRankings'
import { useClanInfo } from '@/hooks/useClanInfo'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import ClanBadge from '@/components/common/ClanBadge'
import RoleTag from '@/components/common/RoleTag'
import { formatNumber } from '@/utils/formatNumber'

function ClanMemberPanel({ clanTag, onClose }: { clanTag: string; onClose: () => void }) {
  const { t } = useTranslation()
  const { data: clan, isLoading, error } = useClanInfo(clanTag)

  if (isLoading) return <div className="p-4"><LoadingSpinner text={t('common.loading')} /></div>
  if (error || !clan) return <div className="p-4 text-sm text-muted-foreground">{t('clan.notFound')}</div>

  return (
    <div className="border-t border-border bg-muted/20">
      {/* Clan header inside panel */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <ClanBadge url={clan.badgeUrls.medium} name={clan.name} size="md" />
          <div>
            <h3 className="font-bold text-foreground">{clan.name}</h3>
            <p className="text-xs text-muted-foreground">{clan.tag} · {t('common.level')} {clan.clanLevel} · {clan.members}/50 {t('common.members')}</p>
            {clan.description && (
              <p className="text-xs text-muted-foreground mt-1 max-w-lg truncate">{clan.description}</p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Member list */}
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm">
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 px-4">#</th>
              <th className="text-left py-2 px-4">{t('common.name')}</th>
              <th className="text-left py-2 px-4">{t('common.role')}</th>
              <th className="text-right py-2 px-4">{t('common.level')}</th>
              <th className="text-right py-2 px-4">{t('common.trophies')}</th>
              <th className="text-right py-2 px-4">{t('donations.donated')}</th>
              <th className="text-right py-2 px-4">{t('donations.received')}</th>
            </tr>
          </thead>
          <tbody>
            {clan.memberList
              .sort((a, b) => a.clanRank - b.clanRank)
              .map((m, i) => (
                <tr key={m.tag} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-4 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {m.league && <img src={m.league.iconUrls.tiny} alt="" className="h-4 w-4" />}
                      <span className="font-medium">{m.name}</span>
                    </div>
                  </td>
                  <td className="py-2 px-4"><RoleTag role={m.role} /></td>
                  <td className="py-2 px-4 text-right">{m.expLevel}</td>
                  <td className="py-2 px-4 text-right text-primary font-medium">{formatNumber(m.trophies)}</td>
                  <td className="py-2 px-4 text-right text-green-400">{formatNumber(m.donations)}</td>
                  <td className="py-2 px-4 text-right text-blue-400">{formatNumber(m.donationsReceived)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ClanRankings() {
  const { t } = useTranslation()
  const [locationId, setLocationId] = useState(32000006) // Global
  const [limit, setLimit] = useState(50)
  const [clanTagInput, setClanTagInput] = useState('')
  const [searchTag, setSearchTag] = useState('')
  const [expandedTag, setExpandedTag] = useState<string | null>(null)

  const { data: locations } = useLocations()
  const { data: rankings, isLoading, error, refetch } = useClanRankings(locationId, limit)
  const { data: searchedClan, isLoading: searchLoading, error: searchError } = useClanInfo(searchTag)

  const handleSearchClan = () => {
    const tag = clanTagInput.trim()
    if (!tag) return
    const formatted = tag.startsWith('#') ? tag.toUpperCase() : `#${tag.toUpperCase()}`
    setSearchTag(formatted)
    setExpandedTag(null)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearchClan()
  }

  const toggleExpand = (tag: string) => {
    setExpandedTag(expandedTag === tag ? null : tag)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        {t('rankings.title')}
      </h1>

      {/* Controls */}
      <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Clan tag search */}
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1.5 block">{t('rankings.searchClan')}</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={clanTagInput}
                  onChange={(e) => setClanTagInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t('rankings.enterTag')}
                  className="w-full rounded-md border border-input bg-muted/50 pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>
              <button
                onClick={handleSearchClan}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t('common.search')}
              </button>
            </div>
          </div>

          {/* Display limit */}
          <div className="w-full lg:w-36">
            <label className="text-xs text-muted-foreground mb-1.5 block">{t('rankings.displayCount')}</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
              min={1}
              max={200}
              className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>

          {/* Location selector */}
          <div className="w-full lg:w-48">
            <label className="text-xs text-muted-foreground mb-1.5 block">{t('rankings.selectLocation')}</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(Number(e.target.value))}
              className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            >
              <option value={32000006}>{t('rankings.global')}</option>
              {locations?.items
                .filter((l) => l.isCountry)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Searched Clan Result */}
      {searchTag && (
        <div className="rounded-xl border border-primary/30 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-3 bg-primary/5 border-b border-primary/20">
            <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Search className="h-4 w-4" />
              {t('rankings.searchResult')}
            </h2>
          </div>
          {searchLoading && <div className="p-4"><LoadingSpinner text={t('common.loading')} /></div>}
          {searchError && <div className="p-4 text-sm text-muted-foreground">{t('clan.notFound')}</div>}
          {searchedClan && (
            <>
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleExpand(searchedClan.tag)}
              >
                <div className="flex items-center gap-3">
                  <ClanBadge url={searchedClan.badgeUrls.small} name={searchedClan.name} size="sm" />
                  <div>
                    <div className="font-medium">{searchedClan.name}</div>
                    <div className="text-xs text-muted-foreground">{searchedClan.tag}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{t('common.level')} {searchedClan.clanLevel}</div>
                    <div className="text-sm text-primary font-medium">{formatNumber(searchedClan.clanPoints)} {t('common.points')}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {searchedClan.members}
                  </div>
                  {expandedTag === searchedClan.tag
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
              </div>
              {expandedTag === searchedClan.tag && (
                <ClanMemberPanel clanTag={searchedClan.tag} onClose={() => setExpandedTag(null)} />
              )}
            </>
          )}
        </div>
      )}

      {/* Rankings Table */}
      {isLoading && <LoadingSpinner text={t('common.loading')} />}
      {error && <ErrorMessage onRetry={() => refetch()} />}

      {rankings && (
        <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground bg-muted/30">
                  <th className="text-left py-3 px-4">{t('common.rank')}</th>
                  <th className="text-left py-3 px-4">{t('common.name')}</th>
                  <th className="text-right py-3 px-4">{t('common.level')}</th>
                  <th className="text-right py-3 px-4">{t('common.members')}</th>
                  <th className="text-right py-3 px-4">{t('common.points')}</th>
                  <th className="text-center py-3 px-4 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rankings.items.map((clan) => (
                  <>
                    <tr
                      key={clan.tag}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(clan.tag)}
                    >
                      <td className="py-3 px-4">
                        <span className={`font-bold ${clan.rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                          #{clan.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ClanBadge url={clan.badgeUrls.small} name={clan.name} size="sm" />
                          <div>
                            <div className="font-medium">{clan.name}</div>
                            <div className="text-xs text-muted-foreground">{clan.tag}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">{clan.clanLevel}</td>
                      <td className="py-3 px-4 text-right">{clan.members}</td>
                      <td className="py-3 px-4 text-right text-primary font-medium">
                        {formatNumber(clan.clanPoints)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {expandedTag === clan.tag
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground inline-block" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground inline-block" />
                        }
                      </td>
                    </tr>
                    {expandedTag === clan.tag && (
                      <tr key={`${clan.tag}-detail`}>
                        <td colSpan={6} className="p-0">
                          <ClanMemberPanel clanTag={clan.tag} onClose={() => setExpandedTag(null)} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
