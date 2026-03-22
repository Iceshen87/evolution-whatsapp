import { useQuery } from '@tanstack/react-query'
import { getPlayerInfo } from '@/services/cocApi'

export function usePlayerInfo(playerTag: string) {
  return useQuery({
    queryKey: ['player', playerTag],
    queryFn: () => getPlayerInfo(playerTag),
    enabled: !!playerTag,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })
}
