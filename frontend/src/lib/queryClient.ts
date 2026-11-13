import { QueryCache, QueryClient } from '@tanstack/react-query'
import { isUnauthorized } from '@/services/adminApi'

export const ADMIN_ME = ['admin', 'me'] as const

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    // Session expired mid-use → clear the cached admin so the guard redirects to the login page.
    onError: (err) => {
      if (isUnauthorized(err)) queryClient.setQueryData(ADMIN_ME, null)
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: (count, err) => !isUnauthorized(err) && count < 2,
      refetchOnWindowFocus: true,
    },
  },
})
