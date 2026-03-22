import { useQuery } from '@tanstack/react-query'
import { getCurrentWar } from '@/services/cocApi'

export function useCurrentWar(clanTag: string) {
  return useQuery({
    queryKey: ['currentwar', clanTag],
    queryFn: () => getCurrentWar(clanTag),
    enabled: !!clanTag,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  })
}
