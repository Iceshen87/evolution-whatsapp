import { useQuery } from '@tanstack/react-query'
import { getClanInfo } from '@/services/cocApi'

export function useClanInfo(clanTag: string) {
  return useQuery({
    queryKey: ['clan', clanTag],
    queryFn: () => getClanInfo(clanTag),
    enabled: !!clanTag,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })
}
