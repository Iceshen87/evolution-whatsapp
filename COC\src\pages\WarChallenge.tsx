import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Swords, Globe, MessageCircle, Mail, Clock, Shield, CheckCircle, Calendar, Timer, Ban, ScrollText } from 'lucide-react'
import axios from 'axios'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface Challenge {
  id: string
  clanName: string
  clanTag: string
  leaderName: string
  contactType: 'email' | 'telegram' | 'wechat' | 'x'
  contactValue: string
  preferredDate: string
  preferredTime: string
  teamSize: '5v5' | '10v10' | '15v15' | ''
  thLevel: 'th18' | 'th17' | 'th16' | 'th15' | 'th14' | 'th13' | ''
  difficulty: 'esports' | 'diamond' | 'normal'
  matchDuration: '45min' | 'custom'
  customDuration: string
  officialSchedule: boolean
  bannedTroops: string
  notes: string
  rules: string[]
  server: 'international' | 'china'
  createdAt: string
  status: 'active' | 'matched' | 'cancelled'
}

const TEAM_SIZES = [
  { value: '5v5', label: '5v5' },
]

const TH_LEVELS = [
  { value: 'th18', label: 'TH18' },
  { value: 'th17', label: 'TH17' },
  { value: 'th16', label: 'TH16' },
  { value: 'th15', label: 'TH15' },
  { value: 'th14', label: 'TH14' },
  { value: 'th13', label: 'TH13' },
]

const DIFFICULTY_LEVELS = [
  { value: 'esports', label: '电竞', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
  { value: 'diamond', label: '钻石', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { value: 'normal', label: '普通', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
]

export default function WarChallenge() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<{
    clanName: string
    clanTag: string
    leaderName: string
    contactType: 'email' | 'telegram' | 'wechat' | 'x'
    contactValue: string
    preferredDate: string
    preferredTime: string
    teamSize: '5v5' | '10v10' | '15v15' | ''
    thLevel: 'th18' | 'th17' | 'th16' | 'th15' | 'th14' | 'th13' | ''
    difficulty: 'esports' | 'diamond' | 'normal'
    matchDuration: '45min' | 'custom'
    customDuration: string
    officialSchedule: boolean
    bannedTroops: string
    notes: string
    rules: string[]
    server: 'international' | 'china'
  }>({
    clanName: '',
    clanTag: '',
    leaderName: '',
    contactType: 'email',
    contactValue: '',
    preferredDate: '',
    preferredTime: '',
    teamSize: '',
    thLevel: '',
    difficulty: 'normal',
    matchDuration: '45min',
    customDuration: '',
    officialSchedule: true,
    bannedTroops: '',
    notes: '',
    rules: [],
    server: 'international',
  })
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Fetch challenges
  const { data: challenges, isLoading } = useQuery<Challenge[]>({
    queryKey: ['war-challenges'],
    queryFn: async () => {
      const { data } = await axios.get('/site/war-challenges')
      return data.challenges
    },
  })

  // Submit challenge
  const [submitError, setSubmitError] = useState('')
  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      setSubmitError('')
      await axios.post('/site/war-challenges', data)
    },
    onSuccess: () => {
      setSubmitSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['war-challenges'] })
      setTimeout(() => {
        setShowForm(false)
        setSubmitSuccess(false)
        setFormData({
          clanName: '',
          clanTag: '',
          leaderName: '',
          contactType: 'email',
          contactValue: '',
          preferredDate: '',
          preferredTime: '',
          teamSize: '',
          thLevel: '',
          difficulty: 'normal',
          matchDuration: '45min',
          customDuration: '',
          officialSchedule: true,
          bannedTroops: '',
          notes: '',
          rules: [],
          server: 'international',
        })
      }, 2000)
    },
    onError: (error: any) => {
      setSubmitError(error.response?.data?.message || error.message || '提交失败，请重试')
    },
  })

  // Delete challenge
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/site/war-challenges/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['war-challenges'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clanName || !formData.leaderName || !formData.contactValue) return
    submitMutation.mutate(formData)
  }

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'telegram': return <MessageCircle className="h-4 w-4" />
      case 'wechat': return <MessageCircle className="h-4 w-4" />
      case 'x': return <span className="h-4 w-4 flex items-center justify-center font-bold text-xs">𝕏</span>
      default: return <Mail className="h-4 w-4" />
    }
  }

  const getContactLabel = (type: string) => {
    switch (type) {
      case 'email': return '📧 Email'
      case 'telegram': return '✈️ Telegram'
      case 'wechat': return '💬 微信'
      case 'x': return '𝕏 X (Twitter)'
      default: return type
    }
  }

  const getServerFlag = (server: string) => {
    return server === 'international' ? '🌐' : '🇨🇳'
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return t('warChallenge.flexible')
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
            <Swords className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('warChallenge.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('warChallenge.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 text-sm font-medium text-white hover:from-red-600 hover:to-orange-600 transition-all shadow-lg shadow-red-500/20"
        >
          <Swords className="h-4 w-4" />
          {t('warChallenge.postChallenge')}
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <Globe className="h-4 w-4 text-blue-400" />
            {t('warChallenge.international')}
          </div>
          <p className="text-2xl font-bold text-foreground">
            {challenges?.filter(c => c.server === 'international' && c.status === 'active').length || 0}
          </p>
          <p className="text-xs text-muted-foreground">{t('warChallenge.activeChallenges')}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <span className="text-lg">🇨🇳</span>
            {t('warChallenge.china')}
          </div>
          <p className="text-2xl font-bold text-foreground">
            {challenges?.filter(c => c.server === 'china' && c.status === 'active').length || 0}
          </p>
          <p className="text-xs text-muted-foreground">{t('warChallenge.activeChallenges')}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            {t('warChallenge.totalMatches')}
          </div>
          <p className="text-2xl font-bold text-foreground">{challenges?.length || 0}</p>
          <p className="text-xs text-muted-foreground">{t('warChallenge.posted')}</p>
        </div>
      </div>

      {/* Server Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('warChallenge.filter')}:</span>
        {['all', 'international', 'china'].map((server) => (
          <button
            key={server}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors border border-border text-muted-foreground hover:text-foreground"
          >
            {server === 'all' ? t('warChallenge.allServers') : 
             server === 'international' ? `🌐 ${t('warChallenge.international')}` : 
             `🇨🇳 ${t('warChallenge.china')}`}
          </button>
        ))}
      </div>

      {isLoading && <LoadingSpinner />}

      {/* Challenges List */}
      {challenges && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges
            .filter(c => c.status === 'active')
            .map((challenge) => (
            <div
              key={challenge.id}
              className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-colors"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-border bg-gradient-to-r from-red-500/5 to-orange-500/5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{challenge.clanName}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{challenge.clanTag}</p>
                  </div>
                  <span className="text-2xl" title={challenge.server === 'international' ? t('warChallenge.international') : t('warChallenge.china')}>
                    {getServerFlag(challenge.server)}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {/* TH Level & Team Size & Difficulty */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                    {challenge.thLevel?.toUpperCase() || 'TH?'}
                  </span>
                  {challenge.teamSize && (
                    <span className="text-xs px-2 py-1 rounded bg-secondary/10 text-secondary font-medium">
                      {challenge.teamSize}
                    </span>
                  )}
                  {challenge.difficulty && (
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      challenge.difficulty === 'esports' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                      challenge.difficulty === 'diamond' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                      'bg-green-500/10 text-green-400 border border-green-500/30'
                    }`}>
                      {challenge.difficulty === 'esports' ? '电竞' : 
                       challenge.difficulty === 'diamond' ? '钻石' : '普通'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('warChallenge.leader')}:</span>
                  <span className="font-medium">{challenge.leaderName}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {getContactIcon(challenge.contactType)}
                  <span className="text-muted-foreground">{t('warChallenge.contact')}:</span>
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{challenge.contactValue}</span>
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('warChallenge.date')}:</span>
                  <span className="text-xs">{formatDate(challenge.preferredDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('warChallenge.time')}:</span>
                  <span className="text-xs">{challenge.preferredTime || t('warChallenge.flexible')}</span>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('warChallenge.duration')}:</span>
                  <span className="text-xs">
                    {challenge.matchDuration === '45min' ? '45分钟' : challenge.customDuration}
                  </span>
                </div>

                {/* Official Schedule */}
                {challenge.officialSchedule && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <ScrollText className="h-4 w-4" />
                    <span className="text-xs">{t('warChallenge.officialSchedule')}</span>
                  </div>
                )}

                {/* Banned Troops */}
                {challenge.bannedTroops && (
                  <div className="flex items-center gap-2 text-sm">
                    <Ban className="h-4 w-4 text-orange-400" />
                    <span className="text-muted-foreground text-xs">{t('warChallenge.bannedTroops')}:</span>
                    <span className="text-xs text-orange-400">{challenge.bannedTroops}</span>
                  </div>
                )}

                {/* Notes */}
                {challenge.notes && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">{t('warChallenge.notes')}:</p>
                    <p className="text-xs text-foreground bg-muted/30 p-2 rounded">{challenge.notes}</p>
                  </div>
                )}

                {/* Posted Time */}
                <p className="text-xs text-muted-foreground pt-2">
                  {t('warChallenge.postedAt')}: {new Date(challenge.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Card Actions */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => deleteMutation.mutate(challenge.id)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                >
                  <span className="h-3 w-3">🗑️</span>
                  {t('warChallenge.delete')}
                </button>
              </div>
            </div>
          ))}
          
          {challenges.filter(c => c.status === 'active').length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <Swords className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t('warChallenge.noChallenges')}</p>
              <p className="text-sm mt-1">{t('warChallenge.beFirst')}</p>
            </div>
          )}
        </div>
      )}

      {/* Post Challenge Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div
            className="bg-card rounded-xl border border-border max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Swords className="h-5 w-5 text-red-400" />
                {t('warChallenge.postChallenge')}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
                <p className="text-lg font-medium text-green-400">{t('warChallenge.success')}</p>
                <p className="text-sm text-muted-foreground">{t('warChallenge.successDesc')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Message */}
                {submitError && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    {submitError}
                  </div>
                )}
                {/* Server Selection */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">{t('warChallenge.selectServer')} *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, server: 'international' }))}
                      className={`p-3 rounded-lg border transition-all ${
                        formData.server === 'international'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-border hover:border-blue-500/50'
                      }`}
                    >
                      <span className="text-2xl mb-1 block">🌐</span>
                      <span className="text-sm font-medium">{t('warChallenge.international')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, server: 'china' }))}
                      className={`p-3 rounded-lg border transition-all ${
                        formData.server === 'china'
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-border hover:border-red-500/50'
                      }`}
                    >
                      <span className="text-2xl mb-1 block">🇨🇳</span>
                      <span className="text-sm font-medium">{t('warChallenge.china')}</span>
                    </button>
                  </div>
                </div>

                {/* TH Level & Team Size & Difficulty */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">{t('warChallenge.thLevel')}</label>
                    <select
                      value={formData.thLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, thLevel: e.target.value as any }))}
                      className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">{t('warChallenge.selectThLevel')}</option>
                      {TH_LEVELS.map(th => (
                        <option key={th.value} value={th.value}>{th.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">{t('warChallenge.teamSize')}</label>
                    <select
                      value={formData.teamSize}
                      onChange={(e) => setFormData(prev => ({ ...prev, teamSize: e.target.value as any }))}
                      className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">{t('warChallenge.selectTeamSize')}</option>
                      {TEAM_SIZES.map(size => (
                        <option key={size.value} value={size.value}>{size.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">{t('warChallenge.difficulty')}</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {DIFFICULTY_LEVELS.map(diff => (
                        <option key={diff.value} value={diff.value}>{diff.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Clan Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">{t('warChallenge.clanName')} *</label>
                    <input
                      type="text"
                      value={formData.clanName}
                      onChange={(e) => setFormData(prev => ({ ...prev, clanName: e.target.value }))}
                      placeholder="例如：皇家守卫"
                      className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">{t('warChallenge.clanTag')}</label>
                    <input
                      type="text"
                      value={formData.clanTag}
                      onChange={(e) => setFormData(prev => ({ ...prev, clanTag: e.target.value }))}
                      placeholder="#2PP..."
                      className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                {/* Leader Name */}
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">{t('warChallenge.leaderName')} *</label>
                  <input
                    type="text"
                    value={formData.leaderName}
                    onChange={(e) => setFormData(prev => ({ ...prev, leaderName: e.target.value }))}
                    placeholder="首领昵称"
                    className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>

                {/* Contact Info */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">{t('warChallenge.contactType')} *</label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {(['email', 'telegram', 'wechat', 'x'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, contactType: type }))}
                        className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                          formData.contactType === type
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {getContactLabel(type)}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.contactValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactValue: e.target.value }))}
                    placeholder={
                      formData.contactType === 'email' ? 'example@email.com' :
                      formData.contactType === 'telegram' ? '@username' :
                      formData.contactType === 'x' ? '@username' : '微信号'
                    }
                    className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">{t('warChallenge.preferredDate')}</label>
                    <input
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                      className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">{t('warChallenge.preferredTime')}</label>
                    <input
                      type="text"
                      value={formData.preferredTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                      placeholder={t('warChallenge.timePlaceholder')}
                      className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                {/* Match Duration */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">{t('warChallenge.matchDuration')}</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="duration"
                        checked={formData.matchDuration === '45min'}
                        onChange={() => setFormData(prev => ({ ...prev, matchDuration: '45min' }))}
                        className="rounded border-border"
                      />
                      <span className="text-sm">45分钟 (官方)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="duration"
                        checked={formData.matchDuration === 'custom'}
                        onChange={() => setFormData(prev => ({ ...prev, matchDuration: 'custom' }))}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{t('warChallenge.custom')}</span>
                    </label>
                  </div>
                  {formData.matchDuration === 'custom' && (
                    <input
                      type="text"
                      value={formData.customDuration}
                      onChange={(e) => setFormData(prev => ({ ...prev, customDuration: e.target.value }))}
                      placeholder="例如：1小时、90分钟"
                      className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  )}
                </div>

                {/* Official Schedule Checkbox */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <input
                    type="checkbox"
                    id="officialSchedule"
                    checked={formData.officialSchedule}
                    onChange={(e) => setFormData(prev => ({ ...prev, officialSchedule: e.target.checked }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <label htmlFor="officialSchedule" className="text-sm cursor-pointer flex items-center gap-2">
                      <ScrollText className="h-4 w-4 text-green-400" />
                      {t('warChallenge.useOfficialSchedule')}
                    </label>
                    {/* Tooltip */}
                    <div className="relative group">
                      <span className="text-xs text-muted-foreground cursor-help border-b border-dotted border-muted-foreground">
                        {t('warChallenge.scheduleNote')}
                      </span>
                      {/* Tooltip Content */}
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-80 p-3 rounded-lg bg-popover border border-border shadow-lg z-50">
                        <p className="text-xs font-medium text-foreground mb-2">{t('warChallenge.scheduleDetail')}</p>
                        <table className="w-full text-xs">
                          <tbody className="text-muted-foreground">
                            <tr><td className="py-0.5">{t('warChallenge.attack')} 1</td><td>37:00</td><td>{t('warChallenge.guest')}</td></tr>
                            <tr><td className="py-0.5">{t('warChallenge.attack')} 2</td><td>33:00</td><td>{t('warChallenge.home')}</td></tr>
                            <tr><td className="py-0.5">{t('warChallenge.attack')} 3</td><td>29:00</td><td>{t('warChallenge.guest')}</td></tr>
                            <tr><td className="py-0.5">{t('warChallenge.attack')} 4</td><td>25:00</td><td>{t('warChallenge.home')}</td></tr>
                            <tr><td className="py-0.5">{t('warChallenge.attack')} 5</td><td>21:00</td><td>{t('warChallenge.guest')}</td></tr>
                            <tr><td className="py-0.5">{t('warChallenge.attack')} 6</td><td>17:00</td><td>{t('warChallenge.home')}</td></tr>
                            <tr><td className="py-0.5">{t('warChallenge.attack')} 7</td><td>13:00</td><td>{t('warChallenge.guest')}</td></tr>
                            <tr><td className="py-0.5">{t('warChallenge.attack')} 8</td><td>09:00</td><td>{t('warChallenge.home')}</td></tr>
                            <tr><td className="py-0.5">{t('warChallenge.attack')} 9</td><td>05:00</td><td>{t('warChallenge.guest')}</td></tr>
                            <tr><td className="py-0.5">{t('warChallenge.attack')} 10</td><td>01:00</td><td>{t('warChallenge.home')}</td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banned Troops */}
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-2">
                    <Ban className="h-4 w-4 text-orange-400" />
                    {t('warChallenge.bannedTroops')}
                  </label>
                  <input
                    type="text"
                    value={formData.bannedTroops}
                    onChange={(e) => setFormData(prev => ({ ...prev, bannedTroops: e.target.value }))}
                    placeholder={t('warChallenge.bannedTroopsPlaceholder')}
                    className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t('warChallenge.bannedTroopsHint')}</p>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-2">
                    <span className="text-sm">📝</span>
                    {t('warChallenge.notes')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('warChallenge.notesPlaceholder')}
                    rows={3}
                    className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                {/* Submit */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitMutation.isPending || !formData.clanName || !formData.leaderName || !formData.contactValue}
                    className="flex-1 rounded-md bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 text-sm font-medium text-white hover:from-red-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitMutation.isPending ? t('common.loading') : t('warChallenge.post')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
