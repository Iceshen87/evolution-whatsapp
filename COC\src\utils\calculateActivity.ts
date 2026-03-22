import type { ClanMember } from '@/types/clan'

export function calculateActivity(
  member: ClanMember,
  allMembers: ClanMember[]
): number {
  const maxTrophies = Math.max(...allMembers.map((m) => m.trophies), 1)
  const maxDonations = Math.max(...allMembers.map((m) => m.donations), 1)
  const maxLevel = Math.max(...allMembers.map((m) => m.expLevel), 1)

  const trophyScore = (member.trophies / maxTrophies) * 40
  const donationScore = (member.donations / maxDonations) * 40
  const levelScore = (member.expLevel / maxLevel) * 20

  return Math.round(trophyScore + donationScore + levelScore)
}

export function getActivityLabel(score: number): 'excellent' | 'good' | 'average' {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  return 'average'
}
