import { useQuery } from '@tanstack/react-query'
import { getLocations } from '@/services/cocApi'

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
    staleTime: 60 * 60 * 1000,
  })
}
