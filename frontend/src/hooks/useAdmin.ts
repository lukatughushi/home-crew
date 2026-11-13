import { useQuery } from '@tanstack/react-query'
import { ADMIN_ME } from '@/lib/queryClient'
import { adminApi } from '@/services/adminApi'

/** Logged-in admin; `data` is null when there's no session. */
export function useAdmin() {
  return useQuery({ queryKey: ADMIN_ME, queryFn: adminApi.me, staleTime: 5 * 60_000 })
}

/** Sidebar counters, refreshed every 30 s. */
export function useBadges() {
  return useQuery({ queryKey: ['admin', 'badges'], queryFn: adminApi.badges, refetchInterval: 30_000 })
}
