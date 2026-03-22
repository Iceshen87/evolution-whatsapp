import { useQuery } from '@tanstack/react-query'
import { getClanRankings } from '@/services/cocApi'

export function useClanRankings(locationId: number, limit = 50) {
  return useQuery({
    queryKey: ['rankings', locationId, limit],
    queryFn: () => getClanRankings(locationId, limit),
    enabled: !!locationId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })
}
