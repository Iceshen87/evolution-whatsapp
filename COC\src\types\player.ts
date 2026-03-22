export interface Player {
  tag: string
  name: string
  townHallLevel: number
  expLevel: number
  trophies: number
  bestTrophies: number
  warStars: number
  attackWins: number
  defenseWins: number
  builderBaseTrophies: number
  donations: number
  donationsReceived: number
  role: string
  clan?: {
    tag: string
    name: string
    clanLevel: number
    badgeUrls: { small: string; large: string; medium: string }
  }
  league?: {
    id: number
    name: string
    iconUrls: { small: string; tiny: string; medium?: string }
  }
}
