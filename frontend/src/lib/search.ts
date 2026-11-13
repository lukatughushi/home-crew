import type { ServiceCategory } from '@/types'

/** Services whose name, service title or keywords contain the query. Empty query → first 4. */
export function matchServices(services: ServiceCategory[], query: string): ServiceCategory[] {
  const q = query.trim().toLowerCase()
  if (!q) return services.slice(0, 4)
  return services.filter((s) => `${s.name} ${s.service} ${s.keywords}`.toLowerCase().includes(q))
}
