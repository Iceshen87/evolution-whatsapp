import api from './api'
import type { Clan } from '@/types/clan'
import type { ClanWar, WarLogResponse } from '@/types/war'
import type { Player } from '@/types/player'
import type { LocationListResponse, ClanRankingResponse } from '@/types/rankings'

export async function getClanInfo(clanTag: string): Promise<Clan> {
  const { data } = await api.get(`/clans/${clanTag}`)
  return data
}

export async function getClanWarLog(clanTag: string): Promise<WarLogResponse> {
  const { data } = await api.get(`/clans/${clanTag}/warlog`)
  return data
}

export async function getCurrentWar(clanTag: string): Promise<ClanWar> {
  const { data } = await api.get(`/clans/${clanTag}/currentwar`)
  return data
}

export async function getLocations(): Promise<LocationListResponse> {
  const { data } = await api.get('/locations')
  return data
}

export async function getClanRankings(locationId: number, limit = 50): Promise<ClanRankingResponse> {
  const { data } = await api.get(`/locations/${locationId}/rankings/clans`, {
    params: { limit },
  })
  return data
}

export async function getPlayerInfo(playerTag: string): Promise<Player> {
  const { data } = await api.get(`/players/${playerTag}`)
  return data
}
