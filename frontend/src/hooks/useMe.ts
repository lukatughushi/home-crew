import { useQuery, useQueryClient } from '@tanstack/react-query'
import { account } from '@/services/api'
import type { Me } from '@/types'

export const ME_KEY = ['me']

/** Logged-in website customer, or null. Shared by the header, booking flow and account page. */
export function useMe() {
  const { data, isPending } = useQuery({ queryKey: ME_KEY, queryFn: account.me, staleTime: 60_000 })
  return { me: data ?? null, loading: isPending }
}

/** Put a fresh account object (after login, booking, top-up…) into the shared cache. */
export function useSetMe() {
  const qc = useQueryClient()
  return (me: Me | null) => qc.setQueryData(ME_KEY, me)
}
