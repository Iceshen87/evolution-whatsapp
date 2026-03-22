export interface WarAttack {
  attackerTag: string
  defenderTag: string
  stars: number
  destructionPercentage: number
  order: number
  duration: number
}

export interface WarMember {
  tag: string
  name: string
  townhallLevel: number
  mapPosition: number
  attacks?: WarAttack[]
  opponentAttacks: number
  bestOpponentAttack?: WarAttack
}

export interface WarClan {
  tag: string
  name: string
  badgeUrls: {
    small: string
    large: string
    medium: string
  }
  clanLevel: number
  attacks: number
  stars: number
  destructionPercentage: number
  members: WarMember[]
}

export interface ClanWar {
  state: 'notInWar' | 'preparation' | 'inWar' | 'warEnded'
  teamSize: number
  attacksPerMember: number
  preparationStartTime: string
  startTime: string
  endTime: string
  clan: WarClan
  opponent: WarClan
}

export interface WarLogEntry {
  result: 'win' | 'lose' | 'tie'
  endTime: string
  teamSize: number
  attacksPerMember: number
  clan: {
    tag: string
    name: string
    badgeUrls: { small: string; large: string; medium: string }
    clanLevel: number
    attacks: number
    stars: number
    destructionPercentage: number
  }
  opponent: {
    tag: string
    name: string
    badgeUrls: { small: string; large: string; medium: string }
    clanLevel: number
    stars: number
    destructionPercentage: number
  }
}

export interface WarLogResponse {
  items: WarLogEntry[]
}
