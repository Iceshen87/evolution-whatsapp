export interface ClanBadgeUrls {
  small: string
  large: string
  medium: string
}

export interface ClanMember {
  tag: string
  name: string
  role: 'leader' | 'coLeader' | 'admin' | 'member'
  expLevel: number
  league?: {
    id: number
    name: string
    iconUrls: {
      small: string
      tiny: string
      medium?: string
    }
  }
  trophies: number
  clanRank: number
  previousClanRank: number
  donations: number
  donationsReceived: number
  builderBaseTrophies?: number
}

export interface Clan {
  tag: string
  name: string
  type: 'open' | 'inviteOnly' | 'closed'
  description: string
  badgeUrls: ClanBadgeUrls
  clanLevel: number
  clanPoints: number
  clanBuilderBasePoints: number
  clanCapitalPoints: number
  requiredTrophies: number
  warFrequency: string
  warWinStreak: number
  warWins: number
  warTies: number
  warLosses: number
  isWarLogPublic: boolean
  members: number
  memberList: ClanMember[]
  labels: Array<{
    id: number
    name: string
    iconUrls: { small: string; medium: string }
  }>
  location?: {
    id: number
    name: string
    isCountry: boolean
    countryCode?: string
  }
  chatLanguage?: {
    id: number
    name: string
    languageCode: string
  }
}
