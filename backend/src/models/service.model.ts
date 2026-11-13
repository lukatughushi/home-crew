import type { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'

export const serviceInclude = {
  packages: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
  _count: { select: { pros: { where: { isActive: true, status: 'APPROVED' } } } },
} satisfies Prisma.ServiceInclude

type ServiceRow = Prisma.ServiceGetPayload<{ include: typeof serviceInclude }>

export interface RatingStats {
  rating: number | null
  reviews: number
}

/** Average rating + count per service, from reviews attached to that service's bookings. */
export async function ratingsByService(): Promise<Map<string, RatingStats>> {
  const rows = await prisma.review.findMany({
    where: { booking: { isNot: null } },
    select: { rating: true, booking: { select: { serviceId: true } } },
  })
  return aggregate(rows.map((r) => [r.booking!.serviceId, r.rating]))
}

export function aggregate<K>(pairs: [K, number][]): Map<K, RatingStats> {
  const sums = new Map<K, { sum: number; n: number }>()
  for (const [key, rating] of pairs) {
    const s = sums.get(key) ?? { sum: 0, n: 0 }
    s.sum += rating
    s.n += 1
    sums.set(key, s)
  }
  const out = new Map<K, RatingStats>()
  for (const [key, { sum, n }] of sums) out.set(key, { rating: Math.round((sum / n) * 100) / 100, reviews: n })
  return out
}

/** API shape shared by the public site and the admin panel. */
export function toServiceDto(s: ServiceRow, stats?: RatingStats) {
  return {
    id: s.id,
    name: s.name,
    service: s.service,
    keywords: s.keywords,
    description: s.description,
    photo: s.photo,
    photoUrl: s.photoUrl,
    icon: s.icon,
    included: s.included,
    excluded: s.excluded,
    priceFrom: Number(s.priceFrom),
    commissionPercent: Number(s.commissionPercent),
    isActive: s.isActive,
    sortOrder: s.sortOrder,
    packages: s.packages.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      isPopular: p.isPopular,
      sortOrder: p.sortOrder,
    })),
    pros: s._count.pros,
    rating: stats?.rating ?? null,
    reviews: stats?.reviews ?? 0,
  }
}

/** Public site never needs the commission. */
export function toPublicServiceDto(s: ServiceRow, stats?: RatingStats) {
  const { commissionPercent: _c, ...rest } = toServiceDto(s, stats)
  return rest
}
