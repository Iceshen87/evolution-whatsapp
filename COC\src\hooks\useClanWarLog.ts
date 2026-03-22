import { useQuery } from '@tanstack/react-query'
import { getClanWarLog } from '@/services/cocApi'

export function useClanWarLog(clanTag: string) {
  return useQuery({
    queryKey: ['warlog', clanTag],
    queryFn: () => getClanWarLog(clanTag),
    enabled: !!clanTag,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })
}
