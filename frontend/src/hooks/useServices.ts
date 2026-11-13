import { useEffect, useState } from 'react'
import { getServices } from '@/services/api'
import type { ServiceCategory } from '@/types'

// One shared request for the whole app (Header, Hero and the category grid all need the list).
let cache: Promise<ServiceCategory[]> | null = null

function load() {
  if (!cache) {
    cache = getServices().catch((err) => {
      cache = null // allow a retry on the next mount
      throw err
    })
  }
  return cache
}

export function useServices() {
  const [services, setServices] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    load()
      .then((data) => alive && setServices(data))
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  return { services, loading, error }
}
