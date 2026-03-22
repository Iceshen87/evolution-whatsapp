export interface Location {
  id: number
  name: string
  isCountry: boolean
  countryCode?: string
}

export interface LocationListResponse {
  items: Location[]
}

export interface ClanRanking {
  tag: string
  name: string
  location: Location
  badgeUrls: { small: string; large: string; medium: string }
  clanLevel: number
  members: number
  clanPoints: number
  rank: number
  previousRank: number
}

export interface ClanRankingResponse {
  items: ClanRanking[]
}
